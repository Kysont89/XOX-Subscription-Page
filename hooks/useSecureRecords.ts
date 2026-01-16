/**
 * Secure Records Hook
 * Provides subscription record storage with backend persistence
 * Falls back to localStorage when offline
 */

import { useState, useEffect, useCallback } from 'react';
import { SubscriptionRecord } from '../types';
import { sanitizeInput } from '../utils/security';
import {
  createSubscription,
  listSubscriptions,
  getAdminToken,
  SubscriptionResponse
} from '../services/api';

interface UseSecureRecordsReturn {
  records: SubscriptionRecord[];
  isLoading: boolean;
  error: string | null;
  integrityValid: boolean;
  saveRecord: (record: SubscriptionRecord) => Promise<boolean>;
  refreshRecords: () => Promise<void>;
  clearError: () => void;
}

/**
 * Sanitizes a subscription record to prevent XSS
 */
function sanitizeRecord(record: SubscriptionRecord): SubscriptionRecord {
  return {
    ...record,
    id: sanitizeInput(record.id),
    userAddress: record.userAddress.toLowerCase(),
    userName: sanitizeInput(record.userName),
    userEmail: sanitizeInput(record.userEmail),
    userPhone: sanitizeInput(record.userPhone),
    packageName: sanitizeInput(record.packageName),
    txHash: record.txHash.toLowerCase()
  };
}

/**
 * Convert API response to SubscriptionRecord
 */
function apiToRecord(sub: SubscriptionResponse): SubscriptionRecord {
  return {
    id: sub.id,
    userAddress: sub.user_address,
    userName: sub.user_name,
    userEmail: sub.user_email,
    userPhone: sub.user_phone || '',
    packageName: sub.package_name,
    amount: sub.amount,
    timestamp: new Date(sub.created_at).getTime(),
    txHash: sub.tx_hash,
    network: sub.network
  };
}

export function useSecureRecords(): UseSecureRecordsReturn {
  const [records, setRecords] = useState<SubscriptionRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [integrityValid, setIntegrityValid] = useState(true);

  /**
   * Load records from backend (admin) or from cache
   */
  const loadRecords = useCallback(async () => {
    setIsLoading(true);
    try {
      // If admin is logged in, fetch from backend
      const adminToken = getAdminToken();
      if (adminToken) {
        const result = await listSubscriptions({ limit: 1000 });
        if (result.data) {
          const fetchedRecords = result.data.subscriptions.map(apiToRecord);
          setRecords(fetchedRecords);
          setIntegrityValid(true);
          setError(null);
        } else if (result.error) {
          // Token might be expired
          if (result.error.includes('401') || result.error.includes('expired')) {
            setError('Session expired. Please re-authenticate.');
          } else {
            setError(result.error);
          }
        }
      } else {
        // Non-admin users don't see records, just their own from local cache
        const localData = localStorage.getItem('xox_my_subscriptions');
        if (localData) {
          try {
            const parsed = JSON.parse(localData);
            if (Array.isArray(parsed)) {
              setRecords(parsed);
            }
          } catch {
            setRecords([]);
          }
        }
      }
    } catch (err) {
      console.error('Error loading records:', err);
      setError('Failed to load subscription records');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Load records on mount
  useEffect(() => {
    loadRecords();
  }, [loadRecords]);

  /**
   * Refresh records from backend
   */
  const refreshRecords = useCallback(async () => {
    await loadRecords();
  }, [loadRecords]);

  /**
   * Save a new record to backend and local cache
   */
  const saveRecord = useCallback(async (record: SubscriptionRecord): Promise<boolean> => {
    try {
      // Sanitize record
      const sanitized = sanitizeRecord(record);

      // Save to backend
      const result = await createSubscription({
        userAddress: sanitized.userAddress,
        userName: sanitized.userName,
        userEmail: sanitized.userEmail,
        userPhone: sanitized.userPhone || undefined,
        packageName: sanitized.packageName,
        amount: sanitized.amount,
        network: sanitized.network || 'ETH',
        txHash: sanitized.txHash
      });

      if (result.error) {
        // Check if it's a duplicate (already recorded)
        if (result.error.includes('already recorded')) {
          // Not an error - transaction was already saved
          console.log('Transaction already recorded');
          return true;
        }
        setError(result.error);
        return false;
      }

      // Also save to local cache for user's reference
      const localData = localStorage.getItem('xox_my_subscriptions');
      let myRecords: SubscriptionRecord[] = [];
      if (localData) {
        try {
          myRecords = JSON.parse(localData);
        } catch {
          myRecords = [];
        }
      }

      // Add new record if not duplicate
      const isDuplicate = myRecords.some(r => r.txHash === sanitized.txHash);
      if (!isDuplicate) {
        myRecords = [sanitized, ...myRecords];
        localStorage.setItem('xox_my_subscriptions', JSON.stringify(myRecords));
      }

      // Update state
      setRecords(prev => {
        const exists = prev.some(r => r.txHash === sanitized.txHash);
        if (exists) return prev;
        return [sanitized, ...prev];
      });

      return true;
    } catch (err) {
      console.error('Error saving record:', err);
      setError('Failed to save record');
      return false;
    }
  }, []);

  /**
   * Clear error message
   */
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    records,
    isLoading,
    error,
    integrityValid,
    saveRecord,
    refreshRecords,
    clearError
  };
}

export default useSecureRecords;
