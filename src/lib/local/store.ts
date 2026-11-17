// What the screens read: the phone's copy (SQLite) held in memory, indexed
// for the screens. Filled from SQLite when an account opens and after every
// sync; screens never wait for the network.
import { create } from 'zustand';
import type { SQLiteDatabase } from 'expo-sqlite';
import { readAll } from './repo';
import type { AccountSnapshot, Batch, BatchMonth, BatchNotice, BatchTest, EnrolmentMonth } from './types';

export interface LocalState {
  /** The phone's copy has been read (it may still be empty on a new phone). */
  ready: boolean;
  account: AccountSnapshot | null;
  batches: Record<string, Batch>;
  /** batch id → month → row */
  batchMonths: Record<string, Record<string, BatchMonth>>;
  tests: Record<string, BatchTest[]>;
  notices: Record<string, BatchNotice[]>;
  /** enrolment id → month → row */
  months: Record<string, Record<string, EnrolmentMonth>>;
  syncing: boolean;
  lastSyncedAt: number | null;
  /** Why the last sync failed, or null. */
  syncError: string | null;
}

const EMPTY: LocalState = {
  ready: false,
  account: null,
  batches: {},
  batchMonths: {},
  tests: {},
  notices: {},
  months: {},
  syncing: false,
  lastSyncedAt: null,
  syncError: null,
};

export const useLocalStore = create<LocalState>(() => EMPTY);

/** Signed out: nothing in memory. */
export function resetLocalStore(): void {
  useLocalStore.setState(EMPTY, true);
}

function group<T, K extends string>(rows: T[], key: (r: T) => K): Record<K, T[]> {
  const out = {} as Record<K, T[]>;
  for (const r of rows) (out[key(r)] ??= []).push(r);
  return out;
}

function index<T>(rows: T[], outer: (r: T) => string, inner: (r: T) => string): Record<string, Record<string, T>> {
  const out: Record<string, Record<string, T>> = {};
  for (const r of rows) (out[outer(r)] ??= {})[inner(r)] = r;
  return out;
}

/** Re-read the phone's copy into memory. */
export async function loadLocalStore(db: SQLiteDatabase): Promise<void> {
  const rows = await readAll(db);
  useLocalStore.setState({
    ready: true,
    account: rows.account,
    lastSyncedAt: rows.syncedAt,
    batches: Object.fromEntries(rows.batches.map((b) => [b.id, b])),
    batchMonths: index(rows.batchMonths, (r) => r.batch_id, (r) => r.month),
    tests: group(rows.tests, (r) => r.batch_id),
    notices: group(
      rows.notices.sort((a, b) => Number(b.pinned) - Number(a.pinned) || b.created_at - a.created_at),
      (r) => r.batch_id,
    ),
    months: index(rows.months, (r) => r.enrolment_id, (r) => r.month),
  });
}
