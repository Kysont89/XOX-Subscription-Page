/**
 * Neon Database Client
 * Serverless PostgreSQL for API routes
 */

import { neon } from '@neondatabase/serverless';

// Database types
export interface Subscription {
  id: string;
  user_address: string;
  user_name: string;
  user_email: string;
  user_phone: string | null;
  package_name: string;
  amount: number;
  network: string;
  tx_hash: string;
  tx_verified: boolean;
  created_at: string;
  verified_at: string | null;
}

export interface Admin {
  id: string;
  wallet_address: string;
  name: string | null;
  created_at: string;
  is_active: boolean;
}

export interface AdminSession {
  id: string;
  admin_id: string;
  session_token: string;
  expires_at: string;
  created_at: string;
}

/**
 * Get Neon SQL client
 */
export function getDatabase() {
  const databaseUrl = process.env.DATABASE_URL;

  if (!databaseUrl) {
    throw new Error('DATABASE_URL environment variable is not set');
  }

  return neon(databaseUrl);
}

/**
 * Generate session token
 */
export function generateSessionToken(): string {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
}
