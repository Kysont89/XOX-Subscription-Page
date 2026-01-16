/**
 * POST /api/subscriptions/verify
 * Verify a transaction on the blockchain
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getSupabaseClient } from '../../lib/supabase';
import { verifyTransaction, getReceivingWallet } from '../../lib/blockchain';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Only allow POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { subscriptionId, txHash } = req.body;

    if (!subscriptionId && !txHash) {
      return res.status(400).json({ error: 'Either subscriptionId or txHash is required' });
    }

    const supabase = getSupabaseClient();

    // Find the subscription
    let query = supabase.from('subscriptions').select('*');

    if (subscriptionId) {
      query = query.eq('id', subscriptionId);
    } else {
      query = query.eq('tx_hash', txHash);
    }

    const { data: subscription, error: fetchError } = await query.single();

    if (fetchError || !subscription) {
      return res.status(404).json({ error: 'Subscription not found' });
    }

    // Already verified
    if (subscription.tx_verified) {
      return res.status(200).json({
        verified: true,
        message: 'Transaction already verified',
        verifiedAt: subscription.verified_at
      });
    }

    // Get receiving wallet
    const receivingWallet = getReceivingWallet(subscription.network);
    if (!receivingWallet) {
      return res.status(500).json({ error: `Receiving wallet not configured for ${subscription.network}` });
    }

    // Verify on blockchain
    const result = await verifyTransaction(
      subscription.tx_hash,
      subscription.network,
      receivingWallet,
      subscription.amount
    );

    if (result.verified) {
      // Update subscription
      await supabase
        .from('subscriptions')
        .update({
          tx_verified: true,
          verified_at: new Date().toISOString()
        })
        .eq('id', subscription.id);

      return res.status(200).json({
        verified: true,
        message: 'Transaction verified successfully',
        details: {
          from: result.from,
          to: result.to,
          amount: result.amount,
          blockNumber: result.blockNumber,
          timestamp: result.timestamp
        }
      });
    } else {
      return res.status(200).json({
        verified: false,
        error: result.error
      });
    }
  } catch (error) {
    console.error('Verify transaction error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
