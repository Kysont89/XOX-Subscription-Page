
import React from 'react';
import { XOXLogo } from '../constants';
import { AppState } from '../types';

interface HeaderProps {
  address: string | null;
  onConnect: () => void;
  onSetState: (state: AppState) => void;
  currentState: AppState;
  isAdmin: boolean;
}

const Header: React.FC<HeaderProps> = ({ address, onConnect, onSetState, currentState, isAdmin }) => {
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

        <div className="flex items-center gap-4">
          {address ? (
            <div className="flex items-center gap-3 px-4 py-2 rounded-full bg-[#111111] border border-white/10">
              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
              <span className="text-sm font-medium text-white">{address.slice(0, 6)}...{address.slice(-4)}</span>
            </div>
          ) : (
            <button
              onClick={onConnect}
              className="px-5 py-2.5 rounded-lg bg-[#0b71ff] text-white text-sm font-semibold transition-all hover:bg-[#0960d9] active:scale-95"
            >
              Connect
            </button>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Header;
