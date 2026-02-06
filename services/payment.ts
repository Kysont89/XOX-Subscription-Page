/**
 * Payment Service
 * Handles real USDT transfers on ETH, BNB, and TRX networks
 * EVM transactions use wagmi/viem (supports WalletConnect + injected wallets)
 * Tron transactions use TronLink directly
 */

import { getPublicClient, getWalletClient } from '@wagmi/core';
import { parseUnits, erc20Abi } from 'viem';
import { NetworkConfig, NetworkId, NETWORKS } from '../config/networks';
import { wagmiConfig } from '../config/web3';

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
// EVM PAYMENT (ETH / BNB) - via wagmi/viem
// ============================================================================

/**
 * Get USDT balance for EVM chains using wagmi public client
 */
export async function getEVMBalance(userAddress: string, network: NetworkConfig): Promise<number> {
  const publicClient = getPublicClient(wagmiConfig);
  if (!publicClient) throw new Error('No EVM client available');

  const usdtContract = USDT_CONTRACTS[network.id as 'ETH' | 'BNB'] as `0x${string}`;

  const balance = await publicClient.readContract({
    address: usdtContract,
    abi: erc20Abi,
    functionName: 'balanceOf',
    args: [userAddress as `0x${string}`]
  });

  return Number(balance) / (10 ** network.usdtDecimals);
}

/**
 * Check USDT allowance for EVM chains
 */
export async function getEVMAllowance(
  userAddress: string,
  spenderAddress: string,
  network: NetworkConfig
): Promise<number> {
  const publicClient = getPublicClient(wagmiConfig);
  if (!publicClient) throw new Error('No EVM client available');

  const usdtContract = USDT_CONTRACTS[network.id as 'ETH' | 'BNB'] as `0x${string}`;

  const allowance = await publicClient.readContract({
    address: usdtContract,
    abi: erc20Abi,
    functionName: 'allowance',
    args: [userAddress as `0x${string}`, spenderAddress as `0x${string}`]
  });

  return Number(allowance) / (10 ** network.usdtDecimals);
}

/**
 * Approve USDT spending for EVM chains via wagmi wallet client
 */
export async function approveEVMPayment(
  userAddress: string,
  amount: number,
  network: NetworkConfig
): Promise<PaymentResult> {
  try {
    const walletClient = await getWalletClient(wagmiConfig);
    if (!walletClient) {
      return { success: false, error: 'No EVM wallet connected' };
    }

    const usdtContract = USDT_CONTRACTS[network.id as 'ETH' | 'BNB'] as `0x${string}`;
    const receivingWallet = getReceivingWallet(network.id) as `0x${string}`;
    const amountInUnits = parseUnits(amount.toString(), network.usdtDecimals);

    const txHash = await walletClient.writeContract({
      address: usdtContract,
      abi: erc20Abi,
      functionName: 'approve',
      args: [receivingWallet, amountInUnits],
      account: userAddress as `0x${string}`
    });

    return { success: true, txHash };
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Approval failed';
    return { success: false, error: errorMessage };
  }
}

/**
 * Transfer USDT for EVM chains via wagmi wallet client
 */
export async function transferEVMPayment(
  userAddress: string,
  amount: number,
  network: NetworkConfig
): Promise<PaymentResult> {
  try {
    const walletClient = await getWalletClient(wagmiConfig);
    if (!walletClient) {
      return { success: false, error: 'No EVM wallet connected' };
    }

    const usdtContract = USDT_CONTRACTS[network.id as 'ETH' | 'BNB'] as `0x${string}`;
    const receivingWallet = getReceivingWallet(network.id) as `0x${string}`;
    const amountInUnits = parseUnits(amount.toString(), network.usdtDecimals);

    const txHash = await walletClient.writeContract({
      address: usdtContract,
      abi: erc20Abi,
      functionName: 'transfer',
      args: [receivingWallet, amountInUnits],
      account: userAddress as `0x${string}`
    });

    return { success: true, txHash };
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Transfer failed';
    return { success: false, error: errorMessage };
  }
}

/**
 * Wait for EVM transaction confirmation using wagmi public client
 */
export async function waitForEVMConfirmation(txHash: string): Promise<TransactionStatus> {
  try {
    const publicClient = getPublicClient(wagmiConfig);
    if (!publicClient) {
      return { status: 'failed', error: 'No EVM client available' };
    }

    const receipt = await publicClient.waitForTransactionReceipt({
      hash: txHash as `0x${string}`,
      timeout: 300_000 // 5 minutes
    });

    if (receipt.status === 'success') {
      return { status: 'confirmed', txHash, confirmations: 1 };
    } else {
      return { status: 'failed', txHash, error: 'Transaction reverted' };
    }
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to check confirmation';
    return { status: 'failed', txHash, error: errorMessage };
  }
}

// ============================================================================
// TRON PAYMENT (TRX) - unchanged, uses TronLink directly
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
      // EVM payment flow (ETH/BNB) - via wagmi/viem
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
