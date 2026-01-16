
import React from 'react';
import { XOXLogo } from '../constants';
import { AppState } from '../types';
import { NetworkConfig } from '../config/networks';
import { NetworkIcon } from './WalletModal';
import { ChevronDown } from 'lucide-react';

interface HeaderProps {
  address: string | null;
  network: NetworkConfig | null;
  onConnect: () => void;
  onSetState: (state: AppState) => void;
  currentState: AppState;
  isAdmin: boolean;
}

const Header: React.FC<HeaderProps> = ({ address, network, onConnect, onSetState, currentState, isAdmin }) => {
  const formatAddress = (addr: string) => {
    if (addr.startsWith('T')) {
      // Tron address
      return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
    }
    // EVM address
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-[#030303]/80 backdrop-blur-xl border-b border-white/5">
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        <div className="flex items-center gap-12">
          <button onClick={() => onSetState('LANDING')} className="hover:opacity-80 transition-opacity">
            <XOXLogo className="h-8 w-auto" />
          </button>

          {isAdmin && (
            <div className="hidden lg:flex items-center gap-8">
              <button
                onClick={() => onSetState('ADMIN')}
                className={`text-sm font-medium transition-colors py-2 ${
                  currentState === 'ADMIN' ? 'text-white' : 'text-[#929292] hover:text-white'
                }`}
              >
                Admin
              </button>
            </div>
          )}
        </div>

        <div className="flex items-center gap-3">
          {address && network ? (
            <div className="flex items-center gap-2">
              {/* Network Badge */}
              <div
                className="flex items-center gap-2 px-3 py-2 rounded-lg border transition-all cursor-pointer hover:bg-white/5"
                style={{
                  backgroundColor: `${network.color}10`,
                  borderColor: `${network.color}30`
                }}
                onClick={onConnect}
                title="Click to switch network"
              >
                <div className="w-5 h-5">
                  <NetworkIcon networkId={network.id} />
                </div>
                <span className="text-xs font-medium" style={{ color: network.color }}>
                  {network.shortName}
                </span>
                <ChevronDown size={12} style={{ color: network.color }} />
              </div>

              {/* Wallet Address */}
              <div className="flex items-center gap-3 px-4 py-2 rounded-full bg-[#111111] border border-white/10">
                <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                <span className="text-sm font-medium text-white font-mono">
                  {formatAddress(address)}
                </span>
              </div>
            </div>
          ) : (
            <button
              onClick={onConnect}
              className="px-5 py-2.5 rounded-lg bg-[#0b71ff] text-white text-sm font-semibold transition-all hover:bg-[#0960d9] active:scale-95"
            >
              Connect Wallet
            </button>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Header;
