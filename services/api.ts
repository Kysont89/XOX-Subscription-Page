/**
 * Frontend API Client
 * Handles all communication with the backend API
 */

const API_BASE = '/api';

// Store admin session token in memory (not localStorage for security)
let adminSessionToken: string | null = null;
let adminSessionExpiry: Date | null = null;

/**
 * Get stored admin session token
 */
export function getAdminToken(): string | null {
  if (!adminSessionToken || !adminSessionExpiry) return null;
  if (new Date() > adminSessionExpiry) {
    adminSessionToken = null;
    adminSessionExpiry = null;
    return null;
  }
  return adminSessionToken;
}

/**
 * Set admin session token
 */
export function setAdminToken(token: string, expiresAt: string): void {
  adminSessionToken = token;
  adminSessionExpiry = new Date(expiresAt);
}

/**
 * Clear admin session
 */
export function clearAdminToken(): void {
  adminSessionToken = null;
  adminSessionExpiry = null;
}

/**
 * Make API request with error handling
 */
async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<{ data?: T; error?: string }> {
  try {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...options.headers
    };

    // Add auth header if we have a token
    const token = getAdminToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${API_BASE}${endpoint}`, {
      ...options,
      headers
    });

    const data = await response.json();

    if (!response.ok) {
      return { error: data.error || `HTTP ${response.status}` };
    }

    return { data };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Network error';
    return { error: message };
  }
}

// ============================================================================
// SUBSCRIPTION ENDPOINTS
// ============================================================================

export interface CreateSubscriptionInput {
  userAddress: string;
  userName: string;
  userEmail: string;
  userPhone?: string;
  packageName: string;
  amount: number;
  network: string;
  txHash: string;
}

export interface SubscriptionResponse {
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

/**
 * Create a new subscription after successful payment
 */
export async function createSubscription(
  input: CreateSubscriptionInput
): Promise<{ data?: { id: string; txHash: string; createdAt: string }; error?: string }> {
  return apiRequest('/subscriptions/create', {
    method: 'POST',
    body: JSON.stringify(input)
  });
}

/**
 * List all subscriptions (admin only)
 */
export async function listSubscriptions(params?: {
  network?: string;
  verified?: boolean;
  limit?: number;
  offset?: number;
}): Promise<{ data?: { subscriptions: SubscriptionResponse[]; total: number }; error?: string }> {
  const searchParams = new URLSearchParams();
  if (params?.network) searchParams.set('network', params.network);
  if (params?.verified !== undefined) searchParams.set('verified', String(params.verified));
  if (params?.limit) searchParams.set('limit', String(params.limit));
  if (params?.offset) searchParams.set('offset', String(params.offset));

  const query = searchParams.toString();
  return apiRequest(`/subscriptions/list${query ? `?${query}` : ''}`);
}

/**
 * Verify a subscription transaction
 */
export async function verifySubscription(
  subscriptionId?: string,
  txHash?: string
): Promise<{ data?: { verified: boolean; error?: string }; error?: string }> {
  return apiRequest('/subscriptions/verify', {
    method: 'POST',
    body: JSON.stringify({ subscriptionId, txHash })
  });
}

// ============================================================================
// ADMIN ENDPOINTS
// ============================================================================

/**
 * Check if wallet is admin
 */
export async function checkAdmin(
  address: string
): Promise<{ data?: { isAdmin: boolean; name?: string }; error?: string }> {
  return apiRequest(`/admin/check?address=${encodeURIComponent(address)}`);
}

/**
 * Admin login with signature
 */
export async function adminLogin(
  address: string,
  signature: string,
  message: string,
  timestamp: number
): Promise<{ data?: { token: string; expiresAt: string }; error?: string }> {
  const result = await apiRequest<{ success: boolean; token: string; expiresAt: string }>(
    '/admin/login',
    {
      method: 'POST',
      body: JSON.stringify({ address, signature, message, timestamp })
    }
  );

  if (result.data?.token) {
    setAdminToken(result.data.token, result.data.expiresAt);
  }

  return result;
}

/**
 * Admin logout
 */
export async function adminLogout(): Promise<{ error?: string }> {
  const result = await apiRequest('/admin/logout', { method: 'POST' });
  clearAdminToken();
  return result;
}

// ============================================================================
// HEALTH CHECK
// ============================================================================

/**
 * Check API health
 */
export async function checkHealth(): Promise<{
  data?: { status: string; checks: Record<string, unknown> };
  error?: string;
}> {
  return apiRequest('/health');
}
