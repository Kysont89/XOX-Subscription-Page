/**
 * Supabase Client Configuration
 * Server-side client for API routes
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';

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

// Create Supabase client for server-side use
let supabaseClient: SupabaseClient | null = null;

export function getSupabaseClient(): SupabaseClient {
  if (supabaseClient) {
    return supabaseClient;
  }

  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error('Missing Supabase environment variables');
  }

  supabaseClient = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });

  return supabaseClient;
}

// Create Supabase client for client-side use (with anon key)
export function getSupabaseAnonClient(): SupabaseClient {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Missing Supabase environment variables');
  }

  return createClient(supabaseUrl, supabaseAnonKey);
}

// Helper function to generate session token
export function generateSessionToken(): string {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
}
