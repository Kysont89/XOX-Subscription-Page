
import React from 'react';
import { Package } from '../types';
import { Check } from 'lucide-react';

interface PricingCardProps {
  pkg: Package;
  onSubscribe: (pkg: Package) => void;
  disabled?: boolean;
}

const PricingCard: React.FC<PricingCardProps> = ({ pkg, onSubscribe, disabled }) => {
  const isFeatured = pkg.featured;

  return (
    <div className={`relative flex flex-col p-8 rounded-2xl transition-all duration-500 group border ${
      isFeatured 
        ? 'bg-slate-900/60 border-[#00E8FF] shadow-[0_0_40px_rgba(0,232,255,0.1)] scale-[1.02] z-10' 
        : 'bg-slate-900/40 border-white/5 hover:border-white/10'
    } backdrop-blur-md`}>
      
      {isFeatured && (
        <div className="absolute -top-3 left-6 px-3 py-1 bg-[#00E8FF] text-slate-950 rounded-sm text-[10px] font-black tracking-widest uppercase shadow-[0_0_15px_rgba(0,232,255,0.4)]">
          RECOMENDED
        </div>
      )}

      <div className="mb-8">
        <h3 className={`text-sm font-black tracking-[0.15em] mb-4 uppercase ${isFeatured ? 'text-[#00E8FF]' : 'text-slate-400'}`}>
          {pkg.name}
        </h3>
        <div className="flex items-baseline gap-2">
          <span className={`text-5xl font-mono font-bold tracking-tighter ${isFeatured ? 'text-white text-glow-cyan' : 'text-slate-200'}`}>
            {pkg.price.toLocaleString()}
          </span>
          <span className="text-slate-500 text-sm font-bold tracking-widest">USDT</span>
        </div>
      </div>

      <div className="h-[1px] w-full bg-gradient-to-r from-transparent via-white/10 to-transparent mb-8" />

      <div className="space-y-5 mb-10 flex-grow">
        <Feature label="Trading Fees" value={pkg.tradingFee} sub={`(${pkg.feeDiscount} Off)`} active={isFeatured} />
        <Feature label="Multiplier" value={pkg.pointMultiplier} active={isFeatured} />
        <Feature label="Rebate" value={pkg.rebate} active={isFeatured} />
      </div>

      <button 
        disabled={disabled}
        onClick={() => onSubscribe(pkg)}
        className={`w-full py-4 rounded-lg font-black text-xs tracking-[0.2em] transition-all active:scale-[0.98] disabled:opacity-50 disabled:grayscale disabled:cursor-not-allowed ${
          isFeatured
            ? 'bg-gradient-to-r from-[#00E8FF] to-[#0066FF] text-slate-950 shadow-[0_0_20px_rgba(0,232,255,0.3)] hover:brightness-110'
            : 'bg-slate-800 text-white hover:bg-slate-700'
        }`}
      >
        {disabled ? 'ACTIVE STATUS' : 'SUBSCRIBE NOW'}
      </button>
    </div>
  );
};

const Feature: React.FC<{ label: string; value: string; sub?: string; active?: boolean }> = ({ label, value, sub, active }) => (
  <div className="flex items-center justify-between">
    <div className="flex items-center gap-2">
      <div className={`rounded-full p-0.5 ${active ? 'bg-[#00E8FF]' : 'bg-slate-700'}`}>
        <Check size={10} className={active ? 'text-slate-950' : 'text-slate-400'} strokeWidth={4} />
      </div>
      <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">{label}</p>
    </div>
    <div className="text-right">
       <p className={`text-xs font-mono font-bold ${active ? 'text-white' : 'text-slate-300'}`}>
        {value}
      </p>
      {sub && <p className="text-[9px] text-[#00E8FF] font-bold tracking-tight">{sub}</p>}
    </div>
  </div>
);

export default PricingCard;
