/**
 * POST /api/admin/logout
 * Invalidate admin session
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getSupabaseClient } from '../../lib/supabase';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Only allow POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Missing authorization header' });
    }

    const sessionToken = authHeader.slice(7);
    const supabase = getSupabaseClient();

    // Delete the session
    const { error } = await supabase
      .from('admin_sessions')
      .delete()
      .eq('session_token', sessionToken);

    if (error) {
      console.error('Logout error:', error);
      return res.status(500).json({ error: 'Failed to logout' });
    }

    return res.status(200).json({ success: true });
  } catch (error) {
    console.error('Admin logout error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
