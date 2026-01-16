/**
 * GET /api/admin/check
 * Check if a wallet address is an admin
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getDatabase } from '../../lib/database';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Only allow GET
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { address } = req.query;

    if (!address || typeof address !== 'string') {
      return res.status(400).json({ error: 'Wallet address is required' });
    }

    const sql = getDatabase();

    // Check if wallet is in admins table
    const admins = await sql`
      SELECT id, name, is_active
      FROM admins
      WHERE LOWER(wallet_address) = LOWER(${address})
    `;

    if (admins.length === 0) {
      return res.status(200).json({ isAdmin: false });
    }

    const admin = admins[0];
    return res.status(200).json({
      isAdmin: admin.is_active,
      name: admin.name
    });
  } catch (error) {
    console.error('Admin check error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
