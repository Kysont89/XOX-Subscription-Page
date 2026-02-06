/**
 * Multi-Chain Wallet Hook
 * EVM chains (ETH, BNB) via Reown AppKit / wagmi
 * Tron via TronLink (custom)
 */

import { useState, useEffect, useCallback } from 'react';
import { useAccount, useDisconnect } from 'wagmi';
import { useAppKit } from '@reown/appkit/react';
import { NetworkId, NetworkConfig, NETWORKS } from '../config/networks';
import {
  generateNonce,
  createSignatureChallenge,
  createAdminChallenge,
  createSession,
  getSession,
  clearSession,
  validateAddress,
  checkRateLimit,
  SECURITY_CONFIG
} from '../utils/security';
import {
  checkAdmin,
  adminLogin,
  adminLogout,
  clearAdminToken
} from '../services/api';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

declare global {
  interface Window {
    ethereum?: {
      request: (args: { method: string; params?: unknown[] }) => Promise<unknown>;
      on: (event: string, callback: (...args: unknown[]) => void) => void;
      removeListener: (event: string, callback: (...args: unknown[]) => void) => void;
      isMetaMask?: boolean;
    };
    tronWeb?: {
      ready: boolean;
      defaultAddress: {
        base58: string;
        hex: string;
      };
      trx: {
        sign: (message: string) => Promise<string>;
        getBalance: (address: string) => Promise<number>;
      };
      toHex: (str: string) => string;
      isAddress: (address: string) => boolean;
    };
    tronLink?: {
      ready: boolean;
      request: (args: { method: string }) => Promise<unknown>;
    };
  }
}

interface WalletState {
  address: string | null;
  network: NetworkConfig | null;
  isConnected: boolean;
  isVerified: boolean;
  isAdmin: boolean;
  isAdminVerified: boolean;
  isLoading: boolean;
  error: string | null;
}

interface UseMultiChainWalletReturn extends WalletState {
  connectWallet: (walletId: string, network: NetworkConfig) => Promise<boolean>;
  switchNetwork: (network: NetworkConfig) => Promise<boolean>;
  verifyWallet: () => Promise<boolean>;
  verifyAdminAccess: () => Promise<boolean>;
  disconnectWallet: () => void;
  clearError: () => void;
}

// Fallback admin wallets (for when backend is unavailable)
const FALLBACK_ADMIN_WALLETS = new Set([
  '0x742d35cc6634c0532925a3b844bc454e4438f44e'
]);

/**
 * Check if wallet is admin (async, queries backend)
 */
async function checkIsAdmin(address: string | null): Promise<boolean> {
  if (!address) return false;

  try {
    // Try backend first
    const result = await checkAdmin(address);
    if (result.data) {
      return result.data.isAdmin;
    }
  } catch {
    // Backend unavailable, use fallback
  }

  // Fallback to hardcoded list
  return FALLBACK_ADMIN_WALLETS.has(address.toLowerCase());
}

// Map wagmi chainId to our NetworkId
function chainIdToNetwork(chainId: number | undefined): NetworkConfig | null {
  if (!chainId) return null;
  return Object.values(NETWORKS).find(n => n.chainId === chainId) || null;
}

// ============================================================================
// HOOK IMPLEMENTATION
// ============================================================================

