/**
 * POST /api/admin/logout
 * Invalidate admin session
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getDatabase } from '../../lib/database';

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
    const sql = getDatabase();

    // Delete the session
    await sql`DELETE FROM admin_sessions WHERE session_token = ${sessionToken}`;

    return res.status(200).json({ success: true });
  } catch (error) {
    console.error('Admin logout error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
