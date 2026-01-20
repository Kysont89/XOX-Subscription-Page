/**
 * Reown AppKit Configuration
 * Handles EVM wallet connections with social login support
 */

import { createAppKit } from '@reown/appkit/react';
import { EthersAdapter } from '@reown/appkit-adapter-ethers';
import { mainnet, bsc } from '@reown/appkit/networks';
import type { AppKitNetwork } from '@reown/appkit/networks';

// Project ID from Reown Cloud Dashboard: https://cloud.reown.com
const projectId = import.meta.env.VITE_REOWN_PROJECT_ID || '';

if (!projectId) {
  console.warn('VITE_REOWN_PROJECT_ID is not set. AppKit features will be limited.');
}

// App metadata for WalletConnect
const metadata = {
  name: 'XOX VIP Subscription',
  description: 'XOX Exchange VIP Subscription DApp',
  url: typeof window !== 'undefined' ? window.location.origin : 'https://xox.exchange',
  icons: ['/xox-logo.jpeg']
};

// Create ethers adapter
const ethersAdapter = new EthersAdapter();

// Define supported networks
export const appKitNetworks: [AppKitNetwork, ...AppKitNetwork[]] = [mainnet, bsc];

// Create AppKit instance
export const appKit = createAppKit({
  adapters: [ethersAdapter],
  networks: appKitNetworks,
  projectId,
  metadata,
  features: {
    email: true,
    socials: ['google'],
    emailShowWallets: true,
    analytics: true,
    // Enable embedded wallet for social login users
    onramp: false
  },
  // Enable embedded wallets
  enableEIP6963: true,
  enableCoinbase: true,
  enableInjected: true,
  enableWalletConnect: true,
  themeMode: 'dark',
  themeVariables: {
    '--w3m-accent': '#0b71ff',
    '--w3m-color-mix': '#0b71ff',
    '--w3m-color-mix-strength': 20,
    '--w3m-border-radius-master': '8px'
  }
});

// Map AppKit chain ID to our network ID
export const APPKIT_CHAIN_MAP: Record<number, 'ETH' | 'BNB'> = {
  1: 'ETH',
  56: 'BNB'
};

export type { AppKitNetwork };