export function useMultiChainWallet(): UseMultiChainWalletReturn {
  // Wagmi state for EVM
  const { address: wagmiAddress, chainId: wagmiChainId, isConnected: wagmiConnected } = useAccount();
  const { disconnect: wagmiDisconnect } = useDisconnect();
  const { open: openAppKit } = useAppKit();

  // Tron-specific state
  const [tronState, setTronState] = useState<{
    address: string | null;
    isConnected: boolean;
  }>({ address: null, isConnected: false });

  // Shared state
  const [verificationState, setVerificationState] = useState<{
    isVerified: boolean;
    isAdmin: boolean;
    isAdminVerified: boolean;
    isLoading: boolean;
    error: string | null;
  }>({
    isVerified: false,
    isAdmin: false,
    isAdminVerified: false,
    isLoading: true,
    error: null
  });

  // Derive the unified wallet state
  const isEVM = wagmiConnected && !!wagmiAddress;
  const isTron = tronState.isConnected && !!tronState.address;

  const address = isEVM
    ? wagmiAddress!.toLowerCase()
    : isTron
      ? tronState.address
      : null;

  const network = isEVM
    ? chainIdToNetwork(wagmiChainId)
    : isTron
      ? NETWORKS.TRX
      : null;

  const isConnected = isEVM || isTron;

  // Check admin status when address changes
  useEffect(() => {
    if (address) {
      checkIsAdmin(address).then(isAdmin => {
        setVerificationState(prev => ({ ...prev, isAdmin }));
      });
    } else {
      setVerificationState(prev => ({ ...prev, isAdmin: false, isAdminVerified: false }));
    }
  }, [address]);

  // Check for existing session on mount
  useEffect(() => {
    const checkExistingSession = async () => {
      try {
        const session = await getSession();
        if (session) {
          // If wagmi already restored the EVM connection, check if session matches
          if (wagmiConnected && wagmiAddress && wagmiAddress.toLowerCase() === session.address) {
            setVerificationState(prev => ({
              ...prev,
              isVerified: true,
              isAdminVerified: session.isAdmin,
              isLoading: false
            }));
            return;
          }

          // Try to restore Tron connection
          if (window.tronWeb && window.tronWeb.ready) {
            const tronAddress = window.tronWeb.defaultAddress.base58;
            if (tronAddress && tronAddress.toLowerCase() === session.address.toLowerCase()) {
              setTronState({ address: tronAddress, isConnected: true });
              setVerificationState(prev => ({
                ...prev,
                isVerified: true,
                isAdmin: FALLBACK_ADMIN_WALLETS.has(tronAddress.toLowerCase()),
                isAdminVerified: session.isAdmin,
                isLoading: false
              }));
              return;
            }
          }
        }

        setVerificationState(prev => ({ ...prev, isLoading: false }));
      } catch (error) {
        console.error('Error checking existing session:', error);
        setVerificationState(prev => ({ ...prev, isLoading: false }));
      }
    };

    checkExistingSession();
  }, [wagmiConnected, wagmiAddress]);

  // When wagmi connects (EVM via Reown), clear any pending network and mark loading done
  useEffect(() => {
    if (wagmiConnected && wagmiAddress) {
      sessionStorage.removeItem('xox_pending_network');
      // Disconnect Tron if EVM connected
      if (tronState.isConnected) {
        setTronState({ address: null, isConnected: false });
      }
      setVerificationState(prev => ({
        ...prev,
        isVerified: false,
        isAdminVerified: false,
        isLoading: false,
        error: null
      }));
    }
  }, [wagmiConnected, wagmiAddress]);

  /**
   * Connect to TronLink wallet
   */
  const connectTron = useCallback(async (): Promise<boolean> => {
    if (!window.tronLink && !window.tronWeb) {
      setVerificationState(prev => ({
        ...prev,
        error: 'Please install TronLink wallet extension'
      }));
      return false;
    }

    try {
      if (window.tronLink) {
        await window.tronLink.request({ method: 'tron_requestAccounts' });
      }

      let attempts = 0;
      while ((!window.tronWeb || !window.tronWeb.ready) && attempts < 10) {
        await new Promise(resolve => setTimeout(resolve, 500));
        attempts++;
      }

      if (!window.tronWeb || !window.tronWeb.ready) {
        throw new Error('TronLink not ready. Please unlock your wallet.');
      }

      const tronAddress = window.tronWeb.defaultAddress.base58;

      if (!tronAddress) {
        throw new Error('No Tron address found');
      }

      // Disconnect EVM if Tron is connecting
      if (wagmiConnected) {
        wagmiDisconnect();
      }

      setTronState({ address: tronAddress, isConnected: true });
      setVerificationState(prev => ({
        ...prev,
        isVerified: false,
        isAdminVerified: false,
        isLoading: false,
        error: null
      }));

      return true;
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to connect TronLink';
      setVerificationState(prev => ({
        ...prev,
        isLoading: false,
        error: errorMessage
      }));
      return false;
    }
  }, [wagmiConnected, wagmiDisconnect]);

  /**
   * Connect wallet based on network type
   */
  const connectWallet = useCallback(async (walletId: string, network: NetworkConfig): Promise<boolean> => {
    const rateCheck = checkRateLimit('wallet_connect', 10, 60000);
    if (!rateCheck.allowed) {
      setVerificationState(prev => ({
        ...prev,
        error: `Too many connection attempts. Please wait ${Math.ceil(rateCheck.resetIn / 1000)} seconds.`
      }));
      return false;
    }

    setVerificationState(prev => ({ ...prev, isLoading: true, error: null }));

    if (network.walletType === 'tron') {
      return await connectTron();
    } else {
      // EVM: Open Reown AppKit modal (handled by WalletModal component)
      openAppKit({ view: 'Connect' });
      setVerificationState(prev => ({ ...prev, isLoading: false }));
      return true;
    }
  }, [connectTron, openAppKit]);

  /**
   * Switch to a different network
   */
  const switchNetwork = useCallback(async (targetNetwork: NetworkConfig): Promise<boolean> => {
    if (!isConnected) {
      setVerificationState(prev => ({ ...prev, error: 'Wallet not connected' }));
      return false;
    }

    // If switching between EVM and Tron, need to reconnect
    const currentWalletType = isTron ? 'tron' : 'evm';
    if (currentWalletType !== targetNetwork.walletType) {
      disconnectWallet();
      return await connectWallet('auto', targetNetwork);
    }

    // EVM network switch via Reown AppKit (handles chain switching)
    if (targetNetwork.walletType === 'evm') {
      openAppKit({ view: 'Networks' });
      return true;
    }

    return false;
  }, [isConnected, isTron, connectWallet, openAppKit]);

  /**
   * Verify wallet ownership via signature
   */
  const verifyWallet = useCallback(async (): Promise<boolean> => {
    if (!address || !network) {
      setVerificationState(prev => ({ ...prev, error: 'Wallet not connected' }));
      return false;
    }

    const rateCheck = checkRateLimit(`verify_${address}`, 5, 60000);
    if (!rateCheck.allowed) {
      setVerificationState(prev => ({
        ...prev,
        error: `Too many verification attempts. Please wait ${Math.ceil(rateCheck.resetIn / 1000)} seconds.`
      }));
      return false;
    }

    setVerificationState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      const nonce = generateNonce();
      const timestamp = Date.now();
      const message = createSignatureChallenge(address, nonce, timestamp);

      let signature: string;

      if (network.walletType === 'tron' && window.tronWeb) {
        const hexMessage = window.tronWeb.toHex(message);
        signature = await window.tronWeb.trx.sign(hexMessage);
      } else if (window.ethereum) {
        signature = await window.ethereum.request({
          method: 'personal_sign',
          params: [message, address]
        }) as string;
      } else {
        throw new Error('No wallet available');
      }

      if (!signature) {
        throw new Error('Signature rejected');
      }

      await createSession(address, signature, nonce, false);

      setVerificationState(prev => ({
        ...prev,
        isVerified: true,
        isLoading: false
      }));

      return true;
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Signature verification failed';
      setVerificationState(prev => ({
        ...prev,
        isLoading: false,
        error: errorMessage.includes('User rejected') || errorMessage.includes('Confirmation declined')
          ? 'Signature rejected by user'
          : errorMessage
      }));
      return false;
    }
  }, [address, network]);

  /**
   * Verify admin access via signature
   */
  const verifyAdminAccess = useCallback(async (): Promise<boolean> => {
    if (!address || !network) {
      setVerificationState(prev => ({ ...prev, error: 'Wallet not connected' }));
      return false;
    }

    if (!verificationState.isAdmin) {
      setVerificationState(prev => ({ ...prev, error: 'This wallet is not authorized for admin access' }));
      return false;
    }

    const rateCheck = checkRateLimit(`admin_verify_${address}`, SECURITY_CONFIG.MAX_LOGIN_ATTEMPTS, SECURITY_CONFIG.LOGIN_LOCKOUT_DURATION);
    if (!rateCheck.allowed) {
      setVerificationState(prev => ({
        ...prev,
        error: `Too many admin verification attempts. Account locked for ${Math.ceil(rateCheck.resetIn / 60000)} minutes.`
      }));
      return false;
    }

    setVerificationState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      const nonce = generateNonce();
      const timestamp = Date.now();
      const message = createAdminChallenge(address, nonce, timestamp);

      let signature: string;

      if (network.walletType === 'tron' && window.tronWeb) {
        const hexMessage = window.tronWeb.toHex(message);
        signature = await window.tronWeb.trx.sign(hexMessage);
      } else if (window.ethereum) {
        signature = await window.ethereum.request({
          method: 'personal_sign',
          params: [message, address]
        }) as string;
      } else {
        throw new Error('No wallet available');
      }

      if (!signature) {
        throw new Error('Admin signature rejected');
      }

      const loginResult = await adminLogin(address, signature, message, timestamp);

      if (loginResult.error) {
        console.warn('Backend admin login failed, using local session:', loginResult.error);
        await createSession(address, signature, nonce, true);
      }

      setVerificationState(prev => ({
        ...prev,
        isVerified: true,
        isAdminVerified: true,
        isLoading: false
      }));

      return true;
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Admin verification failed';
      setVerificationState(prev => ({
        ...prev,
        isLoading: false,
        error: errorMessage.includes('User rejected') || errorMessage.includes('Confirmation declined')
          ? 'Signature rejected by user'
          : errorMessage
      }));
      return false;
    }
  }, [address, network, verificationState.isAdmin]);

  /**
   * Disconnect wallet and clear session
   */
  const disconnectWallet = useCallback(() => {
    clearSession();
    clearAdminToken();
    adminLogout().catch(() => {});

    // Disconnect wagmi (EVM)
    if (wagmiConnected) {
      wagmiDisconnect();
    }

    // Clear Tron state
    setTronState({ address: null, isConnected: false });

    setVerificationState({
      isVerified: false,
      isAdmin: false,
      isAdminVerified: false,
      isLoading: false,
      error: null
    });
  }, [wagmiConnected, wagmiDisconnect]);

  /**
   * Clear error message
   */
  const clearError = useCallback(() => {
    setVerificationState(prev => ({ ...prev, error: null }));
  }, []);

  return {
    address,
    network,
    isConnected,
    isVerified: verificationState.isVerified,
    isAdmin: verificationState.isAdmin,
    isAdminVerified: verificationState.isAdminVerified,
    isLoading: verificationState.isLoading,
    error: verificationState.error,
    connectWallet,
    switchNetwork,
    verifyWallet,
    verifyAdminAccess,
    disconnectWallet,
    clearError
  };
}

export default useMultiChainWallet;
