/**
 * Unified Wallet Hook
 * Combines Reown AppKit (EVM) with TronLink (TRON) support
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  useAppKitAccount,
  useAppKitProvider,
  useAppKit,
  useAppKitNetwork,
  useDisconnect
} from '@reown/appkit/react';
import { BrowserProvider } from 'ethers';
import { NetworkId, NetworkConfig, NETWORKS } from '../config/networks';
import { APPKIT_CHAIN_MAP } from '../config/appkit';
import {
  generateNonce,
  createSignatureChallenge,
  createAdminChallenge,
  createSession,
  getSession,
  clearSession,
  checkRateLimit,
  isAdminWallet,
  SECURITY_CONFIG
} from '../utils/security';
import {
  checkAdmin,
  adminLogin,
  adminLogout,
  clearAdminToken
} from '../services/api';

// TronLink types
declare global {
  interface Window {
    tronWeb?: {
      ready: boolean;
      defaultAddress: { base58: string; hex: string };
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

// Wallet source tracking
export type WalletSource = 'appkit' | 'tronlink' | null;

export interface UnifiedWalletState {
  address: string | null;
  network: NetworkConfig | null;
  isConnected: boolean;
  isVerified: boolean;
  isAdmin: boolean;
  isAdminVerified: boolean;
  isLoading: boolean;
  error: string | null;
  walletSource: WalletSource;
  // Social login info
  authProvider: string | null;
  userEmail: string | null;
}

export interface UseUnifiedWalletReturn extends UnifiedWalletState {
  // Modal controls
  openModal: () => void;
  closeModal: () => void;
  // Connection
  connectTron: () => Promise<boolean>;
  switchNetwork: (network: NetworkConfig) => Promise<boolean>;
  // Verification
  verifyWallet: () => Promise<boolean>;
  verifyAdminAccess: () => Promise<boolean>;
  // Disconnection
  disconnectWallet: () => void;
  clearError: () => void;
}

const FALLBACK_ADMIN_WALLETS = new Set([
  '0x742d35cc6634c0532925a3b844bc454e4438f44e'
]);

export function useUnifiedWallet(): UseUnifiedWalletReturn {
  // AppKit hooks for EVM
  const { address: appKitAddress, isConnected: appKitConnected } = useAppKitAccount();
  const { walletProvider } = useAppKitProvider<any>('eip155');
  const { open, close } = useAppKit();
  const { chainId: appKitChainId } = useAppKitNetwork();
  const { disconnect: appKitDisconnect } = useDisconnect();

  // Local state for TRON
  const [tronState, setTronState] = useState<{
    address: string | null;
    isConnected: boolean;
  }>({ address: null, isConnected: false });

  // Verification state
  const [verificationState, setVerificationState] = useState({
    isVerified: false,
    isAdmin: false,
    isAdminVerified: false
  });

  // UI state
  const [uiState, setUiState] = useState({
    isLoading: true,
    error: null as string | null
  });

  // Determine current wallet source
  const walletSource: WalletSource = useMemo(() => {
    if (tronState.isConnected) return 'tronlink';
    if (appKitConnected) return 'appkit';
    return null;
  }, [tronState.isConnected, appKitConnected]);

  // Map AppKit chainId to network config
  const currentNetwork: NetworkConfig | null = useMemo(() => {
    if (tronState.isConnected) return NETWORKS.TRX;
    if (appKitConnected && appKitChainId) {
      const networkId = APPKIT_CHAIN_MAP[appKitChainId as number];
      if (networkId) return NETWORKS[networkId];
    }
    return null;
  }, [tronState.isConnected, appKitConnected, appKitChainId]);

  // Current address
  const currentAddress = useMemo(() => {
    if (tronState.isConnected) return tronState.address;
    if (appKitConnected) return appKitAddress?.toLowerCase() || null;
    return null;
  }, [tronState, appKitConnected, appKitAddress]);

  // Social login info - AppKit embeddedWalletInfo is not directly available in useAppKitAccount
  // We'll detect social login by checking if wallet is connected but no injected wallet
  const authProvider = useMemo(() => {
    if (walletSource === 'tronlink') return 'wallet';
    if (walletSource === 'appkit') return 'wallet'; // Could be social or wallet
    return null;
  }, [walletSource]);

  const userEmail: string | null = null; // Email available via AppKit's embedded wallet info

  // Check admin status when address changes
  useEffect(() => {
    const checkAdminStatus = async () => {
      if (!currentAddress) {
        setVerificationState(prev => ({ ...prev, isAdmin: false, isAdminVerified: false }));
        return;
      }

      // First check local fallback
      let isAdmin = FALLBACK_ADMIN_WALLETS.has(currentAddress.toLowerCase());

      // Then try backend
      if (!isAdmin) {
        try {
          const result = await checkAdmin(currentAddress);
          if (result.data?.isAdmin) {
            isAdmin = true;
          }
        } catch (e) {
          // Backend unavailable, use fallback only
        }
      }

      setVerificationState(prev => ({ ...prev, isAdmin }));
    };

    checkAdminStatus();
  }, [currentAddress]);

  // Restore session on mount and when address changes
  useEffect(() => {
    const restoreSession = async () => {
      try {
        const session = await getSession();
        if (session && currentAddress && session.address === currentAddress.toLowerCase()) {
          setVerificationState(prev => ({
            ...prev,
            isVerified: true,
            isAdminVerified: session.isAdmin
          }));
        } else if (currentAddress) {
          // Clear verification state if address doesn't match session
          setVerificationState(prev => ({
            ...prev,
            isVerified: false,
            isAdminVerified: false
          }));
        }
      } catch (error) {
        console.error('Session restore error:', error);
      } finally {
        setUiState(prev => ({ ...prev, isLoading: false }));
      }
    };

    restoreSession();
  }, [currentAddress]);

  // Clear verification when disconnected
  useEffect(() => {
    if (!walletSource) {
      setVerificationState({
        isVerified: false,
        isAdmin: false,
        isAdminVerified: false
      });
    }
  }, [walletSource]);

  // Connect TronLink
  const connectTron = useCallback(async (): Promise<boolean> => {
    if (!window.tronLink && !window.tronWeb) {
      setUiState(prev => ({ ...prev, error: 'Please install TronLink wallet extension' }));
      return false;
    }

    const rateCheck = checkRateLimit('wallet_connect', 10, 60000);
    if (!rateCheck.allowed) {
      setUiState(prev => ({
        ...prev,
        error: `Too many connection attempts. Please wait ${Math.ceil(rateCheck.resetIn / 1000)} seconds.`
      }));
      return false;
    }

    setUiState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      // Disconnect AppKit if connected
      if (appKitConnected) {
        await appKitDisconnect();
      }

      if (window.tronLink) {
        await window.tronLink.request({ method: 'tron_requestAccounts' });
      }

      // Wait for TronWeb to be ready
      let attempts = 0;
      while ((!window.tronWeb || !window.tronWeb.ready) && attempts < 10) {
        await new Promise(resolve => setTimeout(resolve, 500));
        attempts++;
      }

      if (!window.tronWeb || !window.tronWeb.ready) {
        throw new Error('TronLink not ready. Please unlock your wallet.');
      }

      const address = window.tronWeb.defaultAddress.base58;
      if (!address) throw new Error('No Tron address found');

      setTronState({ address, isConnected: true });
      setUiState(prev => ({ ...prev, isLoading: false }));
      return true;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to connect TronLink';
      setUiState(prev => ({ ...prev, isLoading: false, error: errorMessage }));
      return false;
    }
  }, [appKitConnected, appKitDisconnect]);

  // Open AppKit modal
  const openModal = useCallback(() => {
    // Disconnect Tron if connected before opening AppKit
    if (tronState.isConnected) {
      setTronState({ address: null, isConnected: false });
      clearSession();
    }
    open();
  }, [open, tronState.isConnected]);

  // Close AppKit modal
  const closeModal = useCallback(() => {
    close();
  }, [close]);

  // Switch network
  const switchNetwork = useCallback(async (network: NetworkConfig): Promise<boolean> => {
    if (network.walletType === 'tron') {
      return await connectTron();
    }

    // For EVM networks, if on Tron, need to switch to AppKit
    if (walletSource === 'tronlink') {
      setTronState({ address: null, isConnected: false });
      clearSession();
      openModal();
      return true; // User will complete connection via modal
    }

    // Already on AppKit, network switching is handled by AppKit modal
    openModal();
    return true;
  }, [walletSource, connectTron, openModal]);

  // Verify wallet ownership
  const verifyWallet = useCallback(async (): Promise<boolean> => {
    if (!currentAddress || !currentNetwork) {
      setUiState(prev => ({ ...prev, error: 'Wallet not connected' }));
      return false;
    }

    const rateCheck = checkRateLimit(`verify_${currentAddress}`, 5, 60000);
    if (!rateCheck.allowed) {
      setUiState(prev => ({
        ...prev,
        error: `Too many verification attempts. Please wait ${Math.ceil(rateCheck.resetIn / 1000)} seconds.`
      }));
      return false;
    }

    setUiState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      const nonce = generateNonce();
      const timestamp = Date.now();
      const message = createSignatureChallenge(currentAddress, nonce, timestamp);

      let signature: string;

      if (walletSource === 'tronlink' && window.tronWeb) {
        const hexMessage = window.tronWeb.toHex(message);
        signature = await window.tronWeb.trx.sign(hexMessage);
      } else if (walletSource === 'appkit' && walletProvider) {
        const provider = new BrowserProvider(walletProvider);
        const signer = await provider.getSigner();
        signature = await signer.signMessage(message);
      } else {
        throw new Error('No wallet provider available');
      }

      if (!signature) throw new Error('Signature rejected');

      await createSession(currentAddress, signature, nonce, false);
      setVerificationState(prev => ({ ...prev, isVerified: true }));
      setUiState(prev => ({ ...prev, isLoading: false }));
      return true;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Signature verification failed';
      setUiState(prev => ({
        ...prev,
        isLoading: false,
        error: errorMessage.includes('rejected') || errorMessage.includes('denied')
          ? 'Signature rejected by user'
          : errorMessage
      }));
      return false;
    }
  }, [currentAddress, currentNetwork, walletSource, walletProvider]);

  // Verify admin access
  const verifyAdminAccess = useCallback(async (): Promise<boolean> => {
    if (!currentAddress || !currentNetwork) {
      setUiState(prev => ({ ...prev, error: 'Wallet not connected' }));
      return false;
    }

    if (!verificationState.isAdmin) {
      setUiState(prev => ({ ...prev, error: 'This wallet is not authorized for admin access' }));
      return false;
    }

    const rateCheck = checkRateLimit(
      `admin_verify_${currentAddress}`,
      SECURITY_CONFIG.MAX_LOGIN_ATTEMPTS,
      SECURITY_CONFIG.LOGIN_LOCKOUT_DURATION
    );
    if (!rateCheck.allowed) {
      setUiState(prev => ({
        ...prev,
        error: `Too many admin verification attempts. Account locked for ${Math.ceil(rateCheck.resetIn / 60000)} minutes.`
      }));
      return false;
    }

    setUiState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      const nonce = generateNonce();
      const timestamp = Date.now();
      const message = createAdminChallenge(currentAddress, nonce, timestamp);

      let signature: string;

      if (walletSource === 'tronlink' && window.tronWeb) {
        const hexMessage = window.tronWeb.toHex(message);
        signature = await window.tronWeb.trx.sign(hexMessage);
      } else if (walletSource === 'appkit' && walletProvider) {
        const provider = new BrowserProvider(walletProvider);
        const signer = await provider.getSigner();
        signature = await signer.signMessage(message);
      } else {
        throw new Error('No wallet provider available');
      }

      if (!signature) throw new Error('Admin signature rejected');

      // Try backend login first
      const loginResult = await adminLogin(currentAddress, signature, message, timestamp);
      if (loginResult.error) {
        console.warn('Backend admin login failed, using local session:', loginResult.error);
        await createSession(currentAddress, signature, nonce, true);
      }

      setVerificationState(prev => ({ ...prev, isVerified: true, isAdminVerified: true }));
      setUiState(prev => ({ ...prev, isLoading: false }));
      return true;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Admin verification failed';
      setUiState(prev => ({
        ...prev,
        isLoading: false,
        error: errorMessage.includes('rejected') || errorMessage.includes('denied')
          ? 'Signature rejected by user'
          : errorMessage
      }));
      return false;
    }
  }, [currentAddress, currentNetwork, verificationState.isAdmin, walletSource, walletProvider]);

  // Disconnect wallet
  const disconnectWallet = useCallback(() => {
    clearSession();
    clearAdminToken();
    adminLogout().catch(() => {});

    // Clear Tron state
    setTronState({ address: null, isConnected: false });

    // Clear verification state
    setVerificationState({ isVerified: false, isAdmin: false, isAdminVerified: false });
    setUiState({ isLoading: false, error: null });

    // Disconnect AppKit
    if (appKitConnected) {
      appKitDisconnect();
    }
  }, [appKitConnected, appKitDisconnect]);

  // Clear error
  const clearError = useCallback(() => {
    setUiState(prev => ({ ...prev, error: null }));
  }, []);

  return {
    address: currentAddress,
    network: currentNetwork,
    isConnected: walletSource !== null,
    isVerified: verificationState.isVerified,
    isAdmin: verificationState.isAdmin,
    isAdminVerified: verificationState.isAdminVerified,
    isLoading: uiState.isLoading,
    error: uiState.error,
    walletSource,
    authProvider,
    userEmail,
    openModal,
    closeModal,
    connectTron,
    switchNetwork,
    verifyWallet,
    verifyAdminAccess,
    disconnectWallet,
    clearError
  };
}

export default useUnifiedWallet;
