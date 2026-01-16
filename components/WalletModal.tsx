
import React, { useState } from 'react';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';
import { NetworkId, NETWORK_LIST, NetworkConfig } from '../config/networks';

// ============================================================================
// NETWORK ICONS
// ============================================================================
const EthIcon = () => (
  <svg viewBox="0 0 40 40" fill="none" className="w-8 h-8">
    <circle cx="20" cy="20" r="20" fill="#627EEA"/>
    <path d="M20 6L19.8 6.68V25.6L20 25.8L28.5 20.9L20 6Z" fill="white" fillOpacity="0.6"/>
    <path d="M20 6L11.5 20.9L20 25.8V16.54V6Z" fill="white"/>
    <path d="M20 27.54L19.9 27.66V34.32L20 34.62L28.5 22.66L20 27.54Z" fill="white" fillOpacity="0.6"/>
    <path d="M20 34.62V27.54L11.5 22.66L20 34.62Z" fill="white"/>
    <path d="M20 25.8L28.5 20.9L20 16.54V25.8Z" fill="white" fillOpacity="0.2"/>
    <path d="M11.5 20.9L20 25.8V16.54L11.5 20.9Z" fill="white" fillOpacity="0.6"/>
  </svg>
);

const BnbIcon = () => (
  <svg viewBox="0 0 40 40" fill="none" className="w-8 h-8">
    <circle cx="20" cy="20" r="20" fill="#F3BA2F"/>
    <path d="M20 8L14.5 13.5L16.62 15.62L20 12.24L23.38 15.62L25.5 13.5L20 8Z" fill="white"/>
    <path d="M10 18L12.12 20.12L14.24 18L12.12 15.88L10 18Z" fill="white"/>
    <path d="M14.5 22.5L20 28L25.5 22.5L23.38 20.38L20 23.76L16.62 20.38L14.5 22.5Z" fill="white"/>
    <path d="M25.76 18L27.88 20.12L30 18L27.88 15.88L25.76 18Z" fill="white"/>
    <path d="M22.12 18L20 15.88L17.88 18L20 20.12L22.12 18Z" fill="white"/>
  </svg>
);

const TrxIcon = () => (
  <svg viewBox="0 0 40 40" fill="none" className="w-8 h-8">
    <circle cx="20" cy="20" r="20" fill="#FF0013"/>
    <path d="M11 12L29 14L22 32L11 12Z" fill="white"/>
    <path d="M11 12L29 14L24 18L11 12Z" fill="white" fillOpacity="0.6"/>
    <path d="M24 18L29 14L22 32L24 18Z" fill="white" fillOpacity="0.3"/>
  </svg>
);

const NetworkIcon: React.FC<{ networkId: NetworkId; className?: string }> = ({ networkId, className }) => {
  switch (networkId) {
    case 'ETH': return <EthIcon />;
    case 'BNB': return <BnbIcon />;
    case 'TRX': return <TrxIcon />;
    default: return null;
  }
};

