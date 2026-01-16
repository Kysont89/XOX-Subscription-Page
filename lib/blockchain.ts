/**
 * Blockchain Verification Library
 * Verifies USDT transactions on ETH, BNB, and TRON networks
 */

import { ethers } from 'ethers';

// USDT Contract Addresses
const USDT_CONTRACTS: Record<string, string> = {
  ETH: '0xdAC17F958D2ee523a2206206994597C13D831ec7',
  BNB: '0x55d398326f99059fF775485246999027B3197955',
  TRX: 'TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t'
};

// USDT Decimals
const USDT_DECIMALS: Record<string, number> = {
  ETH: 6,
  BNB: 18,
  TRX: 6
};

// ERC20 Transfer event signature
const TRANSFER_EVENT_TOPIC = ethers.id('Transfer(address,address,uint256)');

interface VerificationResult {
  verified: boolean;
  error?: string;
  from?: string;
  to?: string;
  amount?: number;
  blockNumber?: number;
  timestamp?: number;
}

/**
 * Get RPC provider for network
 */
function getProvider(network: string): ethers.JsonRpcProvider | null {
  const rpcUrls: Record<string, string | undefined> = {
    ETH: process.env.ETH_RPC_URL,
    BNB: process.env.BNB_RPC_URL || 'https://bsc-dataseed.binance.org'
  };

  const rpcUrl = rpcUrls[network];
  if (!rpcUrl) return null;

  return new ethers.JsonRpcProvider(rpcUrl);
}

/**
 * Verify EVM transaction (ETH or BNB)
 */
async function verifyEVMTransaction(
  txHash: string,
  network: 'ETH' | 'BNB',
  expectedRecipient: string,
  expectedAmount: number
): Promise<VerificationResult> {
  try {
    const provider = getProvider(network);
    if (!provider) {
      return { verified: false, error: `No RPC URL configured for ${network}` };
    }

    // Get transaction receipt
    const receipt = await provider.getTransactionReceipt(txHash);
    if (!receipt) {
      return { verified: false, error: 'Transaction not found or not confirmed' };
    }

    // Check if transaction was successful
    if (receipt.status !== 1) {
      return { verified: false, error: 'Transaction failed' };
    }

    // Find Transfer event from USDT contract
    const usdtContract = USDT_CONTRACTS[network].toLowerCase();
    const transferLog = receipt.logs.find(log =>
      log.address.toLowerCase() === usdtContract &&
      log.topics[0] === TRANSFER_EVENT_TOPIC
    );

    if (!transferLog) {
      return { verified: false, error: 'No USDT transfer found in transaction' };
    }

    // Decode transfer event
    const from = '0x' + transferLog.topics[1].slice(26);
    const to = '0x' + transferLog.topics[2].slice(26);
    const amountRaw = BigInt(transferLog.data);
    const decimals = USDT_DECIMALS[network];
    const amount = Number(amountRaw) / (10 ** decimals);

    // Verify recipient
    if (to.toLowerCase() !== expectedRecipient.toLowerCase()) {
      return {
        verified: false,
        error: `Recipient mismatch. Expected: ${expectedRecipient}, Got: ${to}`,
        from, to, amount
      };
    }

    // Verify amount (allow 0.1% tolerance for rounding)
    const tolerance = expectedAmount * 0.001;
    if (Math.abs(amount - expectedAmount) > tolerance) {
      return {
        verified: false,
        error: `Amount mismatch. Expected: ${expectedAmount}, Got: ${amount}`,
        from, to, amount
      };
    }

    // Get block for timestamp
    const block = await provider.getBlock(receipt.blockNumber);

    return {
      verified: true,
      from,
      to,
      amount,
      blockNumber: receipt.blockNumber,
      timestamp: block?.timestamp
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return { verified: false, error: `Verification failed: ${message}` };
  }
}

/**
 * Verify TRON transaction
 */
async function verifyTronTransaction(
  txHash: string,
  expectedRecipient: string,
  expectedAmount: number
): Promise<VerificationResult> {
  try {
    const tronApiUrl = process.env.TRON_API_URL || 'https://api.trongrid.io';

    // Fetch transaction info
    const response = await fetch(`${tronApiUrl}/v1/transactions/${txHash}`);
    if (!response.ok) {
      return { verified: false, error: 'Transaction not found' };
    }

    const data = await response.json();
    if (!data.data || data.data.length === 0) {
      return { verified: false, error: 'Transaction data not available' };
    }

    const tx = data.data[0];

    // Check if transaction was successful
    if (tx.ret && tx.ret[0] && tx.ret[0].contractRet !== 'SUCCESS') {
      return { verified: false, error: `Transaction failed: ${tx.ret[0].contractRet}` };
    }

    // Get transaction info for TRC20 transfer details
    const infoResponse = await fetch(`${tronApiUrl}/v1/transactions/${txHash}/events`);
    if (!infoResponse.ok) {
      return { verified: false, error: 'Could not fetch transaction events' };
    }

    const eventsData = await infoResponse.json();
    const events = eventsData.data || [];

    // Find Transfer event from USDT contract
    const usdtContract = USDT_CONTRACTS.TRX;
    const transferEvent = events.find((event: { contract_address: string; event_name: string }) =>
      event.contract_address === usdtContract &&
      event.event_name === 'Transfer'
    );

    if (!transferEvent) {
      return { verified: false, error: 'No USDT transfer found in transaction' };
    }

    const from = transferEvent.result.from || transferEvent.result._from;
    const to = transferEvent.result.to || transferEvent.result._to;
    const amountRaw = transferEvent.result.value || transferEvent.result._value;
    const amount = Number(amountRaw) / (10 ** 6); // USDT TRC20 has 6 decimals

    // Verify recipient
    if (to !== expectedRecipient) {
      return {
        verified: false,
        error: `Recipient mismatch. Expected: ${expectedRecipient}, Got: ${to}`,
        from, to, amount
      };
    }

    // Verify amount
    const tolerance = expectedAmount * 0.001;
    if (Math.abs(amount - expectedAmount) > tolerance) {
      return {
        verified: false,
        error: `Amount mismatch. Expected: ${expectedAmount}, Got: ${amount}`,
        from, to, amount
      };
    }

    return {
      verified: true,
      from,
      to,
      amount,
      blockNumber: tx.blockNumber,
      timestamp: Math.floor(tx.block_timestamp / 1000)
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return { verified: false, error: `Verification failed: ${message}` };
  }
}

/**
 * Verify transaction on any supported network
 */
export async function verifyTransaction(
  txHash: string,
  network: string,
  expectedRecipient: string,
  expectedAmount: number
): Promise<VerificationResult> {
  switch (network) {
    case 'ETH':
    case 'BNB':
      return verifyEVMTransaction(txHash, network, expectedRecipient, expectedAmount);
    case 'TRX':
      return verifyTronTransaction(txHash, expectedRecipient, expectedAmount);
    default:
      return { verified: false, error: `Unsupported network: ${network}` };
  }
}

/**
 * Get receiving wallet for network
 */
export function getReceivingWallet(network: string): string | null {
  if (network === 'TRX') {
    return process.env.RECEIVING_WALLET_TRON || null;
  }
  return process.env.RECEIVING_WALLET_EVM || null;
}
