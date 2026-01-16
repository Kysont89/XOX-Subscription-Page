/**
 * Secure Wallet Hook
 * Provides wallet connection with cryptographic signature verification
 */

import { useState, useEffect, useCallback } from 'react';
import {
  generateNonce,
  createSignatureChallenge,
  createAdminChallenge,
  createSession,
  getSession,
  clearSession,
  validateAddress,
  isAdminWallet,
  checkRateLimit,
  SECURITY_CONFIG
} from '../utils/security';

declare global {
  interface Window {
    ethereum?: {
      request: (args: { method: string; params?: unknown[] }) => Promise<unknown>;
      on: (event: string, callback: (accounts: string[]) => void) => void;
      removeListener: (event: string, callback: (accounts: string[]) => void) => void;
      isMetaMask?: boolean;
    };
  }
}

interface WalletState {
  address: string | null;
  isConnected: boolean;
  isVerified: boolean;
  isAdmin: boolean;
  isAdminVerified: boolean;
  isLoading: boolean;
  error: string | null;
}

interface UseSecureWalletReturn extends WalletState {
  connectWallet: (walletId: string) => Promise<boolean>;
  verifyWallet: () => Promise<boolean>;
  verifyAdminAccess: () => Promise<boolean>;
  disconnectWallet: () => void;
  clearError: () => void;
}

