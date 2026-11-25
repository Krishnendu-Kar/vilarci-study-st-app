// Keeps the phone's copy up to date (new-db-plan.md §9–§10): one sync call
// per round sends the bookmarks (a change number per batch) and the account
// snapshot's number, and gets back only what changed. Rounds repeat while the
// server has more, then the screens re-read the copy.
//
// The student app writes nothing through sync (joining, profiles and the
// account are online actions), so there's no outbox here; the teacher app
// adds one on top of the same calls.
import { AppState } from 'react-native';
import { supabase } from '../supabase';
import { currentDb } from '../local/db';
import * as repo from '../local/repo';
import { loadLocalStore, useLocalStore } from '../local/store';
import type { AccountSnapshot, SyncResponse } from '../local/types';

const MAX_ROUNDS = 10;
const PAGE_ROWS = 1000;
const RETRY_MS = [2_000, 5_000, 15_000, 60_000, 300_000];

let running: Promise<void> | null = null;
let again = false;
let lastStarted = 0;
let failures = 0;
let retryTimer: ReturnType<typeof setTimeout> | null = null;

/**
 * The batches to keep in sync: those with an approved student of this
 * account. Each maps to its approved enrolment ids (sorted, joined); when
 * that changes (a sibling approved, approved again) the batch downloads again
 * from the start, since rows the account couldn't see before are now visible.
 */
export function wantedBatches(account: AccountSnapshot | null): Map<string, string> {
  const ids = new Map<string, string[]>();
  for (const e of account?.enrolments ?? []) {
    if (e.status !== 'approved' || e.batch_deleted) continue;
    const list = ids.get(e.batch_id) ?? [];
    list.push(e.id);
    ids.set(e.batch_id, list);
  }
  return new Map([...ids].map(([batchId, list]) => [batchId, list.sort().join(',')]));
}

/**
 * Sync now, or join the sync already running. With ifOlderThanMs, skip when
 * the last one started more recently (coming back to the app).
 */
export function requestSync(opts: { ifOlderThanMs?: number } = {}): Promise<void> {
  if (running) {
    again = true;
    return running;
  }
  if (opts.ifOlderThanMs && Date.now() - lastStarted < opts.ifOlderThanMs) return Promise.resolve();
  clearRetry();
  running = (async () => {
    useLocalStore.setState({ syncing: true });
    try {
      do {
        again = false;
        lastStarted = Date.now();
        await syncOnce();
      } while (again);
      failures = 0;
      // With no copy open nothing synced: keep the reason it couldn't open on show.
      if (currentDb()) useLocalStore.setState({ syncError: null });
    } catch (err) {
      failures += 1;
      useLocalStore.setState({ syncError: describeSyncError(err) });
      scheduleRetry();
    } finally {
      // Show what was saved, even when a later round failed.
      const open = currentDb();
      if (open) await loadLocalStore(open.db).catch(() => {});
      useLocalStore.setState({ syncing: false });
      running = null;
    }
  })();
  return running;
}

/** Signed out: no more retries. */
export function stopSync(): void {
  clearRetry();
  failures = 0;
}

function scheduleRetry(): void {
  if (AppState.currentState !== 'active') return;
  const wait = RETRY_MS[Math.min(failures, RETRY_MS.length) - 1];
  retryTimer = setTimeout(() => {
    retryTimer = null;
    requestSync();
  }, wait);
}

function clearRetry(): void {
  if (retryTimer) clearTimeout(retryTimer);
  retryTimer = null;
}

function describeSyncError(err: unknown): string {
  const msg = String((err as Error)?.message ?? err ?? '');
  if (/network|fetch|timed? ?out/i.test(msg)) return 'No connection. Showing what’s saved on this phone.';
  return msg || 'Couldn’t refresh. Showing what’s saved on this phone.';
}

async function syncOnce(): Promise<void> {
  const open = currentDb();
  if (!open) return;
  const { userId, db } = open;

  for (let round = 0; round < MAX_ROUNDS; round++) {
    const account = await repo.readAccount(db);
    const cursors = await repo.readCursors(db);
    const want = wantedBatches(account);
    const bookmarks: Record<string, number> = {};
    for (const [batchId, key] of want) {
      const c = cursors.get(batchId);
      bookmarks[batchId] = c && c.enrolments === key ? c.seq : 0;
    }

    const sentAt = Date.now();
    const { data, error } = await supabase.rpc('sync', {
      p_changes: [],
      p_cursors: bookmarks,
      p_account_rev: account?.rev ?? null,
      p_max: PAGE_ROWS,
    });
    if (error) throw error;
    // Signed out or switched account while waiting: this answer isn't theirs.
    if (currentDb()?.userId !== userId) return;
    const res = data as SyncResponse;
    // The server's clock against the middle of the round trip.
    const offset = res.server_now - Math.round((sentAt + Date.now()) / 2);
    let more = false;

    await db.withTransactionAsync(async () => {
      const snapshot = res.account ?? account;
      const mine = new Set((snapshot?.enrolments ?? []).map((e) => e.id));
      for (const [batchId, answer] of Object.entries(res.batches)) {
        if ('gone' in answer) {
          // Not in this batch any more: keep what's here, stop asking.
          await repo.dropCursor(db, batchId);
          continue;
        }
        if ('later' in answer) {
          more = true;
          continue;
        }
        if (answer.full) await repo.clearBatch(db, batchId);
        await repo.applyPage(db, batchId, answer, mine);
        await repo.setCursor(db, batchId, answer.upto, want.get(batchId) ?? '');
        if (answer.more) more = true;
      }
      if (res.account) {
        await repo.writeKv(db, 'account', JSON.stringify(res.account));
        // Batches none of the students is or was in (a removed profile) go.
        await repo.purgeBatchesExcept(db, new Set(res.account.enrolments.map((e) => e.batch_id)));
        // Newly approved batches (or ones to restart) are fetched next round.
        for (const [batchId, key] of wantedBatches(res.account)) {
          if (want.get(batchId) !== key) more = true;
        }
      }
      await repo.writeKv(db, 'clock_offset', String(offset));
      await repo.writeKv(db, 'synced_at', String(Date.now()));
    });
    if (!more) break;
  }
}
