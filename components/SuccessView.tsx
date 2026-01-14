
import React from 'react';
import { Package } from '../types';
import { ExternalLink, CheckCircle2 } from 'lucide-react';

interface SuccessViewProps {
  pkg: Package;
  onReturn: () => void;
}

const SuccessView: React.FC<SuccessViewProps> = ({ pkg, onReturn }) => {
  return (
    <div className="max-w-3xl mx-auto px-6 py-24 flex flex-col items-center text-center">
      <div className="relative mb-10">
        <div className="w-32 h-32 rounded-full border-4 border-[#0066FF] border-t-transparent animate-spin duration-[2000ms] opacity-30" />
        <div className="absolute inset-0 flex items-center justify-center">
           <CheckCircle2 size={64} className="text-[#0066FF] animate-bounce-slow" />
        </div>
      </div>

      <h2 className="text-4xl md:text-5xl font-bold mb-4 tracking-tighter">Welcome to the Elite.</h2>
      <p className="text-xl text-zinc-400 mb-10 font-mono">Subscription Successful.</p>

      <div className="w-full bg-zinc-900 border border-white/10 p-10 rounded-[2.5rem] mb-12 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-[#0066FF]/10 blur-[50px] rounded-full" />
        
        <p className="text-xs font-bold text-[#0066FF] tracking-widest uppercase mb-4">YOUR NEW STATUS</p>
        <h3 className="text-3xl font-bold mb-8">{pkg.name}</h3>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-6 text-left">
          <Stat label="Fee Tier" value={pkg.tradingFee} />
          <Stat label="Point Multiplier" value={pkg.pointMultiplier} />
          <Stat label="Commission" value={pkg.rebate} />
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <button 
          onClick={() => window.location.href = '#'} // Mock link
          className="px-8 py-4 bg-[#0066FF] hover:bg-blue-600 text-white font-bold rounded-2xl flex items-center gap-2 transition-all shadow-lg shadow-blue-500/20 active:scale-95"
        >
          Go to Trading Platform
          <ExternalLink size={18} />
        </button>
        <button 
          onClick={onReturn}
          className="px-8 py-4 bg-zinc-900 border border-white/10 hover:border-white/20 text-white font-bold rounded-2xl transition-all active:scale-95"
        >
          View Dashboard
        </button>
      </div>
    </div>
  );
};

const Stat: React.FC<{ label: string; value: string }> = ({ label, value }) => (
  <div>
    <p className="text-[10px] text-zinc-500 uppercase font-bold tracking-widest mb-1">{label}</p>
    <p className="text-lg font-mono font-bold text-white">{value}</p>
  </div>
);

export default SuccessView;
