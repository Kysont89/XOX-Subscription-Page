
export enum VipLevel {
  NONE = 0,
  BRONZE = 3,
  SILVER = 4,
  GOLD_STAR = 5
}

export interface Package {
  id: number;
  name: string;
  price: number;
  level: VipLevel;
  tradingFee: string;
  feeDiscount: string;
  pointMultiplier: string;
  rebate: string;
  featured?: boolean;
  maintenanceVolume: string;
  maintenanceUsers?: number;
}

export interface SubscriptionRecord {
  id: string;
  userAddress: string;
  userName: string;
  userEmail: string;
  userPhone: string;
  packageName: string;
  amount: number;
  timestamp: number;
  txHash: string;
}

export type AppState = 'LANDING' | 'DASHBOARD' | 'SUCCESS' | 'ADMIN';