// ============================================================================
// WALLET ICONS
// ============================================================================
const MetaMaskIcon = () => (
  <svg viewBox="0 0 40 40" fill="none" className="w-7 h-7">
    <path d="M32.9583 5L21.2917 13.6833L23.4583 8.53333L32.9583 5Z" fill="#E2761B" stroke="#E2761B" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M7.025 5L18.5833 13.7667L16.5417 8.53333L7.025 5Z" fill="#E4761B" stroke="#E4761B" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M28.7917 26.0333L25.8333 30.6L32.2917 32.3833L34.1583 26.15L28.7917 26.0333Z" fill="#E4761B" stroke="#E4761B" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M5.85834 26.15L7.70834 32.3833L14.1667 30.6L11.2083 26.0333L5.85834 26.15Z" fill="#E4761B" stroke="#E4761B" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M13.8333 17.8667L12.0417 20.6333L18.45 20.9167L18.2167 14.0667L13.8333 17.8667Z" fill="#E4761B" stroke="#E4761B" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M26.15 17.8667L21.7083 13.9833L21.2917 20.9167L27.9583 20.6333L26.15 17.8667Z" fill="#E4761B" stroke="#E4761B" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M14.1667 30.6L18.0417 28.7L14.7 26.1917L14.1667 30.6Z" fill="#E4761B" stroke="#E4761B" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M21.9417 28.7L25.8333 30.6L25.2833 26.1917L21.9417 28.7Z" fill="#E4761B" stroke="#E4761B" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M25.8333 30.6L21.9417 28.7L22.25 31.2167L22.2167 32.3L25.8333 30.6Z" fill="#D7C1B3" stroke="#D7C1B3" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M14.1667 30.6L17.7833 32.3L17.7667 31.2167L18.0417 28.7L14.1667 30.6Z" fill="#D7C1B3" stroke="#D7C1B3" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M17.85 24.7L14.6 23.7833L16.9333 22.7667L17.85 24.7Z" fill="#233447" stroke="#233447" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M22.1333 24.7L23.05 22.7667L25.4 23.7833L22.1333 24.7Z" fill="#233447" stroke="#233447" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M14.1667 30.6L14.7167 26.0333L11.2083 26.15L14.1667 30.6Z" fill="#CD6116" stroke="#CD6116" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M25.2833 26.0333L25.8333 30.6L28.7917 26.15L25.2833 26.0333Z" fill="#CD6116" stroke="#CD6116" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M27.9583 20.6333L21.2917 20.9167L22.15 24.7L23.0667 22.7667L25.4167 23.7833L27.9583 20.6333Z" fill="#CD6116" stroke="#CD6116" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M14.6 23.7833L16.95 22.7667L17.85 24.7L18.45 20.9167L12.0417 20.6333L14.6 23.7833Z" fill="#CD6116" stroke="#CD6116" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M12.0417 20.6333L14.7 26.1917L14.6 23.7833L12.0417 20.6333Z" fill="#E4751F" stroke="#E4751F" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M25.4167 23.7833L25.2833 26.1917L27.9583 20.6333L25.4167 23.7833Z" fill="#E4751F" stroke="#E4751F" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M18.45 20.9167L17.85 24.7L18.6 28.35L18.7667 23.05L18.45 20.9167Z" fill="#E4751F" stroke="#E4751F" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M21.2917 20.9167L21.25 23.0333L21.3833 28.35L22.15 24.7L21.2917 20.9167Z" fill="#E4751F" stroke="#E4751F" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M22.15 24.7L21.3833 28.35L21.9417 28.7L25.2833 26.1917L25.4167 23.7833L22.15 24.7Z" fill="#F6851B" stroke="#F6851B" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M14.6 23.7833L14.7 26.1917L18.0417 28.7L18.6 28.35L17.85 24.7L14.6 23.7833Z" fill="#F6851B" stroke="#F6851B" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M22.2167 32.3L22.25 31.2167L21.9667 30.9667H18.0167L17.7667 31.2167L17.7833 32.3L14.1667 30.6L15.4 31.6167L17.9833 33.3833H22.0083L24.6083 31.6167L25.8333 30.6L22.2167 32.3Z" fill="#C0AD9E" stroke="#C0AD9E" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M21.9417 28.7L21.3833 28.35H18.6L18.0417 28.7L17.7667 31.2167L18.0167 30.9667H21.9667L22.25 31.2167L21.9417 28.7Z" fill="#161616" stroke="#161616" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M33.5167 14.2833L34.5 9.41667L32.9583 5L21.9417 13.3833L26.15 17.8667L32.1667 19.6L33.5833 18.0333L32.9667 17.6L33.9667 16.6833L33.2 16.0833L34.2 15.3167L33.5167 14.2833Z" fill="#763D16" stroke="#763D16" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M5.5 9.41667L6.48333 14.2833L5.78333 15.3167L6.8 16.0833L6.03333 16.6833L7.03333 17.6L6.41667 18.0333L7.81667 19.6L13.8333 17.8667L18.0417 13.3833L7.025 5L5.5 9.41667Z" fill="#763D16" stroke="#763D16" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M32.1667 19.6L26.15 17.8667L27.9583 20.6333L25.2833 26.1917L28.7917 26.15H34.1583L32.1667 19.6Z" fill="#F6851B" stroke="#F6851B" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M13.8333 17.8667L7.81667 19.6L5.85834 26.15H11.2083L14.7 26.1917L12.0417 20.6333L13.8333 17.8667Z" fill="#F6851B" stroke="#F6851B" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M21.2917 20.9167L21.9417 13.3833L23.4667 8.53333H16.5417L18.0417 13.3833L18.45 20.9167L18.5833 23.0667L18.6 28.35H21.3833L21.4167 23.0667L21.2917 20.9167Z" fill="#F6851B" stroke="#F6851B" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const TronLinkIcon = () => (
  <svg viewBox="0 0 40 40" fill="none" className="w-7 h-7">
    <rect width="40" height="40" rx="8" fill="#2B2F3B"/>
    <path d="M10 11L30 13L22 32L10 11Z" fill="#FF0013"/>
    <path d="M10 11L30 13L24 18L10 11Z" fill="#FF4E5A"/>
  </svg>
);

