/**
 * GET /api/health
 * Health check endpoint
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getDatabase } from '../lib/database';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const checks: Record<string, boolean | string> = {
    api: true,
    timestamp: new Date().toISOString()
  };

  try {
    // Check Neon database connection
    const sql = getDatabase();
    await sql`SELECT 1`;
    checks.database = true;
  } catch (e) {
    checks.database = false;
    checks.databaseError = e instanceof Error ? e.message : 'Unknown error';
  }

  // Check environment variables
  checks.envConfigured = !!(
    process.env.DATABASE_URL &&
    process.env.RECEIVING_WALLET_EVM
  );

  const allHealthy = checks.database === true && checks.envConfigured === true;

  return res.status(allHealthy ? 200 : 503).json({
    status: allHealthy ? 'healthy' : 'degraded',
    checks
  });
}
