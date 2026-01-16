/**
 * Multi-Chain Wallet Hook
 * Supports EVM chains (ETH, BNB) via MetaMask and Tron via TronLink
 */

import { useState, useEffect, useCallback } from 'react';
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

// Admin wallet addresses (lowercase for comparison)
const ADMIN_WALLETS_EVM = new Set([
  '0x742d35cc6634c0532925a3b844bc454e4438f44e'
]);

const ADMIN_WALLETS_TRON = new Set([
  // Add your Tron admin addresses here (lowercase)
]);

function isAdminWallet(address: string | null, networkType: 'evm' | 'tron'): boolean {
  if (!address) return false;
  if (networkType === 'tron') {
    return ADMIN_WALLETS_TRON.has(address.toLowerCase());
  }
  return ADMIN_WALLETS_EVM.has(address.toLowerCase());
}

// ============================================================================
// HOOK IMPLEMENTATION
// ============================================================================

export function useMultiChainWallet(): UseMultiChainWalletReturn {
  const [state, setState] = useState<WalletState>({
    address: null,
    network: null,
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
        const session = await getSession();
        if (session) {
          // Try to restore EVM connection
          if (window.ethereum) {
            const accounts = await window.ethereum.request({ method: 'eth_accounts' }) as string[];
            if (accounts && accounts.length > 0 && accounts[0].toLowerCase() === session.address) {
              // Determine which network based on chainId
              const chainId = await window.ethereum.request({ method: 'eth_chainId' }) as string;
              const chainIdNum = parseInt(chainId, 16);
              const network = Object.values(NETWORKS).find(n => n.chainId === chainIdNum);

              if (network) {
                setState({
                  address: session.address,
                  network,
                  isConnected: true,
                  isVerified: true,
                  isAdmin: isAdminWallet(session.address, 'evm'),
                  isAdminVerified: session.isAdmin,
                  isLoading: false,
                  error: null
                });
                return;
              }
            }
          }

          // Try to restore Tron connection
          if (window.tronWeb && window.tronWeb.ready) {
            const tronAddress = window.tronWeb.defaultAddress.base58;
            if (tronAddress && tronAddress.toLowerCase() === session.address.toLowerCase()) {
              setState({
                address: tronAddress,
                network: NETWORKS.TRX,
                isConnected: true,
                isVerified: true,
                isAdmin: isAdminWallet(tronAddress, 'tron'),
                isAdminVerified: session.isAdmin,
                isLoading: false,
                error: null
              });
              return;
            }
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

  // Listen for EVM account changes
  useEffect(() => {
    if (!window.ethereum) return;

    const handleAccountsChanged = async (accounts: unknown) => {
      const accts = accounts as string[];
      if (accts.length === 0) {
        clearSession();
        setState({
          address: null,
          network: null,
          isConnected: false,
          isVerified: false,
          isAdmin: false,
          isAdminVerified: false,
          isLoading: false,
          error: null
        });
      } else if (state.network?.walletType === 'evm') {
        const newAddress = accts[0].toLowerCase();
        const session = await getSession();

        if (session && session.address !== newAddress) {
          clearSession();
        }

        setState(prev => ({
          ...prev,
          address: newAddress,
          isVerified: session?.address === newAddress,
          isAdmin: isAdminWallet(newAddress, 'evm'),
          isAdminVerified: session?.address === newAddress && session.isAdmin
        }));
      }
    };

    const handleChainChanged = (chainId: unknown) => {
      const chainIdNum = parseInt(chainId as string, 16);
      const network = Object.values(NETWORKS).find(n => n.chainId === chainIdNum);

      if (network && state.isConnected) {
        setState(prev => ({ ...prev, network }));
      }
    };

    window.ethereum.on('accountsChanged', handleAccountsChanged);
    window.ethereum.on('chainChanged', handleChainChanged);

    return () => {
      window.ethereum?.removeListener('accountsChanged', handleAccountsChanged);
      window.ethereum?.removeListener('chainChanged', handleChainChanged);
    };
  }, [state.network, state.isConnected]);

  /**
   * Connect to EVM wallet (MetaMask, etc.)
   */
  const connectEVM = useCallback(async (network: NetworkConfig): Promise<boolean> => {
    if (!window.ethereum) {
      setState(prev => ({
        ...prev,
        error: 'Please install MetaMask or another Ethereum wallet'
      }));
      return false;
    }

    try {
      // Request accounts
      const accounts = await window.ethereum.request({
        method: 'eth_requestAccounts'
      }) as string[];

      if (!accounts || accounts.length === 0) {
        throw new Error('No accounts returned');
      }

      // Switch to correct network
      const currentChainId = await window.ethereum.request({ method: 'eth_chainId' }) as string;
      const currentChainIdNum = parseInt(currentChainId, 16);

      if (currentChainIdNum !== network.chainId) {
        try {
          await window.ethereum.request({
            method: 'wallet_switchEthereumChain',
            params: [{ chainId: `0x${network.chainId!.toString(16)}` }]
          });
        } catch (switchError: unknown) {
          // Chain not added, try to add it
          const err = switchError as { code?: number };
          if (err.code === 4902) {
            await window.ethereum.request({
              method: 'wallet_addEthereumChain',
              params: [{
                chainId: `0x${network.chainId!.toString(16)}`,
                chainName: network.name,
                nativeCurrency: network.nativeCurrency,
                rpcUrls: [network.rpcUrl],
                blockExplorerUrls: [network.explorerUrl]
              }]
            });
          } else {
            throw switchError;
          }
        }
      }

      const address = accounts[0].toLowerCase();

      if (!validateAddress(address)) {
        throw new Error('Invalid wallet address');
      }

      setState({
        address,
        network,
        isConnected: true,
        isVerified: false,
        isAdmin: isAdminWallet(address, 'evm'),
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
   * Connect to TronLink wallet
   */
  const connectTron = useCallback(async (): Promise<boolean> => {
    // Check if TronLink is installed
    if (!window.tronLink && !window.tronWeb) {
      setState(prev => ({
        ...prev,
        error: 'Please install TronLink wallet extension'
      }));
      return false;
    }

    try {
      // Request connection via TronLink
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

      if (!address) {
        throw new Error('No Tron address found');
      }

      setState({
        address,
        network: NETWORKS.TRX,
        isConnected: true,
        isVerified: false,
        isAdmin: isAdminWallet(address, 'tron'),
        isAdminVerified: false,
        isLoading: false,
        error: null
      });

      return true;
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to connect TronLink';
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: errorMessage
      }));
      return false;
    }
  }, []);

  /**
   * Connect wallet based on network type
   */
  const connectWallet = useCallback(async (walletId: string, network: NetworkConfig): Promise<boolean> => {
    // Rate limiting
    const rateCheck = checkRateLimit('wallet_connect', 10, 60000);
    if (!rateCheck.allowed) {
      setState(prev => ({
        ...prev,
        error: `Too many connection attempts. Please wait ${Math.ceil(rateCheck.resetIn / 1000)} seconds.`
      }));
      return false;
    }

    setState(prev => ({ ...prev, isLoading: true, error: null }));

    if (network.walletType === 'tron') {
      return await connectTron();
    } else {
      return await connectEVM(network);
    }
  }, [connectEVM, connectTron]);

  /**
   * Switch to a different network
   */
  const switchNetwork = useCallback(async (network: NetworkConfig): Promise<boolean> => {
    if (!state.isConnected) {
      setState(prev => ({ ...prev, error: 'Wallet not connected' }));
      return false;
    }

    // If switching between EVM and Tron, need to reconnect
    if (state.network?.walletType !== network.walletType) {
      disconnectWallet();
      return await connectWallet('auto', network);
    }

    // EVM network switch
    if (network.walletType === 'evm' && window.ethereum) {
      try {
        await window.ethereum.request({
          method: 'wallet_switchEthereumChain',
          params: [{ chainId: `0x${network.chainId!.toString(16)}` }]
        });
        setState(prev => ({ ...prev, network }));
        return true;
      } catch (error: unknown) {
        const err = error as { code?: number };
        if (err.code === 4902) {
          // Chain not added
          await window.ethereum.request({
            method: 'wallet_addEthereumChain',
            params: [{
              chainId: `0x${network.chainId!.toString(16)}`,
              chainName: network.name,
              nativeCurrency: network.nativeCurrency,
              rpcUrls: [network.rpcUrl],
              blockExplorerUrls: [network.explorerUrl]
            }]
          });
          setState(prev => ({ ...prev, network }));
          return true;
        }
        throw error;
      }
    }

    return false;
  }, [state.isConnected, state.network, connectWallet]);

  /**
   * Verify wallet ownership via signature
   */
  const verifyWallet = useCallback(async (): Promise<boolean> => {
    if (!state.address || !state.network) {
      setState(prev => ({ ...prev, error: 'Wallet not connected' }));
      return false;
    }

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

      let signature: string;

      if (state.network.walletType === 'tron' && window.tronWeb) {
        // Tron signature
        const hexMessage = window.tronWeb.toHex(message);
        signature = await window.tronWeb.trx.sign(hexMessage);
      } else if (window.ethereum) {
        // EVM signature
        signature = await window.ethereum.request({
          method: 'personal_sign',
          params: [message, state.address]
        }) as string;
      } else {
        throw new Error('No wallet available');
      }

      if (!signature) {
        throw new Error('Signature rejected');
      }

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
        error: errorMessage.includes('User rejected') || errorMessage.includes('Confirmation declined')
          ? 'Signature rejected by user'
          : errorMessage
      }));
      return false;
    }
  }, [state.address, state.network]);

  /**
   * Verify admin access via signature
   */
  const verifyAdminAccess = useCallback(async (): Promise<boolean> => {
    if (!state.address || !state.network) {
      setState(prev => ({ ...prev, error: 'Wallet not connected' }));
      return false;
    }

    if (!state.isAdmin) {
      setState(prev => ({ ...prev, error: 'This wallet is not authorized for admin access' }));
      return false;
    }

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

      let signature: string;

      if (state.network.walletType === 'tron' && window.tronWeb) {
        const hexMessage = window.tronWeb.toHex(message);
        signature = await window.tronWeb.trx.sign(hexMessage);
      } else if (window.ethereum) {
        signature = await window.ethereum.request({
          method: 'personal_sign',
          params: [message, state.address]
        }) as string;
      } else {
        throw new Error('No wallet available');
      }

      if (!signature) {
        throw new Error('Admin signature rejected');
      }

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
        error: errorMessage.includes('User rejected') || errorMessage.includes('Confirmation declined')
          ? 'Signature rejected by user'
          : errorMessage
      }));
      return false;
    }
  }, [state.address, state.network, state.isAdmin]);

  /**
   * Disconnect wallet and clear session
   */
  const disconnectWallet = useCallback(() => {
    clearSession();
    setState({
      address: null,
      network: null,
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
    switchNetwork,
    verifyWallet,
    verifyAdminAccess,
    disconnectWallet,
    clearError
  };
}

export default useMultiChainWallet;
