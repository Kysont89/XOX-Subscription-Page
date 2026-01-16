
import React from 'react';
import { Package } from '../types';
import { ExternalLink, CheckCircle2, ArrowRight } from 'lucide-react';

interface SuccessViewProps {
  pkg: Package;
  onReturn: () => void;
}

const SuccessView: React.FC<SuccessViewProps> = ({ pkg, onReturn }) => {
  return (
    <div className="max-w-2xl mx-auto px-6 py-24 flex flex-col items-center text-center">
      {/* Success Icon */}
      <div className="relative mb-8">
        <div className="w-20 h-20 rounded-full bg-green-500/10 flex items-center justify-center">
          <CheckCircle2 size={40} className="text-green-500" />
        </div>
      </div>

      {/* Success Message */}
      <h2 className="text-3xl md:text-4xl font-bold mb-3">Subscription Successful!</h2>
      <p className="text-[#929292] text-lg mb-10">Welcome to the elite trading experience</p>

      {/* Package Details Card */}
      <div className="w-full bg-[#111111] border border-white/10 p-8 rounded-xl mb-10">
        <p className="text-xs text-[#0b71ff] uppercase tracking-wider font-medium mb-3">Your New Status</p>
        <h3 className="text-2xl font-bold text-white mb-6">{pkg.name}</h3>

        <div className="grid grid-cols-3 gap-6">
          <Stat label="Trading Fee" value={pkg.tradingFee} />
          <Stat label="Multiplier" value={pkg.pointMultiplier} />
          <Stat label="Rebate" value={pkg.rebate} />
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-4 w-full max-w-md">
        <button
          onClick={() => window.open('https://xox.exchange', '_blank')}
          className="flex-1 px-6 py-3.5 bg-[#0b71ff] text-white font-semibold text-sm rounded-lg flex items-center justify-center gap-2 transition-all hover:bg-[#0960d9] active:scale-95"
        >
          Start Trading
          <ExternalLink size={16} />
        </button>
        <button
          onClick={onReturn}
          className="flex-1 px-6 py-3.5 bg-white/5 border border-white/10 text-white font-semibold text-sm rounded-lg transition-all hover:bg-white/10 active:scale-95"
        >
          Back to Dashboard
        </button>
      </div>
    </div>
  );
};

const Stat: React.FC<{ label: string; value: string }> = ({ label, value }) => (
  <div className="text-center">
    <p className="text-xs text-[#929292] uppercase tracking-wider mb-1">{label}</p>
    <p className="text-lg font-semibold text-white">{value}</p>
  </div>
);

export default SuccessView;
