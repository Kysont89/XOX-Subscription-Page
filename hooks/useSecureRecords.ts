/**
 * Secure Records Hook
 * Provides subscription record storage with integrity verification
 */

import { useState, useEffect, useCallback } from 'react';
import { SubscriptionRecord } from '../types';
import { secureStore, secureRetrieve, sanitizeInput } from '../utils/security';

const RECORDS_KEY = 'xox_subscriptions_secure';

interface UseSecureRecordsReturn {
  records: SubscriptionRecord[];
  isLoading: boolean;
  error: string | null;
  integrityValid: boolean;
  saveRecord: (record: SubscriptionRecord) => Promise<boolean>;
  clearError: () => void;
}

/**
 * Sanitizes a subscription record to prevent XSS
 */
function sanitizeRecord(record: SubscriptionRecord): SubscriptionRecord {
  return {
    ...record,
    id: sanitizeInput(record.id),
    userAddress: record.userAddress.toLowerCase(), // Addresses are already safe hex strings
    userName: sanitizeInput(record.userName),
    userEmail: sanitizeInput(record.userEmail),
    userPhone: sanitizeInput(record.userPhone),
    packageName: sanitizeInput(record.packageName),
    txHash: record.txHash.toLowerCase() // Tx hashes are safe hex strings
  };
}

/**
 * Validates record structure
 */
function validateRecord(record: unknown): record is SubscriptionRecord {
  if (!record || typeof record !== 'object') return false;

  const r = record as Record<string, unknown>;

  return (
    typeof r.id === 'string' &&
    typeof r.userAddress === 'string' &&
    typeof r.userName === 'string' &&
    typeof r.userEmail === 'string' &&
    typeof r.userPhone === 'string' &&
    typeof r.packageName === 'string' &&
    typeof r.amount === 'number' &&
    typeof r.timestamp === 'number' &&
    typeof r.txHash === 'string' &&
    /^0x[a-fA-F0-9]{40}$/.test(r.userAddress as string) &&
    /^0x[a-fA-F0-9]{64}$/.test(r.txHash as string)
  );
}

export function useSecureRecords(): UseSecureRecordsReturn {
  const [records, setRecords] = useState<SubscriptionRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [integrityValid, setIntegrityValid] = useState(true);

  // Load records on mount
  useEffect(() => {
    const loadRecords = async () => {
      try {
        // Try to load from secure storage first
        const result = await secureRetrieve<SubscriptionRecord[]>(RECORDS_KEY);

        if (result.valid && result.data) {
          // Validate each record
          const validRecords = result.data.filter(validateRecord);
          setRecords(validRecords);
          setIntegrityValid(true);
        } else if (result.error) {
          // Integrity check failed - data may have been tampered with
          console.warn('Data integrity check failed:', result.error);
          setIntegrityValid(false);
          setError('Warning: Stored data failed integrity check. Data may have been modified.');

          // Try to recover from legacy storage (non-secure)
          const legacyData = localStorage.getItem('xox_subscriptions');
          if (legacyData) {
            try {
              const parsed = JSON.parse(legacyData);
              if (Array.isArray(parsed)) {
                const validRecords = parsed.filter(validateRecord).map(sanitizeRecord);
                setRecords(validRecords);
                // Migrate to secure storage
                await secureStore(RECORDS_KEY, validRecords);
                localStorage.removeItem('xox_subscriptions');
                setIntegrityValid(true);
                setError(null);
              }
            } catch {
              // Legacy data is corrupted
              setRecords([]);
            }
          }
        } else {
          // No data exists, check legacy
          const legacyData = localStorage.getItem('xox_subscriptions');
          if (legacyData) {
            try {
              const parsed = JSON.parse(legacyData);
              if (Array.isArray(parsed)) {
                const validRecords = parsed.filter(validateRecord).map(sanitizeRecord);
                setRecords(validRecords);
                // Migrate to secure storage
                await secureStore(RECORDS_KEY, validRecords);
                localStorage.removeItem('xox_subscriptions');
              }
            } catch {
              setRecords([]);
            }
          }
        }
      } catch (error) {
        console.error('Error loading records:', error);
        setError('Failed to load subscription records');
        setRecords([]);
      } finally {
        setIsLoading(false);
      }
    };

    loadRecords();
  }, []);

  /**
   * Save a new record with integrity protection
   */
  const saveRecord = useCallback(async (record: SubscriptionRecord): Promise<boolean> => {
    try {
      // Validate record
      if (!validateRecord(record)) {
        setError('Invalid record format');
        return false;
      }

      // Sanitize record
      const sanitized = sanitizeRecord(record);

      // Check for duplicate
      const isDuplicate = records.some(
        r => r.txHash === sanitized.txHash || r.id === sanitized.id
      );

      if (isDuplicate) {
        setError('Duplicate record detected');
        return false;
      }

      // Add to records (newest first)
      const updatedRecords = [sanitized, ...records];
      setRecords(updatedRecords);

      // Save to secure storage
      await secureStore(RECORDS_KEY, updatedRecords);
      setIntegrityValid(true);

      return true;
    } catch (error) {
      console.error('Error saving record:', error);
      setError('Failed to save record');
      return false;
    }
  }, [records]);

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
    clearError
  };
}

export default useSecureRecords;