const CoinbaseIcon = () => (
  <svg viewBox="0 0 40 40" fill="none" className="w-7 h-7">
    <circle cx="20" cy="20" r="20" fill="#0052FF"/>
    <path d="M20 6C12.268 6 6 12.268 6 20C6 27.732 12.268 34 20 34C27.732 34 34 27.732 34 20C34 12.268 27.732 6 20 6ZM16 24C14.895 24 14 23.105 14 22V18C14 16.895 14.895 16 16 16H24C25.105 16 26 16.895 26 18V22C26 23.105 25.105 24 24 24H16Z" fill="white"/>
  </svg>
);

const TrustWalletIcon = () => (
  <svg viewBox="0 0 40 40" fill="none" className="w-7 h-7">
    <path d="M20 4L6 10V18C6 26.8 12 34.4 20 36C28 34.4 34 26.8 34 18V10L20 4Z" fill="#0500FF"/>
    <path d="M20 8L10 12.5V18C10 24.6 14.4 30.4 20 32C25.6 30.4 30 24.6 30 18V12.5L20 8Z" fill="white"/>
    <path d="M20 12L14 14.75V18C14 22.4 16.8 26.2 20 27.5C23.2 26.2 26 22.4 26 18V14.75L20 12Z" fill="#0500FF"/>
  </svg>
);

const WalletConnectIcon = () => (
  <svg viewBox="0 0 40 40" fill="none" className="w-7 h-7">
    <rect width="40" height="40" rx="8" fill="#3B99FC"/>
    <path d="M12.5 15.5C16.6421 11.5 23.3579 11.5 27.5 15.5L28.1 16.1C28.3 16.3 28.3 16.6 28.1 16.8L26.4 18.5C26.3 18.6 26.1 18.6 26 18.5L25.2 17.7C22.3 14.9 17.7 14.9 14.8 17.7L13.9 18.6C13.8 18.7 13.6 18.7 13.5 18.6L11.8 16.9C11.6 16.7 11.6 16.4 11.8 16.2L12.5 15.5ZM30.8 18.7L32.3 20.2C32.5 20.4 32.5 20.7 32.3 20.9L25.2 28C25 28.2 24.6 28.2 24.4 28L19.5 23.1C19.45 23.05 19.35 23.05 19.3 23.1L14.4 28C14.2 28.2 13.8 28.2 13.6 28L6.5 20.9C6.3 20.7 6.3 20.4 6.5 20.2L8 18.7C8.2 18.5 8.6 18.5 8.8 18.7L13.7 23.6C13.75 23.65 13.85 23.65 13.9 23.6L18.8 18.7C19 18.5 19.4 18.5 19.6 18.7L24.5 23.6C24.55 23.65 24.65 23.65 24.7 23.6L29.6 18.7C29.8 18.5 30.2 18.5 30.8 18.7Z" fill="white"/>
  </svg>
);

// ============================================================================
// WALLET CONFIGURATIONS
// ============================================================================
interface WalletOption {
  id: string;
  name: string;
  icon: React.ReactNode;
  description: string;
  supportedNetworks: NetworkId[];
}

const walletOptions: WalletOption[] = [
  {
    id: 'metamask',
    name: 'MetaMask',
    icon: <MetaMaskIcon />,
    description: 'Connect using MetaMask',
    supportedNetworks: ['ETH', 'BNB']
  },
  {
    id: 'tronlink',
    name: 'TronLink',
    icon: <TronLinkIcon />,
    description: 'Connect using TronLink',
    supportedNetworks: ['TRX']
  },
  {
    id: 'coinbase',
    name: 'Coinbase Wallet',
    icon: <CoinbaseIcon />,
    description: 'Connect using Coinbase',
    supportedNetworks: ['ETH', 'BNB']
  },
  {
    id: 'trustwallet',
    name: 'Trust Wallet',
    icon: <TrustWalletIcon />,
    description: 'Connect using Trust Wallet',
    supportedNetworks: ['ETH', 'BNB']
  },
  {
    id: 'walletconnect',
    name: 'WalletConnect',
    icon: <WalletConnectIcon />,
    description: 'Scan with WalletConnect',
    supportedNetworks: ['ETH', 'BNB']
  }
];

// ============================================================================
// WALLET MODAL COMPONENT
// ============================================================================
interface WalletModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectWallet: (walletId: string, network: NetworkConfig) => void;
  selectedNetwork?: NetworkId;
}

