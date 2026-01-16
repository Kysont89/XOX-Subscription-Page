/**
 * Multi-Chain Network Configuration
 * Supports ETH (Ethereum), BNB (BSC), and TRX (Tron)
 */

export type NetworkId = 'ETH' | 'BNB' | 'TRX';

export interface NetworkConfig {
  id: NetworkId;
  name: string;
  shortName: string;
  chainId: number | null; // null for non-EVM chains (Tron)
  rpcUrl: string;
  explorerUrl: string;
  explorerName: string;
  usdtContract: string;
  usdtDecimals: number;
  nativeCurrency: {
    name: string;
    symbol: string;
    decimals: number;
  };
  icon: string;
  color: string;
  walletType: 'evm' | 'tron';
}

// ============================================================================
// ADMIN RECEIVING WALLET ADDRESSES
// Update these with your actual wallet addresses
// ============================================================================
export const ADMIN_WALLETS = {
  // EVM address for ETH and BNB (same address works for both)
  EVM: '0x742d35Cc6634C0532925a3b844Bc454e4438f44e',
  // Tron address for TRX
  TRON: 'TXYZabcdefghijklmnopqrstuvwxyz123'
};

// ============================================================================
// NETWORK CONFIGURATIONS
// ============================================================================
export const NETWORKS: Record<NetworkId, NetworkConfig> = {
  ETH: {
    id: 'ETH',
    name: 'Ethereum',
    shortName: 'ETH',
    chainId: 1,
    rpcUrl: 'https://eth.llamarpc.com',
    explorerUrl: 'https://etherscan.io',
    explorerName: 'Etherscan',
    usdtContract: '0xdAC17F958D2ee523a2206206994597C13D831ec7',
    usdtDecimals: 6,
    nativeCurrency: {
      name: 'Ethereum',
      symbol: 'ETH',
      decimals: 18
    },
    icon: 'ETH',
    color: '#627EEA',
    walletType: 'evm'
  },
  BNB: {
    id: 'BNB',
    name: 'BNB Smart Chain',
    shortName: 'BSC',
    chainId: 56,
    rpcUrl: 'https://bsc-dataseed.binance.org',
    explorerUrl: 'https://bscscan.com',
    explorerName: 'BscScan',
    usdtContract: '0x55d398326f99059fF775485246999027B3197955',
    usdtDecimals: 18,
    nativeCurrency: {
      name: 'BNB',
      symbol: 'BNB',
      decimals: 18
    },
    icon: 'BNB',
    color: '#F3BA2F',
    walletType: 'evm'
  },
  TRX: {
    id: 'TRX',
    name: 'Tron',
    shortName: 'TRX',
    chainId: null,
    rpcUrl: 'https://api.trongrid.io',
    explorerUrl: 'https://tronscan.org',
    explorerName: 'TronScan',
    usdtContract: 'TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t',
    usdtDecimals: 6,
    nativeCurrency: {
      name: 'Tron',
      symbol: 'TRX',
      decimals: 6
    },
    icon: 'TRX',
    color: '#FF0013',
    walletType: 'tron'
  }
};

export const NETWORK_LIST = Object.values(NETWORKS);

/**
 * Get admin wallet address for a specific network
 */
export function getAdminWallet(networkId: NetworkId): string {
  if (networkId === 'TRX') {
    return ADMIN_WALLETS.TRON;
  }
  return ADMIN_WALLETS.EVM;
}

/**
 * Get explorer URL for a transaction
 */
export function getTxExplorerUrl(networkId: NetworkId, txHash: string): string {
  const network = NETWORKS[networkId];
  if (networkId === 'TRX') {
    return `${network.explorerUrl}/#/transaction/${txHash}`;
  }
  return `${network.explorerUrl}/tx/${txHash}`;
}

/**
 * Get explorer URL for an address
 */
export function getAddressExplorerUrl(networkId: NetworkId, address: string): string {
  const network = NETWORKS[networkId];
  if (networkId === 'TRX') {
    return `${network.explorerUrl}/#/address/${address}`;
  }
  return `${network.explorerUrl}/address/${address}`;
}
