/**
 * GET /api/subscriptions/list
 * List all subscriptions (admin only)
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getDatabase } from '../../lib/database';

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
    const sql = getDatabase();

    // Verify admin session
    const sessions = await sql`
      SELECT s.*, a.is_active
      FROM admin_sessions s
      JOIN admins a ON s.admin_id = a.id
      WHERE s.session_token = ${sessionToken}
        AND s.expires_at > NOW()
    `;

    if (sessions.length === 0) {
      return res.status(401).json({ error: 'Invalid or expired session' });
    }

    const session = sessions[0];
    if (!session.is_active) {
      return res.status(403).json({ error: 'Admin account is disabled' });
    }

    // Get query parameters for filtering
    const { network, verified, limit = '100', offset = '0' } = req.query;
    const limitNum = Math.min(Number(limit) || 100, 1000);
    const offsetNum = Number(offset) || 0;

    // Build and execute query based on filters
    let subscriptions;
    let countResult;

    if (network && verified !== undefined) {
      const isVerified = verified === 'true';
      subscriptions = await sql`
        SELECT * FROM subscriptions
        WHERE network = ${network} AND tx_verified = ${isVerified}
        ORDER BY created_at DESC
        LIMIT ${limitNum} OFFSET ${offsetNum}
      `;
      countResult = await sql`
        SELECT COUNT(*) as count FROM subscriptions
        WHERE network = ${network} AND tx_verified = ${isVerified}
      `;
    } else if (network) {
      subscriptions = await sql`
        SELECT * FROM subscriptions
        WHERE network = ${network}
        ORDER BY created_at DESC
        LIMIT ${limitNum} OFFSET ${offsetNum}
      `;
      countResult = await sql`
        SELECT COUNT(*) as count FROM subscriptions WHERE network = ${network}
      `;
    } else if (verified !== undefined) {
      const isVerified = verified === 'true';
      subscriptions = await sql`
        SELECT * FROM subscriptions
        WHERE tx_verified = ${isVerified}
        ORDER BY created_at DESC
        LIMIT ${limitNum} OFFSET ${offsetNum}
      `;
      countResult = await sql`
        SELECT COUNT(*) as count FROM subscriptions WHERE tx_verified = ${isVerified}
      `;
    } else {
      subscriptions = await sql`
        SELECT * FROM subscriptions
        ORDER BY created_at DESC
        LIMIT ${limitNum} OFFSET ${offsetNum}
      `;
      countResult = await sql`SELECT COUNT(*) as count FROM subscriptions`;
    }

    return res.status(200).json({
      subscriptions: subscriptions || [],
      total: Number(countResult[0]?.count) || 0,
      limit: limitNum,
      offset: offsetNum
    });
  } catch (error) {
    console.error('List subscriptions error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
