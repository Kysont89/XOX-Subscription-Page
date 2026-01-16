/**
 * GET /api/subscriptions/list
 * List all subscriptions (admin only)
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getSupabaseClient } from '../../lib/supabase';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Only allow GET
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Check for admin session token
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Missing authorization header' });
    }

    const sessionToken = authHeader.slice(7);
    const supabase = getSupabaseClient();

    // Verify admin session
    const { data: session, error: sessionError } = await supabase
      .from('admin_sessions')
      .select('*, admins(*)')
      .eq('session_token', sessionToken)
      .gt('expires_at', new Date().toISOString())
      .single();

    if (sessionError || !session) {
      return res.status(401).json({ error: 'Invalid or expired session' });
    }

    // Check if admin is active
    if (!session.admins?.is_active) {
      return res.status(403).json({ error: 'Admin account is disabled' });
    }

    // Get query parameters for filtering
    const { network, verified, limit = '100', offset = '0' } = req.query;

    // Build query
    let query = supabase
      .from('subscriptions')
      .select('*')
      .order('created_at', { ascending: false })
      .range(Number(offset), Number(offset) + Number(limit) - 1);

    // Apply filters
    if (network && typeof network === 'string') {
      query = query.eq('network', network);
    }

    if (verified === 'true') {
      query = query.eq('tx_verified', true);
    } else if (verified === 'false') {
      query = query.eq('tx_verified', false);
    }

    const { data: subscriptions, error: fetchError } = await query;

    if (fetchError) {
      console.error('Fetch error:', fetchError);
      return res.status(500).json({ error: 'Failed to fetch subscriptions' });
    }

    // Get total count
    const { count } = await supabase
      .from('subscriptions')
      .select('*', { count: 'exact', head: true });

    return res.status(200).json({
      subscriptions: subscriptions || [],
      total: count || 0,
      limit: Number(limit),
      offset: Number(offset)
    });
  } catch (error) {
    console.error('List subscriptions error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
