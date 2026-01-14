
import React from 'react';
import { XOXLogo } from '../constants';
import { AppState } from '../types';

interface HeaderProps {
  address: string | null;
  onConnect: () => void;
  onSetState: (state: AppState) => void;
  currentState: AppState;
}

const Header: React.FC<HeaderProps> = ({ address, onConnect, onSetState, currentState }) => {
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-[#020617]/40 backdrop-blur-xl border-b border-white/5">
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        <div className="flex items-center gap-10">
          <button onClick={() => onSetState('LANDING')} className="hover:opacity-80 transition-opacity">
            <XOXLogo className="scale-75 origin-left" />
          </button>
          
          <div className="hidden lg:flex gap-8">
            <NavButton 
              active={currentState === 'DASHBOARD'} 
              onClick={() => onSetState('DASHBOARD')}
            >
              VIP PERKS
            </NavButton>
            <NavButton 
              active={currentState === 'ADMIN'} 
              onClick={() => onSetState('ADMIN')}
            >
              ADMIN
            </NavButton>
          </div>
        </div>

        <div className="flex items-center gap-4">
          {address ? (
            <div className="flex items-center gap-4 px-4 py-1.5 rounded-full bg-slate-900/50 border border-white/10">
              <div className="flex flex-col items-end">
                <span className="text-[9px] text-cyan font-bold tracking-[0.2em] leading-none">WALLET CONNECTED</span>
                <span className="text-xs font-mono text-white leading-none mt-1">{address.slice(0, 6)}...{address.slice(-4)}</span>
              </div>
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#00E8FF] to-[#0066FF] flex items-center justify-center shadow-lg shadow-cyan-500/20">
                 <span className="text-[10px] font-bold text-slate-950">Ξ</span>
              </div>
            </div>
          ) : (
            <button 
              onClick={onConnect}
              className="px-6 py-2 rounded-lg bg-gradient-to-r from-[#00E8FF] to-[#0066FF] text-slate-950 text-xs font-black tracking-widest transition-all hover:brightness-110 active:scale-95 shadow-[0_0_20px_rgba(0,232,255,0.3)]"
            >
              CONNECT WALLET
            </button>
          )}
        </div>
      </div>
    </nav>
  );
};

const NavButton: React.FC<{ active: boolean; children: React.ReactNode; onClick: () => void }> = ({ active, children, onClick }) => (
  <button 
    onClick={onClick}
    className={`relative py-1 text-[11px] font-black tracking-[0.2em] transition-all uppercase ${
      active ? 'text-[#00E8FF]' : 'text-slate-400 hover:text-white'
    }`}
  >
    {children}
    {active && (
      <span className="absolute -bottom-1 left-0 w-full h-[2px] bg-[#00E8FF] shadow-[0_0_8px_rgba(0,232,255,0.8)]" />
    )}
  </button>
);

export default Header;
