
import React from 'react';
import { X } from 'lucide-react';
import { NetworkId } from '../config/networks';

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

const NetworkIcon: React.FC<{ networkId: NetworkId; className?: string }> = ({ networkId }) => {
  switch (networkId) {
    case 'ETH': return <EthIcon />;
    case 'BNB': return <BnbIcon />;
    case 'TRX': return <TrxIcon />;
    default: return null;
  }
};

// TronLink Icon
const TronLinkIcon = () => (
  <svg viewBox="0 0 40 40" fill="none" className="w-7 h-7">
    <rect width="40" height="40" rx="8" fill="#2B2F3B"/>
    <path d="M10 11L30 13L22 32L10 11Z" fill="#FF0013"/>
    <path d="M10 11L30 13L24 18L10 11Z" fill="#FF4E5A"/>
  </svg>
);

// ============================================================================
// WALLET MODAL COMPONENT
// ============================================================================
interface WalletModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConnectTron: () => Promise<boolean>;
  onOpenAppKit: () => void;
}

const WalletModal: React.FC<WalletModalProps> = ({
  isOpen,
  onClose,
  onConnectTron,
  onOpenAppKit
}) => {
  if (!isOpen) return null;

  const handleTronSelect = async () => {
    onClose();
    await onConnectTron();
  };

  const handleEVMSelect = () => {
    onClose();
    onOpenAppKit();
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-6 bg-black/80 backdrop-blur-sm">
      <div className="relative w-full max-w-sm bg-[#111111] border border-white/10 rounded-xl p-6 shadow-2xl">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-[#929292] hover:text-white hover:border-white/20 transition-all"
        >
          <X size={16} />
        </button>

        <div className="text-center mb-6">
          <h3 className="text-xl font-bold text-white mb-2">Connect Wallet</h3>
          <p className="text-[#929292] text-sm">Choose your preferred connection method</p>
        </div>

        <div className="space-y-3">
          {/* EVM Networks - Opens AppKit */}
          <button
            onClick={handleEVMSelect}
            className="w-full flex items-center gap-4 p-4 rounded-xl bg-[#030303] border border-white/5 hover:border-[#0b71ff]/30 hover:bg-[#0b71ff]/5 transition-all group"
          >
            <div className="flex -space-x-2">
              <div className="w-10 h-10 rounded-full bg-[#627EEA]/20 flex items-center justify-center border-2 border-[#111111]">
                <EthIcon />
              </div>
              <div className="w-10 h-10 rounded-full bg-[#F3BA2F]/20 flex items-center justify-center border-2 border-[#111111]">
                <BnbIcon />
              </div>
            </div>
            <div className="text-left flex-1">
              <p className="text-sm font-semibold text-white group-hover:text-[#0b71ff] transition-colors">
                Ethereum / BNB Chain
              </p>
              <p className="text-xs text-[#929292]">MetaMask, WalletConnect, Google, Email</p>
            </div>
          </button>

          {/* TRON Network - Direct TronLink */}
          <button
            onClick={handleTronSelect}
            className="w-full flex items-center gap-4 p-4 rounded-xl bg-[#030303] border border-white/5 hover:border-[#FF0013]/30 hover:bg-[#FF0013]/5 transition-all group"
          >
            <div className="w-10 h-10 rounded-lg bg-white flex items-center justify-center overflow-hidden p-1">
              <TronLinkIcon />
            </div>
            <div className="text-left flex-1">
              <p className="text-sm font-semibold text-white group-hover:text-[#FF0013] transition-colors">
                TRON Network
              </p>
              <p className="text-xs text-[#929292]">Connect using TronLink</p>
            </div>
          </button>
        </div>

        <p className="text-center text-xs text-[#929292] mt-6">
          All payments are made in USDT stablecoin
        </p>
      </div>
    </div>
  );
};

export { NetworkIcon };
export default WalletModal;
