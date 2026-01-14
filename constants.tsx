
import React from 'react';
import { Package, VipLevel } from './types';

export const COLORS = {
  primary: '#00E8FF', // XOX Cyan
  secondary: '#0066FF', // XOX Blue
  background: '#020617',
  card: 'rgba(15, 23, 42, 0.8)',
  text: '#FFFFFF',
  muted: '#94A3B8'
};

export const PACKAGES: Package[] = [
  {
    id: 1,
    name: "VIP 3 - ELITE ACCESS",
    price: 5000,
    level: VipLevel.BRONZE,
    tradingFee: "0.0028",
    feeDiscount: "10%",
    pointMultiplier: "1.1x",
    rebate: "15%",
  },
  {
    id: 2,
    name: "VIP 4 - PRO TRADER",
    price: 15000,
    level: VipLevel.SILVER,
    tradingFee: "0.0024",
    feeDiscount: "20%",
    pointMultiplier: "1.25x",
    rebate: "30%",
  },
  {
    id: 3,
    name: "VIP 5 - STAR AMBASSADOR",
    price: 38000,
    level: VipLevel.GOLD_STAR,
    tradingFee: "0.0020",
    feeDiscount: "33.3%",
    pointMultiplier: "1.4x",
    rebate: "50%",
    featured: true,
  }
];

export const XOXLogo: React.FC<{ className?: string }> = ({ className = "h-8" }) => (
  <div className={`flex items-center gap-2 font-bold tracking-tighter ${className}`}>
    <span className="text-white text-3xl font-sans font-extrabold italic">X</span>
    <div className="relative flex items-center justify-center">
      {/* The O as a stylized ring/sphere consistent with XOX branding */}
      <div className="w-9 h-9 rounded-full border-[3px] border-[#00E8FF] shadow-[0_0_15px_rgba(0,232,255,0.4)]"></div>
      <div className="absolute inset-0 flex items-center justify-center">
         <div className="w-5 h-5 rounded-full bg-gradient-to-tr from-[#00E8FF] to-[#0066FF] animate-pulse"></div>
      </div>
      {/* Moving orbital element */}
      <div className="absolute w-10 h-10 rounded-full border border-[#00E8FF]/20 animate-spin duration-[3000ms]">
         <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-white rounded-full shadow-[0_0_8px_#fff]"></div>
      </div>
    </div>
    <span className="text-white text-3xl font-sans font-extrabold italic">X</span>
  </div>
);