const WalletModal: React.FC<WalletModalProps> = ({ isOpen, onClose, onSelectWallet, selectedNetwork: initialNetwork }) => {
  const [step, setStep] = useState<'network' | 'wallet'>('network');
  const [selectedNetwork, setSelectedNetwork] = useState<NetworkConfig | null>(
    initialNetwork ? NETWORK_LIST.find(n => n.id === initialNetwork) || null : null
  );

  if (!isOpen) return null;

  const handleNetworkSelect = (network: NetworkConfig) => {
    setSelectedNetwork(network);
    setStep('wallet');
  };

  const handleWalletSelect = (walletId: string) => {
    if (selectedNetwork) {
      onSelectWallet(walletId, selectedNetwork);
      // Reset for next time
      setStep('network');
      setSelectedNetwork(null);
    }
  };

  const handleBack = () => {
    setStep('network');
    setSelectedNetwork(null);
  };

  const handleClose = () => {
    setStep('network');
    setSelectedNetwork(null);
    onClose();
  };

  const availableWallets = selectedNetwork
    ? walletOptions.filter(w => w.supportedNetworks.includes(selectedNetwork.id))
    : [];

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-6 bg-black/80 backdrop-blur-sm">
      <div className="relative w-full max-w-sm bg-[#111111] border border-white/10 rounded-xl p-6 shadow-2xl">
        {/* Close Button */}
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-[#929292] hover:text-white hover:border-white/20 transition-all"
        >
          <X size={16} />
        </button>

        {/* Step 1: Network Selection */}
        {step === 'network' && (
          <>
            <div className="text-center mb-6">
              <h3 className="text-xl font-bold text-white mb-2">Select Network</h3>
              <p className="text-[#929292] text-sm">Choose your preferred blockchain network</p>
            </div>

            <div className="space-y-3">
              {NETWORK_LIST.map((network) => (
                <button
                  key={network.id}
                  onClick={() => handleNetworkSelect(network)}
                  className="w-full flex items-center gap-4 p-4 rounded-xl bg-[#030303] border border-white/5 hover:border-[#0b71ff]/30 hover:bg-[#0b71ff]/5 transition-all group"
                >
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center overflow-hidden" style={{ backgroundColor: `${network.color}20` }}>
                    <NetworkIcon networkId={network.id} />
                  </div>
                  <div className="text-left flex-1">
                    <p className="text-sm font-semibold text-white group-hover:text-[#0b71ff] transition-colors">
                      {network.name}
                    </p>
                    <p className="text-xs text-[#929292]">Pay with USDT ({network.shortName})</p>
                  </div>
                  <ChevronRight size={18} className="text-[#929292] group-hover:text-[#0b71ff]" />
                </button>
              ))}
            </div>

            <p className="text-center text-xs text-[#929292] mt-6">
              All payments are made in USDT stablecoin
            </p>
          </>
        )}

        {/* Step 2: Wallet Selection */}
        {step === 'wallet' && selectedNetwork && (
          <>
            {/* Back Button */}
            <button
              onClick={handleBack}
              className="absolute top-4 left-4 w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-[#929292] hover:text-white hover:border-white/20 transition-all"
            >
              <ChevronLeft size={16} />
            </button>

            <div className="text-center mb-6">
              <div className="flex items-center justify-center gap-2 mb-2">
                <div className="w-6 h-6 rounded-md flex items-center justify-center overflow-hidden" style={{ backgroundColor: `${selectedNetwork.color}20` }}>
                  <NetworkIcon networkId={selectedNetwork.id} className="w-5 h-5" />
                </div>
                <h3 className="text-xl font-bold text-white">Connect Wallet</h3>
              </div>
              <p className="text-[#929292] text-sm">
                Choose a wallet for {selectedNetwork.name}
              </p>
            </div>

            <div className="space-y-3">
              {availableWallets.map((wallet) => (
                <button
                  key={wallet.id}
                  onClick={() => handleWalletSelect(wallet.id)}
                  className="w-full flex items-center gap-4 p-4 rounded-xl bg-[#030303] border border-white/5 hover:border-[#0b71ff]/30 hover:bg-[#0b71ff]/5 transition-all group"
                >
                  <div className="w-10 h-10 rounded-lg bg-white flex items-center justify-center overflow-hidden p-1">
                    {wallet.icon}
                  </div>
                  <div className="text-left">
                    <p className="text-sm font-semibold text-white group-hover:text-[#0b71ff] transition-colors">
                      {wallet.name}
                    </p>
                    <p className="text-xs text-[#929292]">{wallet.description}</p>
                  </div>
                </button>
              ))}
            </div>

            <p className="text-center text-xs text-[#929292] mt-6">
              By connecting, you agree to our Terms of Service
            </p>
          </>
        )}
      </div>
    </div>
  );
};

export { NetworkIcon };
export default WalletModal;
