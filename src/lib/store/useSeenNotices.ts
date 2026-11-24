import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

/**
 * Which notices this phone has shown, per account and batch: the newest
 * notice time seen. Anything posted after it is "new". Kept on the phone only
 * (no server cost); a new phone simply shows everything as new once.
 */
export const useSeenNotices = create<{
  /** "<account id>:<batch id>" → created_at of the newest notice seen */
  seen: Record<string, number>;
  markSeen: (key: string, upto: number) => void;
}>()(
  persist(
    (set) => ({
      seen: {},
      markSeen: (key, upto) => set((s) => (upto > (s.seen[key] ?? 0) ? { seen: { ...s.seen, [key]: upto } } : s)),
    }),
    { name: 'vilarci_seen_notices_v1', storage: createJSONStorage(() => AsyncStorage) },
  ),
);

export const seenKey = (accountId: string, batchId: string) => `${accountId}:${batchId}`;
