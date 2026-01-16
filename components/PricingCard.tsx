
import React from 'react';
import { Package } from '../types';
import { Check, TrendingUp, Users } from 'lucide-react';

interface PricingCardProps {
  pkg: Package;
  onSubscribe: (pkg: Package) => void;
  disabled?: boolean;
}

const PricingCard: React.FC<PricingCardProps> = ({ pkg, onSubscribe, disabled }) => {
  const isFeatured = pkg.featured;

  return (
    <div className={`relative flex flex-col p-6 rounded-xl transition-all duration-300 border ${
      isFeatured
        ? 'bg-[#111111] border-[#0b71ff] shadow-[0_0_30px_rgba(11,113,255,0.15)]'
        : 'bg-[#111111] border-white/10 hover:border-white/20'
    }`}>

      {isFeatured && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-[#0b71ff] text-white rounded-full text-xs font-medium">
          Recommended
        </div>
      )}

      {/* Package Name */}
      <div className="mb-6 pt-2">
        <h3 className={`text-sm font-medium uppercase tracking-wider mb-3 ${isFeatured ? 'text-[#0b71ff]' : 'text-[#929292]'}`}>
          {pkg.name}
        </h3>
        <div className="flex items-baseline gap-2">
          <span className="text-4xl font-bold text-white">
            {pkg.price.toLocaleString()}
          </span>
          <span className="text-[#929292] text-sm font-medium">USDT</span>
        </div>
      </div>

      {/* Divider */}
      <div className="h-px w-full bg-white/10 mb-6" />

      {/* Features */}
      <div className="space-y-4 mb-6 flex-grow">
        <Feature label="Trading Fees" value={pkg.tradingFee} sub={`${pkg.feeDiscount} Off`} />
        <Feature label="Point Multiplier" value={pkg.pointMultiplier} />
        <Feature label="Commission Rebate" value={pkg.rebate} />
      </div>

      {/* Maintenance Requirements */}
      <div className="mb-6 p-4 rounded-lg bg-[#030303] border border-white/5">
        <p className="text-xs text-[#929292] uppercase tracking-wider font-medium mb-3">
          Maintenance Requirements
        </p>
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm">
            <TrendingUp size={14} className="text-[#0b71ff]" />
            <span className="text-[#929292]">Trading Volume:</span>
            <span className="text-white font-medium ml-auto">{pkg.maintenanceVolume}</span>
          </div>
          {pkg.maintenanceUsers && (
            <div className="flex items-center gap-2 text-sm">
              <Users size={14} className="text-[#0b71ff]" />
              <span className="text-[#929292]">Active Users:</span>
              <span className="text-white font-medium ml-auto">{pkg.maintenanceUsers}</span>
            </div>
          )}
        </div>
      </div>

      {/* Subscribe Button */}
      <button
        disabled={disabled}
        onClick={() => onSubscribe(pkg)}
        className={`w-full py-3.5 rounded-lg font-semibold text-sm transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed ${
          isFeatured
            ? 'bg-[#0b71ff] text-white hover:bg-[#0960d9]'
            : 'bg-white/5 text-white border border-white/10 hover:bg-white/10'
        }`}
      >
        {disabled ? 'Current Plan' : 'Subscribe Now'}
      </button>
    </div>
  );
};

const Feature: React.FC<{ label: string; value: string; sub?: string }> = ({ label, value, sub }) => (
  <div className="flex items-center justify-between">
    <div className="flex items-center gap-2">
      <div className="w-5 h-5 rounded-full bg-[#0b71ff]/10 flex items-center justify-center">
        <Check size={12} className="text-[#0b71ff]" strokeWidth={3} />
      </div>
      <span className="text-sm text-[#929292]">{label}</span>
    </div>
    <div className="text-right">
      <span className="text-sm font-medium text-white">{value}</span>
      {sub && <span className="text-xs text-[#0b71ff] ml-1">({sub})</span>}
    </div>
  </div>
);

export default PricingCard;
