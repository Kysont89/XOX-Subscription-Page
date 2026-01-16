/**
 * POST /api/admin/login
 * Admin login with wallet signature
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { ethers } from 'ethers';
import { getSupabaseClient, generateSessionToken } from '../../lib/supabase';

// Session duration: 1 hour
const SESSION_DURATION_MS = 60 * 60 * 1000;

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Only allow POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { address, signature, message, timestamp } = req.body;

    // Validate required fields
    if (!address || !signature || !message || !timestamp) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Check timestamp is within 5 minutes
    const messageTime = Number(timestamp);
    const now = Date.now();
    if (isNaN(messageTime) || Math.abs(now - messageTime) > 5 * 60 * 1000) {
      return res.status(400).json({ error: 'Message expired or invalid timestamp' });
    }

    const supabase = getSupabaseClient();

    // Check if wallet is admin
    const { data: admin, error: adminError } = await supabase
      .from('admins')
      .select('id, is_active')
      .eq('wallet_address', address.toLowerCase())
      .single();

    if (adminError || !admin) {
      return res.status(403).json({ error: 'Not an admin wallet' });
    }

    if (!admin.is_active) {
      return res.status(403).json({ error: 'Admin account is disabled' });
    }

    // Verify signature
    try {
      const recoveredAddress = ethers.verifyMessage(message, signature);
      if (recoveredAddress.toLowerCase() !== address.toLowerCase()) {
        return res.status(401).json({ error: 'Invalid signature' });
      }
    } catch {
      return res.status(401).json({ error: 'Signature verification failed' });
    }

    // Create session
    const sessionToken = generateSessionToken();
    const expiresAt = new Date(now + SESSION_DURATION_MS);

    // Delete any existing sessions for this admin
    await supabase
      .from('admin_sessions')
      .delete()
      .eq('admin_id', admin.id);

    // Create new session
    const { error: sessionError } = await supabase
      .from('admin_sessions')
      .insert({
        admin_id: admin.id,
        session_token: sessionToken,
        expires_at: expiresAt.toISOString()
      });

    if (sessionError) {
      console.error('Session creation error:', sessionError);
      return res.status(500).json({ error: 'Failed to create session' });
    }

    return res.status(200).json({
      success: true,
      token: sessionToken,
      expiresAt: expiresAt.toISOString()
    });
  } catch (error) {
    console.error('Admin login error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
