
import React from 'react';
import { X } from 'lucide-react';

interface WalletOption {
  id: string;
  name: string;
  icon: React.ReactNode;
  description: string;
}

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

const walletOptions: WalletOption[] = [
  {
    id: 'metamask',
    name: 'MetaMask',
    icon: <MetaMaskIcon />,
    description: 'Connect using MetaMask wallet'
  },
  {
    id: 'coinbase',
    name: 'Coinbase Wallet',
    icon: <CoinbaseIcon />,
    description: 'Connect using Coinbase Wallet'
  },
  {
    id: 'trustwallet',
    name: 'Trust Wallet',
    icon: <TrustWalletIcon />,
    description: 'Connect using Trust Wallet'
  },
  {
    id: 'walletconnect',
    name: 'WalletConnect',
    icon: <WalletConnectIcon />,
    description: 'Scan with WalletConnect'
  }
];

interface WalletModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectWallet: (walletId: string) => void;
}

const WalletModal: React.FC<WalletModalProps> = ({ isOpen, onClose, onSelectWallet }) => {
  if (!isOpen) return null;

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

        {/* Header */}
        <div className="text-center mb-6">
          <h3 className="text-xl font-bold text-white mb-2">Connect Wallet</h3>
          <p className="text-[#929292] text-sm">Choose your preferred wallet</p>
        </div>

        {/* Wallet Options */}
        <div className="space-y-3">
          {walletOptions.map((wallet) => (
            <button
              key={wallet.id}
              onClick={() => onSelectWallet(wallet.id)}
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

        {/* Footer */}
        <p className="text-center text-xs text-[#929292] mt-6">
          By connecting, you agree to our Terms of Service
        </p>
      </div>
    </div>
  );
};

export default WalletModal;
