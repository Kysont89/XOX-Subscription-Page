-- XOX VIP Subscription Database Schema for Neon
-- Run this SQL in Neon SQL Editor to set up the database

-- ============================================================================
-- TABLE: subscriptions
-- Stores all VIP subscription records
-- ============================================================================
CREATE TABLE IF NOT EXISTS subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_address VARCHAR(100) NOT NULL,
  user_name VARCHAR(100) NOT NULL,
  user_email VARCHAR(255) NOT NULL,
  user_phone VARCHAR(50),
  package_name VARCHAR(100) NOT NULL,
  amount DECIMAL(18, 2) NOT NULL,
  network VARCHAR(10) NOT NULL CHECK (network IN ('ETH', 'BNB', 'TRX')),
  tx_hash VARCHAR(100) UNIQUE NOT NULL,
  tx_verified BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  verified_at TIMESTAMPTZ
);

-- Create indexes for common queries
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_address ON subscriptions(user_address);
CREATE INDEX IF NOT EXISTS idx_subscriptions_network ON subscriptions(network);
CREATE INDEX IF NOT EXISTS idx_subscriptions_created_at ON subscriptions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_subscriptions_tx_verified ON subscriptions(tx_verified);

-- ============================================================================
-- TABLE: admins
-- Stores authorized admin wallet addresses
-- ============================================================================
CREATE TABLE IF NOT EXISTS admins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wallet_address VARCHAR(100) UNIQUE NOT NULL,
  name VARCHAR(100),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  is_active BOOLEAN DEFAULT TRUE
);

-- Create index for wallet lookup
CREATE INDEX IF NOT EXISTS idx_admins_wallet_address ON admins(LOWER(wallet_address));

-- ============================================================================
-- TABLE: admin_sessions
-- Stores active admin login sessions
-- ============================================================================
CREATE TABLE IF NOT EXISTS admin_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id UUID REFERENCES admins(id) ON DELETE CASCADE,
  session_token VARCHAR(64) NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for session lookup and cleanup
CREATE INDEX IF NOT EXISTS idx_admin_sessions_token ON admin_sessions(session_token);
CREATE INDEX IF NOT EXISTS idx_admin_sessions_expires ON admin_sessions(expires_at);

-- ============================================================================
-- INSERT YOUR ADMIN WALLET(S) HERE
-- Replace the example address with your actual admin wallet address
-- ============================================================================
INSERT INTO admins (wallet_address, name, is_active)
VALUES
  ('0x742d35cc6634c0532925a3b844bc454e4438f44e', 'Primary Admin', true)
ON CONFLICT (wallet_address) DO NOTHING;

-- Add more admins as needed:
-- INSERT INTO admins (wallet_address, name, is_active)
-- VALUES ('0xYOUR_WALLET_ADDRESS', 'Admin Name', true);
