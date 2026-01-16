/**
 * Payment Service
 * Handles real USDT transfers on ETH, BNB, and TRX networks
 */

import { NetworkConfig, NetworkId, NETWORKS } from '../config/networks';

// ============================================================================
// RECEIVING WALLET ADDRESSES - UPDATE THESE WITH YOUR ADDRESSES
// ============================================================================
export const RECEIVING_WALLETS = {
  // Your EVM address (works for both ETH and BNB)
  EVM: '0x0000000000000000000000000000000000000000', // TODO: Update with your ETH/BNB address

  // Your Tron address
  TRON: 'T0000000000000000000000000000000000000' // TODO: Update with your TRON address
};

// ============================================================================
// USDT CONTRACT ADDRESSES (Official)
// ============================================================================
export const USDT_CONTRACTS = {
  ETH: '0xdAC17F958D2ee523a2206206994597C13D831ec7',  // USDT on Ethereum (6 decimals)
  BNB: '0x55d398326f99059fF775485246999027B3197955',  // USDT on BSC (18 decimals)
  TRX: 'TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t'          // USDT on Tron (6 decimals)
};

// ============================================================================
// ERC-20 / BEP-20 ABI (Minimal for transfers)
// ============================================================================
const ERC20_ABI = [
  // Read functions
  {
    constant: true,
    inputs: [{ name: '_owner', type: 'address' }],
    name: 'balanceOf',
    outputs: [{ name: 'balance', type: 'uint256' }],
    type: 'function'
  },
  {
    constant: true,
    inputs: [
      { name: '_owner', type: 'address' },
      { name: '_spender', type: 'address' }
    ],
    name: 'allowance',
    outputs: [{ name: '', type: 'uint256' }],
    type: 'function'
  },
  {
    constant: true,
    inputs: [],
    name: 'decimals',
    outputs: [{ name: '', type: 'uint8' }],
    type: 'function'
  },
  // Write functions
  {
    constant: false,
    inputs: [
      { name: '_spender', type: 'address' },
      { name: '_value', type: 'uint256' }
    ],
    name: 'approve',
    outputs: [{ name: '', type: 'bool' }],
    type: 'function'
  },
  {
    constant: false,
    inputs: [
      { name: '_to', type: 'address' },
      { name: '_value', type: 'uint256' }
    ],
    name: 'transfer',
    outputs: [{ name: '', type: 'bool' }],
    type: 'function'
  }
];

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================
export interface PaymentResult {
  success: boolean;
  txHash?: string;
  error?: string;
}

export interface TransactionStatus {
  status: 'pending' | 'confirming' | 'confirmed' | 'failed';
  txHash?: string;
  confirmations?: number;
  error?: string;
}

declare global {
  interface Window {
    ethereum?: {
      request: (args: { method: string; params?: unknown[] }) => Promise<unknown>;
      on: (event: string, callback: (...args: unknown[]) => void) => void;
      removeListener: (event: string, callback: (...args: unknown[]) => void) => void;
    };
    tronWeb?: {
      ready: boolean;
      defaultAddress: {
        base58: string;
        hex: string;
      };
      contract: () => {
        at: (address: string) => Promise<TronContract>;
      };
      toSun: (amount: number) => number;
      trx: {
        getTransaction: (txId: string) => Promise<{ ret?: Array<{ contractRet?: string }> }>;
      };
    };
  }
}

