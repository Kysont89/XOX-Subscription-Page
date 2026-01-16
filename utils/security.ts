/**
 * Security Utilities for XOX VIP Subscription D-App
 * Provides protection against XSS, data tampering, and unauthorized access
 */

// ============================================================================
// INPUT SANITIZATION & VALIDATION
// ============================================================================

/**
 * Sanitizes user input to prevent XSS attacks
 * Removes or escapes potentially dangerous characters
 */
export function sanitizeInput(input: string): string {
  if (typeof input !== 'string') return '';

  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;')
    .replace(/`/g, '&#96;')
    .trim();
}

/**
 * Decodes sanitized input back to original (for display purposes only)
 */
export function decodeInput(input: string): string {
  if (typeof input !== 'string') return '';

  return input
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#x27;/g, "'")
    .replace(/&#x2F;/g, '/')
    .replace(/&#96;/g, '`');
}

/**
 * Validates and sanitizes a name field
 */
export function validateName(name: string): { valid: boolean; sanitized: string; error?: string } {
  const sanitized = sanitizeInput(name);

  if (!sanitized || sanitized.length < 2) {
    return { valid: false, sanitized, error: 'Name must be at least 2 characters' };
  }

  if (sanitized.length > 100) {
    return { valid: false, sanitized, error: 'Name must be less than 100 characters' };
  }

  // Allow only letters, spaces, hyphens, and apostrophes
  const nameRegex = /^[a-zA-Z\s\-']+$/;
  if (!nameRegex.test(decodeInput(sanitized))) {
    return { valid: false, sanitized, error: 'Name contains invalid characters' };
  }

  return { valid: true, sanitized };
}

/**
 * Validates email format
 */
export function validateEmail(email: string): { valid: boolean; sanitized: string; error?: string } {
  const sanitized = sanitizeInput(email.toLowerCase());

  // RFC 5322 compliant email regex (simplified)
  const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;

  if (!emailRegex.test(decodeInput(sanitized))) {
    return { valid: false, sanitized, error: 'Please enter a valid email address' };
  }

  if (sanitized.length > 254) {
    return { valid: false, sanitized, error: 'Email is too long' };
  }

  return { valid: true, sanitized };
}

/**
 * Validates phone/telegram field
 */
export function validatePhone(phone: string): { valid: boolean; sanitized: string; error?: string } {
  const sanitized = sanitizeInput(phone);

  if (!sanitized || sanitized.length < 5) {
    return { valid: false, sanitized, error: 'Please enter a valid phone or Telegram handle' };
  }

  if (sanitized.length > 50) {
    return { valid: false, sanitized, error: 'Phone/Telegram is too long' };
  }

  // Allow phone numbers and telegram handles (@username)
  const phoneRegex = /^[\+\d\s\-\(\)@a-zA-Z0-9_]+$/;
  if (!phoneRegex.test(decodeInput(sanitized))) {
    return { valid: false, sanitized, error: 'Invalid phone number or Telegram handle format' };
  }

  return { valid: true, sanitized };
}

/**
 * Validates Ethereum address format
 */
export function validateAddress(address: string): boolean {
  if (!address || typeof address !== 'string') return false;
  return /^0x[a-fA-F0-9]{40}$/.test(address);
}

// ============================================================================
// CRYPTOGRAPHIC UTILITIES
// ============================================================================

/**
 * Generates a cryptographically secure random nonce
 */
export function generateNonce(): string {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
}

/**
 * Generates a secure session ID
 */
export function generateSessionId(): string {
  return `session_${Date.now()}_${generateNonce().slice(0, 16)}`;
}

/**
 * Creates a challenge message for wallet signature verification
 */
export function createSignatureChallenge(address: string, nonce: string, timestamp: number): string {
  return `XOX VIP Subscription Authentication\n\nWallet: ${address}\nNonce: ${nonce}\nTimestamp: ${timestamp}\n\nSign this message to verify wallet ownership. This signature will not trigger any blockchain transaction or cost any gas fees.`;
}

/**
 * Creates an admin challenge message
 */
export function createAdminChallenge(address: string, nonce: string, timestamp: number): string {
  return `XOX Admin Authentication\n\nWallet: ${address}\nNonce: ${nonce}\nTimestamp: ${timestamp}\n\nSign this message to access the admin dashboard. This is a security verification and will not cost any gas.`;
}

// ============================================================================
// DATA INTEGRITY (HMAC-like using Web Crypto API)
// ============================================================================

const INTEGRITY_KEY = 'xox_integrity_v1';

/**
 * Creates a hash of the data for integrity verification
 */
export async function createDataHash(data: string): Promise<string> {
  const encoder = new TextEncoder();
  const dataBuffer = encoder.encode(data + INTEGRITY_KEY);
  const hashBuffer = await crypto.subtle.digest('SHA-256', dataBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Verifies data integrity
 */
export async function verifyDataIntegrity(data: string, hash: string): Promise<boolean> {
  const computedHash = await createDataHash(data);
  return computedHash === hash;
}

// ============================================================================
// SECURE STORAGE
// ============================================================================

interface SecureStorageData<T> {
  data: T;
  hash: string;
  timestamp: number;
  version: number;
}

const STORAGE_VERSION = 1;

/**
 * Securely stores data in localStorage with integrity check
 */
export async function secureStore<T>(key: string, data: T): Promise<void> {
  const dataString = JSON.stringify(data);
  const hash = await createDataHash(dataString);

  const storageData: SecureStorageData<T> = {
    data,
    hash,
    timestamp: Date.now(),
    version: STORAGE_VERSION
  };

  localStorage.setItem(key, JSON.stringify(storageData));
}

/**
 * Retrieves and verifies data from localStorage
 */
export async function secureRetrieve<T>(key: string): Promise<{ data: T | null; valid: boolean; error?: string }> {
  try {
    const stored = localStorage.getItem(key);
    if (!stored) {
      return { data: null, valid: true };
    }

    const parsed: SecureStorageData<T> = JSON.parse(stored);

    // Version check
    if (parsed.version !== STORAGE_VERSION) {
      return { data: null, valid: false, error: 'Data version mismatch - data may have been tampered with' };
    }

    // Integrity check
    const dataString = JSON.stringify(parsed.data);
    const isValid = await verifyDataIntegrity(dataString, parsed.hash);

    if (!isValid) {
      return { data: null, valid: false, error: 'Data integrity check failed - data may have been tampered with' };
    }

    return { data: parsed.data, valid: true };
  } catch (error) {
    return { data: null, valid: false, error: 'Failed to parse stored data' };
  }
}

// ============================================================================
// SESSION MANAGEMENT
// ============================================================================

interface WalletSession {
  address: string;
  signature: string;
  nonce: string;
  timestamp: number;
  expiresAt: number;
  isAdmin: boolean;
}

const SESSION_KEY = 'xox_wallet_session';
const SESSION_DURATION = 24 * 60 * 60 * 1000; // 24 hours
const ADMIN_SESSION_DURATION = 1 * 60 * 60 * 1000; // 1 hour for admin

/**
 * Creates a new wallet session after signature verification
 */
export async function createSession(
  address: string,
  signature: string,
  nonce: string,
  isAdmin: boolean = false
): Promise<void> {
  const session: WalletSession = {
    address: address.toLowerCase(),
    signature,
    nonce,
    timestamp: Date.now(),
    expiresAt: Date.now() + (isAdmin ? ADMIN_SESSION_DURATION : SESSION_DURATION),
    isAdmin
  };

  await secureStore(SESSION_KEY, session);
}

/**
 * Retrieves and validates current session
 */
export async function getSession(): Promise<WalletSession | null> {
  const result = await secureRetrieve<WalletSession>(SESSION_KEY);

  if (!result.valid || !result.data) {
    return null;
  }

  // Check expiration
  if (Date.now() > result.data.expiresAt) {
    localStorage.removeItem(SESSION_KEY);
    return null;
  }

  return result.data;
}

/**
 * Clears the current session
 */
export function clearSession(): void {
  localStorage.removeItem(SESSION_KEY);
}

/**
 * Validates if a session belongs to the specified address
 */
export async function validateSessionForAddress(address: string): Promise<boolean> {
  const session = await getSession();
  if (!session) return false;
  return session.address === address.toLowerCase();
}

// ============================================================================
// ADMIN VERIFICATION
// ============================================================================

// Admin wallet addresses (lowercase for comparison)
const ADMIN_WALLETS = new Set([
  '0x742d35cc6634c0532925a3b844bc454e4438f44e'
]);

/**
 * Checks if an address is an admin (basic check)
 */
export function isAdminWallet(address: string | null): boolean {
  if (!address) return false;
  return ADMIN_WALLETS.has(address.toLowerCase());
}

/**
 * Validates admin access with session verification
 */
export async function validateAdminAccess(address: string | null): Promise<{
  isAdmin: boolean;
  hasValidSession: boolean;
  requiresSignature: boolean;
}> {
  if (!address || !isAdminWallet(address)) {
    return { isAdmin: false, hasValidSession: false, requiresSignature: false };
  }

  const session = await getSession();

  if (!session || session.address !== address.toLowerCase()) {
    return { isAdmin: true, hasValidSession: false, requiresSignature: true };
  }

  if (!session.isAdmin) {
    return { isAdmin: true, hasValidSession: false, requiresSignature: true };
  }

  return { isAdmin: true, hasValidSession: true, requiresSignature: false };
}

// ============================================================================
// RATE LIMITING
// ============================================================================

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const rateLimitStore = new Map<string, RateLimitEntry>();

/**
 * Checks if an action is rate limited
 * @param key - Unique identifier for the action
 * @param maxAttempts - Maximum attempts allowed in the window
 * @param windowMs - Time window in milliseconds
 */
export function checkRateLimit(key: string, maxAttempts: number, windowMs: number): {
  allowed: boolean;
  remainingAttempts: number;
  resetIn: number;
} {
  const now = Date.now();
  const entry = rateLimitStore.get(key);

  if (!entry || now > entry.resetAt) {
    rateLimitStore.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, remainingAttempts: maxAttempts - 1, resetIn: windowMs };
  }

  if (entry.count >= maxAttempts) {
    return { allowed: false, remainingAttempts: 0, resetIn: entry.resetAt - now };
  }

  entry.count++;
  return { allowed: true, remainingAttempts: maxAttempts - entry.count, resetIn: entry.resetAt - now };
}

/**
 * Resets rate limit for a key
 */
export function resetRateLimit(key: string): void {
  rateLimitStore.delete(key);
}

// ============================================================================
// SECURITY HEADERS CHECKER
// ============================================================================

/**
 * Checks if security headers are properly configured (for debugging)
 */
export function checkSecurityHeaders(): { header: string; present: boolean; value?: string }[] {
  // This is informational - actual headers must be set on the server
  const headers = [
    'Content-Security-Policy',
    'X-Frame-Options',
    'X-Content-Type-Options',
    'Referrer-Policy',
    'Permissions-Policy'
  ];

  // Note: JavaScript cannot read response headers of the current page
  // This is a placeholder for documentation purposes
  return headers.map(header => ({
    header,
    present: false,
    value: 'Configure in server/CDN settings'
  }));
}

// ============================================================================
// EXPORT SECURITY CONFIG
// ============================================================================

export const SECURITY_CONFIG = {
  SESSION_DURATION,
  ADMIN_SESSION_DURATION,
  MAX_LOGIN_ATTEMPTS: 5,
  LOGIN_LOCKOUT_DURATION: 15 * 60 * 1000, // 15 minutes
  NONCE_EXPIRY: 5 * 60 * 1000, // 5 minutes
  MIN_NAME_LENGTH: 2,
  MAX_NAME_LENGTH: 100,
  MAX_EMAIL_LENGTH: 254,
  MAX_PHONE_LENGTH: 50
};
