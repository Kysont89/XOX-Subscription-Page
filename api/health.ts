/**
 * GET /api/health
 * Health check endpoint
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getSupabaseClient } from '../lib/supabase';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const checks: Record<string, boolean | string> = {
    api: true,
    timestamp: new Date().toISOString()
  };

  try {
    // Check Supabase connection
    const supabase = getSupabaseClient();
    const { error } = await supabase.from('subscriptions').select('id').limit(1);
    checks.database = !error;
    if (error) {
      checks.databaseError = error.message;
    }
  } catch (e) {
    checks.database = false;
    checks.databaseError = e instanceof Error ? e.message : 'Unknown error';
  }

  // Check environment variables
  checks.envConfigured = !!(
    process.env.SUPABASE_URL &&
    process.env.SUPABASE_SERVICE_KEY &&
    process.env.RECEIVING_WALLET_EVM
  );

  const allHealthy = checks.database === true && checks.envConfigured === true;

  return res.status(allHealthy ? 200 : 503).json({
    status: allHealthy ? 'healthy' : 'degraded',
    checks
  });
}