interface TronContract {
  methods: {
    balanceOf: (address: string) => { call: () => Promise<{ _hex?: string; toNumber?: () => number }> };
    allowance: (owner: string, spender: string) => { call: () => Promise<{ _hex?: string; toNumber?: () => number }> };
    approve: (spender: string, amount: string) => { send: (options?: object) => Promise<string> };
    transfer: (to: string, amount: string) => { send: (options?: object) => Promise<string> };
  };
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Convert amount to token units based on decimals
 */
function toTokenUnits(amount: number, decimals: number): string {
  const multiplier = BigInt(10 ** decimals);
  const amountBigInt = BigInt(Math.floor(amount)) * multiplier;
  return '0x' + amountBigInt.toString(16);
}

/**
 * Get receiving wallet for network
 */
export function getReceivingWallet(networkId: NetworkId): string {
  if (networkId === 'TRX') {
    return RECEIVING_WALLETS.TRON;
  }
  return RECEIVING_WALLETS.EVM;
}

/**
 * Check if receiving wallets are configured
 */
export function areWalletsConfigured(): boolean {
  const evmConfigured = RECEIVING_WALLETS.EVM !== '0x0000000000000000000000000000000000000000';
  const tronConfigured = RECEIVING_WALLETS.TRON !== 'T0000000000000000000000000000000000000';
  return evmConfigured || tronConfigured;
}

/**
 * Check if specific network wallet is configured
 */
export function isWalletConfigured(networkId: NetworkId): boolean {
  if (networkId === 'TRX') {
    return RECEIVING_WALLETS.TRON !== 'T0000000000000000000000000000000000000';
  }
  return RECEIVING_WALLETS.EVM !== '0x0000000000000000000000000000000000000000';
}

// ============================================================================
// EVM PAYMENT (ETH / BNB)
// ============================================================================

/**
 * Get USDT balance for EVM chains
 */
export async function getEVMBalance(userAddress: string, network: NetworkConfig): Promise<number> {
  if (!window.ethereum) throw new Error('No EVM wallet found');

  const usdtContract = USDT_CONTRACTS[network.id as 'ETH' | 'BNB'];

  const balance = await window.ethereum.request({
    method: 'eth_call',
    params: [
      {
        to: usdtContract,
        data: '0x70a08231000000000000000000000000' + userAddress.slice(2).toLowerCase()
      },
      'latest'
    ]
  }) as string;

  const balanceNum = parseInt(balance, 16);
  return balanceNum / (10 ** network.usdtDecimals);
}

/**
 * Check USDT allowance for EVM chains
 */
export async function getEVMAllowance(
  userAddress: string,
  spenderAddress: string,
  network: NetworkConfig
): Promise<number> {
  if (!window.ethereum) throw new Error('No EVM wallet found');

  const usdtContract = USDT_CONTRACTS[network.id as 'ETH' | 'BNB'];

  // allowance(owner, spender)
  const data = '0xdd62ed3e' +
    '000000000000000000000000' + userAddress.slice(2).toLowerCase() +
    '000000000000000000000000' + spenderAddress.slice(2).toLowerCase();

  const allowance = await window.ethereum.request({
    method: 'eth_call',
    params: [{ to: usdtContract, data }, 'latest']
  }) as string;

  const allowanceNum = parseInt(allowance, 16);
  return allowanceNum / (10 ** network.usdtDecimals);
}

/**
 * Approve USDT spending for EVM chains
 */
export async function approveEVMPayment(
  userAddress: string,
  amount: number,
  network: NetworkConfig
): Promise<PaymentResult> {
  if (!window.ethereum) {
    return { success: false, error: 'No EVM wallet found' };
  }

  try {
    const usdtContract = USDT_CONTRACTS[network.id as 'ETH' | 'BNB'];
    const receivingWallet = getReceivingWallet(network.id);
    const amountHex = toTokenUnits(amount, network.usdtDecimals);

    // approve(spender, amount)
    const data = '0x095ea7b3' +
      '000000000000000000000000' + receivingWallet.slice(2).toLowerCase() +
      amountHex.slice(2).padStart(64, '0');

    const txHash = await window.ethereum.request({
      method: 'eth_sendTransaction',
      params: [{
        from: userAddress,
        to: usdtContract,
        data: data,
        gas: '0x186A0' // 100000 gas
      }]
    }) as string;

    return { success: true, txHash };
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Approval failed';
    return { success: false, error: errorMessage };
  }
}

/**
 * Transfer USDT for EVM chains
 */
export async function transferEVMPayment(
  userAddress: string,
  amount: number,
  network: NetworkConfig
): Promise<PaymentResult> {
  if (!window.ethereum) {
    return { success: false, error: 'No EVM wallet found' };
  }

  try {
    const usdtContract = USDT_CONTRACTS[network.id as 'ETH' | 'BNB'];
    const receivingWallet = getReceivingWallet(network.id);
    const amountHex = toTokenUnits(amount, network.usdtDecimals);

    // transfer(to, amount)
    const data = '0xa9059cbb' +
      '000000000000000000000000' + receivingWallet.slice(2).toLowerCase() +
      amountHex.slice(2).padStart(64, '0');

    const txHash = await window.ethereum.request({
      method: 'eth_sendTransaction',
      params: [{
        from: userAddress,
        to: usdtContract,
        data: data,
        gas: '0x186A0' // 100000 gas
      }]
    }) as string;

    return { success: true, txHash };
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Transfer failed';
    return { success: false, error: errorMessage };
  }
}

/**
 * Wait for EVM transaction confirmation
 */
export async function waitForEVMConfirmation(txHash: string): Promise<TransactionStatus> {
  if (!window.ethereum) {
    return { status: 'failed', error: 'No EVM wallet found' };
  }

  try {
    let attempts = 0;
    const maxAttempts = 60; // 5 minutes with 5 second intervals

    while (attempts < maxAttempts) {
      const receipt = await window.ethereum.request({
        method: 'eth_getTransactionReceipt',
        params: [txHash]
      }) as { status: string; blockNumber: string } | null;

      if (receipt) {
        if (receipt.status === '0x1') {
          return { status: 'confirmed', txHash, confirmations: 1 };
        } else {
          return { status: 'failed', txHash, error: 'Transaction reverted' };
        }
      }

      await new Promise(resolve => setTimeout(resolve, 5000));
      attempts++;
    }

    return { status: 'pending', txHash, error: 'Confirmation timeout' };
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to check confirmation';
    return { status: 'failed', txHash, error: errorMessage };
  }
}

// ============================================================================
// TRON PAYMENT (TRX)
// ============================================================================

/**
 * Get USDT balance for Tron
 */
export async function getTronBalance(userAddress: string): Promise<number> {
  if (!window.tronWeb || !window.tronWeb.ready) {
    throw new Error('TronLink not ready');
  }

  const contract = await window.tronWeb.contract().at(USDT_CONTRACTS.TRX);
  const balance = await contract.methods.balanceOf(userAddress).call();

  // Handle different return types
  if (typeof balance === 'object' && balance._hex) {
    return parseInt(balance._hex, 16) / (10 ** 6);
  }
  if (typeof balance === 'object' && balance.toNumber) {
    return balance.toNumber() / (10 ** 6);
  }
  return Number(balance) / (10 ** 6);
}

/**
 * Approve USDT spending for Tron
 */
export async function approveTronPayment(amount: number): Promise<PaymentResult> {
  if (!window.tronWeb || !window.tronWeb.ready) {
    return { success: false, error: 'TronLink not ready' };
  }

  try {
    const contract = await window.tronWeb.contract().at(USDT_CONTRACTS.TRX);
    const receivingWallet = getReceivingWallet('TRX');
    const amountInSun = (amount * (10 ** 6)).toString();

    const txHash = await contract.methods.approve(receivingWallet, amountInSun).send();

    return { success: true, txHash };
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Approval failed';
    return { success: false, error: errorMessage };
  }
}

/**
 * Transfer USDT for Tron
 */
export async function transferTronPayment(amount: number): Promise<PaymentResult> {
  if (!window.tronWeb || !window.tronWeb.ready) {
    return { success: false, error: 'TronLink not ready' };
  }

  try {
    const contract = await window.tronWeb.contract().at(USDT_CONTRACTS.TRX);
    const receivingWallet = getReceivingWallet('TRX');
    const amountInSun = (amount * (10 ** 6)).toString();

    const txHash = await contract.methods.transfer(receivingWallet, amountInSun).send();

    return { success: true, txHash };
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Transfer failed';
    return { success: false, error: errorMessage };
  }
}

/**
 * Wait for Tron transaction confirmation
 */
export async function waitForTronConfirmation(txHash: string): Promise<TransactionStatus> {
  if (!window.tronWeb) {
    return { status: 'failed', error: 'TronLink not available' };
  }

  try {
    let attempts = 0;
    const maxAttempts = 60;

    while (attempts < maxAttempts) {
      const tx = await window.tronWeb.trx.getTransaction(txHash);

      if (tx && tx.ret && tx.ret[0]) {
        if (tx.ret[0].contractRet === 'SUCCESS') {
          return { status: 'confirmed', txHash, confirmations: 1 };
        } else {
          return { status: 'failed', txHash, error: tx.ret[0].contractRet };
        }
      }

      await new Promise(resolve => setTimeout(resolve, 3000));
      attempts++;
    }

    return { status: 'pending', txHash, error: 'Confirmation timeout' };
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to check confirmation';
    return { status: 'failed', txHash, error: errorMessage };
  }
}

// ============================================================================
// UNIFIED PAYMENT INTERFACE
// ============================================================================

/**
 * Process complete payment flow
 */
export async function processPayment(
  userAddress: string,
  amount: number,
  network: NetworkConfig,
  onStatusChange?: (status: string) => void
): Promise<PaymentResult> {
  // Check if wallet is configured
  if (!isWalletConfigured(network.id)) {
    return {
      success: false,
      error: `Receiving wallet not configured for ${network.name}. Please contact support.`
    };
  }

  try {
    if (network.walletType === 'tron') {
      // Tron payment flow
      onStatusChange?.('Requesting USDT approval...');
      const approvalResult = await approveTronPayment(amount);

      if (!approvalResult.success) {
        return approvalResult;
      }

      onStatusChange?.('Waiting for approval confirmation...');
      const approvalStatus = await waitForTronConfirmation(approvalResult.txHash!);

      if (approvalStatus.status !== 'confirmed') {
        return { success: false, error: approvalStatus.error || 'Approval failed' };
      }

      onStatusChange?.('Transferring USDT...');
      const transferResult = await transferTronPayment(amount);

      if (!transferResult.success) {
        return transferResult;
      }

      onStatusChange?.('Waiting for transfer confirmation...');
      const transferStatus = await waitForTronConfirmation(transferResult.txHash!);

      if (transferStatus.status === 'confirmed') {
        return { success: true, txHash: transferResult.txHash };
      } else {
        return { success: false, error: transferStatus.error || 'Transfer failed' };
      }
    } else {
      // EVM payment flow (ETH/BNB)
      onStatusChange?.('Requesting USDT approval...');
      const approvalResult = await approveEVMPayment(userAddress, amount, network);

      if (!approvalResult.success) {
        return approvalResult;
      }

      onStatusChange?.('Waiting for approval confirmation...');
      const approvalStatus = await waitForEVMConfirmation(approvalResult.txHash!);

      if (approvalStatus.status !== 'confirmed') {
        return { success: false, error: approvalStatus.error || 'Approval failed' };
      }

      onStatusChange?.('Transferring USDT...');
      const transferResult = await transferEVMPayment(userAddress, amount, network);

      if (!transferResult.success) {
        return transferResult;
      }

      onStatusChange?.('Waiting for transfer confirmation...');
      const transferStatus = await waitForEVMConfirmation(transferResult.txHash!);

      if (transferStatus.status === 'confirmed') {
        return { success: true, txHash: transferResult.txHash };
      } else {
        return { success: false, error: transferStatus.error || 'Transfer failed' };
      }
    }
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Payment failed';
    return { success: false, error: errorMessage };
  }
}
