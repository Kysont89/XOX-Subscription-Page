
import React from 'react';
import { Package, VipLevel } from './types';

// Note: Admin wallet addresses are now managed securely in utils/security.ts
// This prevents exposure of admin addresses in client-side constants

export const COLORS = {
  primary: '#0b71ff', // XOX Blue
  secondary: '#0b71ff', // XOX Blue
  background: '#030303',
  card: '#111111',
  text: '#FFFFFF',
  muted: '#929292'
};

export const PACKAGES: Package[] = [
  {
    id: 1,
    name: "VIP 3 - ELITE ACCESS",
    price: 5000,
    level: VipLevel.BRONZE,
    tradingFee: "0.0028",
    feeDiscount: "10%",
    pointMultiplier: "1.2x",
    rebate: "40%",
    maintenanceVolume: "5M",
  },
  {
    id: 2,
    name: "VIP 4 - PRO TRADER",
    price: 20000,
    level: VipLevel.SILVER,
    tradingFee: "0.0024",
    feeDiscount: "20%",
    pointMultiplier: "1.3x",
    rebate: "45%",
    maintenanceVolume: "50M",
    maintenanceUsers: 30,
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
    maintenanceVolume: "100M",
    maintenanceUsers: 30,
  }
];

export const XOXLogo: React.FC<{ className?: string }> = ({ className = "h-8" }) => (
  <img
    src="/xox-logo.jpeg"
    alt="XOX"
    className={`${className} object-contain`}
  />
);
