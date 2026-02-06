/**
 * Reown AppKit + Wagmi Configuration
 * Provides EVM wallet connectivity via WalletConnect protocol
 */

import { createAppKit } from '@reown/appkit/react';
import { WagmiAdapter } from '@reown/appkit-adapter-wagmi';
import { mainnet, bsc } from '@reown/appkit/networks';

const projectId = import.meta.env.VITE_REOWN_PROJECT_ID || '';

if (!projectId) {
  console.warn(
    'VITE_REOWN_PROJECT_ID is not set. Get one at https://cloud.reown.com/'
  );
}

const metadata = {
  name: 'XOX VIP Subscription',
  description: 'XOX Exchange VIP Subscription dApp',
  url: typeof window !== 'undefined' ? window.location.origin : '',
  icons: ['/xox-logo.jpeg']
};

const networks = [mainnet, bsc] as const;

export const wagmiAdapter = new WagmiAdapter({
  projectId,
  networks
});

export const appKit = createAppKit({
  adapters: [wagmiAdapter],
  networks,
  projectId,
  metadata,
  features: {
    analytics: false
  },
  themeMode: 'dark'
});

export const wagmiConfig = wagmiAdapter.wagmiConfig;
