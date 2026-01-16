/**
 * POST /api/subscriptions/create
 * Create a new subscription record after successful payment
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getDatabase } from '../../lib/database';
import { verifyTransaction, getReceivingWallet } from '../../lib/blockchain';

// Input validation
function validateInput(body: unknown): { valid: boolean; error?: string; data?: SubscriptionInput } {
  if (!body || typeof body !== 'object') {
    return { valid: false, error: 'Invalid request body' };
  }

  const data = body as Record<string, unknown>;

  // Required fields
  const requiredFields = ['userAddress', 'userName', 'userEmail', 'packageName', 'amount', 'network', 'txHash'];
  for (const field of requiredFields) {
    if (!data[field]) {
      return { valid: false, error: `Missing required field: ${field}` };
    }
  }

  // Validate address format
  const userAddress = String(data.userAddress);
  if (data.network === 'TRX') {
    if (!userAddress.startsWith('T') || userAddress.length !== 34) {
      return { valid: false, error: 'Invalid Tron address format' };
    }
  } else {
    if (!/^0x[a-fA-F0-9]{40}$/.test(userAddress)) {
      return { valid: false, error: 'Invalid EVM address format' };
    }
  }

  // Validate email format
  const email = String(data.userEmail);
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { valid: false, error: 'Invalid email format' };
  }

  // Validate network
  const network = String(data.network);
  if (!['ETH', 'BNB', 'TRX'].includes(network)) {
    return { valid: false, error: 'Invalid network. Must be ETH, BNB, or TRX' };
  }

  // Validate amount
  const amount = Number(data.amount);
  if (isNaN(amount) || amount <= 0) {
    return { valid: false, error: 'Invalid amount' };
  }

  // Validate tx hash format
  const txHash = String(data.txHash);
  if (data.network === 'TRX') {
    if (!/^[a-fA-F0-9]{64}$/.test(txHash)) {
      return { valid: false, error: 'Invalid Tron transaction hash format' };
    }
  } else {
    if (!/^0x[a-fA-F0-9]{64}$/.test(txHash)) {
      return { valid: false, error: 'Invalid EVM transaction hash format' };
    }
  }

  return {
    valid: true,
    data: {
      userAddress,
      userName: String(data.userName).slice(0, 100),
      userEmail: email,
      userPhone: data.userPhone ? String(data.userPhone).slice(0, 50) : null,
      packageName: String(data.packageName).slice(0, 100),
      amount,
      network,
      txHash
    }
  };
}

interface SubscriptionInput {
  userAddress: string;
  userName: string;
  userEmail: string;
  userPhone: string | null;
  packageName: string;
  amount: number;
  network: string;
  txHash: string;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Only allow POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Validate input
    const validation = validateInput(req.body);
    if (!validation.valid || !validation.data) {
      return res.status(400).json({ error: validation.error });
    }

    const data = validation.data;
    const sql = getDatabase();

    // Check if tx_hash already exists
    const existing = await sql`
      SELECT id FROM subscriptions WHERE tx_hash = ${data.txHash}
    `;

    if (existing.length > 0) {
      return res.status(409).json({ error: 'Transaction already recorded' });
    }

    // Get receiving wallet for verification
    const receivingWallet = getReceivingWallet(data.network);

    // Insert subscription record
    const result = await sql`
      INSERT INTO subscriptions (
        user_address, user_name, user_email, user_phone,
        package_name, amount, network, tx_hash, tx_verified
      ) VALUES (
        ${data.userAddress}, ${data.userName}, ${data.userEmail}, ${data.userPhone},
        ${data.packageName}, ${data.amount}, ${data.network}, ${data.txHash}, false
      )
      RETURNING id, tx_hash, created_at
    `;

    const subscription = result[0];

    // Attempt to verify transaction (async, non-blocking for response)
    if (receivingWallet) {
      verifyTransaction(data.txHash, data.network, receivingWallet, data.amount)
        .then(async (verifyResult) => {
          if (verifyResult.verified) {
            await sql`
              UPDATE subscriptions
              SET tx_verified = true, verified_at = NOW()
              WHERE id = ${subscription.id}
            `;
          }
        })
        .catch(console.error);
    }

    return res.status(201).json({
      success: true,
      subscription: {
        id: subscription.id,
        txHash: subscription.tx_hash,
        createdAt: subscription.created_at
      }
    });
  } catch (error) {
    console.error('Create subscription error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