export function useSecureWallet(): UseSecureWalletReturn {
  const [state, setState] = useState<WalletState>({
    address: null,
    isConnected: false,
    isVerified: false,
    isAdmin: false,
    isAdminVerified: false,
    isLoading: true,
    error: null
  });

  // Check for existing session on mount
  useEffect(() => {
    const checkExistingSession = async () => {
      try {
        // Check for existing session
        const session = await getSession();

        if (session && window.ethereum) {
          // Verify the wallet is still connected with the same address
          const accounts = await window.ethereum.request({ method: 'eth_accounts' }) as string[];

          if (accounts && accounts.length > 0 && accounts[0].toLowerCase() === session.address) {
            setState({
              address: session.address,
              isConnected: true,
              isVerified: true,
              isAdmin: isAdminWallet(session.address),
              isAdminVerified: session.isAdmin,
              isLoading: false,
              error: null
            });
            return;
          }
        }

        // Check if wallet is connected but no session
        if (window.ethereum) {
          const accounts = await window.ethereum.request({ method: 'eth_accounts' }) as string[];
          if (accounts && accounts.length > 0) {
            const address = accounts[0].toLowerCase();
            setState({
              address,
              isConnected: true,
              isVerified: false,
              isAdmin: isAdminWallet(address),
              isAdminVerified: false,
              isLoading: false,
              error: null
            });
            return;
          }
        }

        setState(prev => ({ ...prev, isLoading: false }));
      } catch (error) {
        console.error('Error checking existing session:', error);
        setState(prev => ({ ...prev, isLoading: false }));
      }
    };

    checkExistingSession();
  }, []);

  // Listen for account changes
  useEffect(() => {
    if (!window.ethereum) return;

    const handleAccountsChanged = async (accounts: string[]) => {
      if (accounts.length === 0) {
        // Disconnected
        clearSession();
        setState({
          address: null,
          isConnected: false,
          isVerified: false,
          isAdmin: false,
          isAdminVerified: false,
          isLoading: false,
          error: null
        });
      } else {
        const newAddress = accounts[0].toLowerCase();
        const session = await getSession();

        // If address changed, invalidate session
        if (session && session.address !== newAddress) {
          clearSession();
        }

        setState({
          address: newAddress,
          isConnected: true,
          isVerified: session?.address === newAddress,
          isAdmin: isAdminWallet(newAddress),
          isAdminVerified: session?.address === newAddress && session.isAdmin,
          isLoading: false,
          error: null
        });
      }
    };

    window.ethereum.on('accountsChanged', handleAccountsChanged);

    return () => {
      window.ethereum?.removeListener('accountsChanged', handleAccountsChanged);
    };
  }, []);

  /**
   * Connect wallet via provider
   */
  const connectWallet = useCallback(async (walletId: string): Promise<boolean> => {
    if (!window.ethereum) {
      setState(prev => ({
        ...prev,
        error: 'Please install MetaMask or another Ethereum wallet'
      }));
      return false;
    }

    // Rate limiting
    const rateCheck = checkRateLimit('wallet_connect', 10, 60000); // 10 attempts per minute
    if (!rateCheck.allowed) {
      setState(prev => ({
        ...prev,
        error: `Too many connection attempts. Please wait ${Math.ceil(rateCheck.resetIn / 1000)} seconds.`
      }));
      return false;
    }

    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      const accounts = await window.ethereum.request({
        method: 'eth_requestAccounts'
      }) as string[];

      if (!accounts || accounts.length === 0) {
        throw new Error('No accounts returned');
      }

      const address = accounts[0].toLowerCase();

      if (!validateAddress(address)) {
        throw new Error('Invalid wallet address');
      }

      setState({
        address,
        isConnected: true,
        isVerified: false,
        isAdmin: isAdminWallet(address),
        isAdminVerified: false,
        isLoading: false,
        error: null
      });

      return true;
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to connect wallet';
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: errorMessage
      }));
      return false;
    }
  }, []);

  /**
   * Verify wallet ownership via signature
   */
  const verifyWallet = useCallback(async (): Promise<boolean> => {
    if (!state.address || !window.ethereum) {
      setState(prev => ({ ...prev, error: 'Wallet not connected' }));
      return false;
    }

    // Rate limiting
    const rateCheck = checkRateLimit(`verify_${state.address}`, 5, 60000);
    if (!rateCheck.allowed) {
      setState(prev => ({
        ...prev,
        error: `Too many verification attempts. Please wait ${Math.ceil(rateCheck.resetIn / 1000)} seconds.`
      }));
      return false;
    }

    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      const nonce = generateNonce();
      const timestamp = Date.now();
      const message = createSignatureChallenge(state.address, nonce, timestamp);

      // Request signature from wallet
      const signature = await window.ethereum.request({
        method: 'personal_sign',
        params: [message, state.address]
      }) as string;

      if (!signature) {
        throw new Error('Signature rejected');
      }

      // Create session
      await createSession(state.address, signature, nonce, false);

      setState(prev => ({
        ...prev,
        isVerified: true,
        isLoading: false
      }));

      return true;
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Signature verification failed';
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: errorMessage.includes('User rejected') ? 'Signature rejected by user' : errorMessage
      }));
      return false;
    }
  }, [state.address]);

  /**
   * Verify admin access via signature
   */
  const verifyAdminAccess = useCallback(async (): Promise<boolean> => {
    if (!state.address || !window.ethereum) {
      setState(prev => ({ ...prev, error: 'Wallet not connected' }));
      return false;
    }

    if (!state.isAdmin) {
      setState(prev => ({ ...prev, error: 'This wallet is not authorized for admin access' }));
      return false;
    }

    // Rate limiting for admin (stricter)
    const rateCheck = checkRateLimit(`admin_verify_${state.address}`, SECURITY_CONFIG.MAX_LOGIN_ATTEMPTS, SECURITY_CONFIG.LOGIN_LOCKOUT_DURATION);
    if (!rateCheck.allowed) {
      setState(prev => ({
        ...prev,
        error: `Too many admin verification attempts. Account locked for ${Math.ceil(rateCheck.resetIn / 60000)} minutes.`
      }));
      return false;
    }

    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      const nonce = generateNonce();
      const timestamp = Date.now();
      const message = createAdminChallenge(state.address, nonce, timestamp);

      // Request signature from wallet
      const signature = await window.ethereum.request({
        method: 'personal_sign',
        params: [message, state.address]
      }) as string;

      if (!signature) {
        throw new Error('Admin signature rejected');
      }

      // Create admin session
      await createSession(state.address, signature, nonce, true);

      setState(prev => ({
        ...prev,
        isVerified: true,
        isAdminVerified: true,
        isLoading: false
      }));

      return true;
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Admin verification failed';
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: errorMessage.includes('User rejected') ? 'Signature rejected by user' : errorMessage
      }));
      return false;
    }
  }, [state.address, state.isAdmin]);

  /**
   * Disconnect wallet and clear session
   */
  const disconnectWallet = useCallback(() => {
    clearSession();
    setState({
      address: null,
      isConnected: false,
      isVerified: false,
      isAdmin: false,
      isAdminVerified: false,
      isLoading: false,
      error: null
    });
  }, []);

  /**
   * Clear error message
   */
  const clearError = useCallback(() => {
    setState(prev => ({ ...prev, error: null }));
  }, []);

  return {
    ...state,
    connectWallet,
    verifyWallet,
    verifyAdminAccess,
    disconnectWallet,
    clearError
  };
}

export default useSecureWallet;
