// Reads and writes on the phone's copy (db.ts). The sync engine is the only
// writer; screens read through the in-memory store (store.ts).
import type { SQLiteDatabase } from 'expo-sqlite';
import type { AccountSnapshot, Batch, BatchMonth, BatchNotice, BatchPage, BatchTest, EnrolmentMonth } from './types';

export interface Cursor {
  batch_id: string;
  seq: number;
  /** The approved enrolments this bookmark was taken for (sorted, comma-joined). */
  enrolments: string;
}

export async function readKv(db: SQLiteDatabase, k: string): Promise<string | null> {
  const row = await db.getFirstAsync<{ v: string }>('SELECT v FROM kv WHERE k = ?', [k]);
  return row?.v ?? null;
}

export async function writeKv(db: SQLiteDatabase, k: string, v: string): Promise<void> {
  await db.runAsync('INSERT OR REPLACE INTO kv (k, v) VALUES (?, ?)', [k, v]);
}

export async function readAccount(db: SQLiteDatabase): Promise<AccountSnapshot | null> {
  const v = await readKv(db, 'account');
  return v ? (JSON.parse(v) as AccountSnapshot) : null;
}

export async function readCursors(db: SQLiteDatabase): Promise<Map<string, Cursor>> {
  const rows = await db.getAllAsync<Cursor>('SELECT batch_id, seq, enrolments FROM cursors');
  return new Map(rows.map((r) => [r.batch_id, r]));
}

export async function setCursor(db: SQLiteDatabase, batchId: string, seq: number, enrolments: string): Promise<void> {
  await db.runAsync('INSERT OR REPLACE INTO cursors (batch_id, seq, enrolments, synced_at) VALUES (?, ?, ?, ?)', [
    batchId,
    seq,
    enrolments,
    Date.now(),
  ]);
}

export async function dropCursor(db: SQLiteDatabase, batchId: string): Promise<void> {
  await db.runAsync('DELETE FROM cursors WHERE batch_id = ?', [batchId]);
}

const BATCH_TABLES = [
  ['batches', 'id'],
  ['batch_months', 'batch_id'],
  ['batch_tests', 'batch_id'],
  ['batch_notices', 'batch_id'],
  ['enrolment_months', 'batch_id'],
] as const;

/** Forget everything about one batch (before a full download). */
export async function clearBatch(db: SQLiteDatabase, batchId: string): Promise<void> {
  for (const [table, col] of BATCH_TABLES) {
    await db.runAsync(`DELETE FROM ${table} WHERE ${col} = ?`, [batchId]);
  }
}

/** Forget batches none of the account's students is (or was) in. */
export async function purgeBatchesExcept(db: SQLiteDatabase, keep: Set<string>): Promise<void> {
  const ids = [...keep];
  const notIn = ids.length ? `NOT IN (${ids.map(() => '?').join(', ')})` : 'IS NOT NULL';
  for (const [table, col] of BATCH_TABLES) {
    await db.runAsync(`DELETE FROM ${table} WHERE ${col} ${notIn}`, ids);
  }
  await db.runAsync(`DELETE FROM cursors WHERE batch_id ${notIn}`, ids);
}

async function withStatement(
  db: SQLiteDatabase,
  sql: string,
  rows: unknown[][],
): Promise<void> {
  if (!rows.length) return;
  const stmt = await db.prepareAsync(sql);
  try {
    for (const params of rows) await stmt.executeAsync(params as never);
  } finally {
    await stmt.finalizeAsync();
  }
}

/**
 * One batch's downloaded rows. Only months of the account's own enrolments
 * are kept (a teacher signed in here gets the whole batch from the server).
 * Deleted tests and notices are removed.
 */
export async function applyPage(db: SQLiteDatabase, batchId: string, page: BatchPage, mine: Set<string>): Promise<void> {
  if (page.batch) {
    await db.runAsync('INSERT OR REPLACE INTO batches (id, seq, data) VALUES (?, ?, ?)', [
      batchId,
      page.batch.seq,
      JSON.stringify(page.batch),
    ]);
  }
  await withStatement(
    db,
    'INSERT OR REPLACE INTO batch_months (batch_id, month, seq, data) VALUES (?, ?, ?, ?)',
    page.batch_months.map((r) => [batchId, r.month, r.seq, JSON.stringify(r)]),
  );
  for (const [table, list] of [
    ['batch_tests', page.batch_tests],
    ['batch_notices', page.batch_notices],
  ] as const) {
    await withStatement(
      db,
      `DELETE FROM ${table} WHERE batch_id = ? AND id = ?`,
      list.filter((r) => r.deleted_at != null).map((r) => [batchId, r.id]),
    );
    await withStatement(
      db,
      `INSERT OR REPLACE INTO ${table} (batch_id, id, seq, data) VALUES (?, ?, ?, ?)`,
      list.filter((r) => r.deleted_at == null).map((r) => [batchId, r.id, r.seq, JSON.stringify(r)]),
    );
  }
  await withStatement(
    db,
    'INSERT OR REPLACE INTO enrolment_months (enrolment_id, month, batch_id, seq, data) VALUES (?, ?, ?, ?, ?)',
    page.enrolment_months
      .filter((r) => mine.has(r.enrolment_id))
      .map((r) => [r.enrolment_id, r.month, batchId, r.seq, JSON.stringify(r)]),
  );
}

export interface LocalRows {
  account: AccountSnapshot | null;
  syncedAt: number | null;
  batches: Batch[];
  batchMonths: BatchMonth[];
  tests: BatchTest[];
  notices: BatchNotice[];
  months: EnrolmentMonth[];
}

async function readData<T>(db: SQLiteDatabase, table: string): Promise<T[]> {
  const rows = await db.getAllAsync<{ data: string }>(`SELECT data FROM ${table}`);
  return rows.map((r) => JSON.parse(r.data) as T);
}

export async function readAll(db: SQLiteDatabase): Promise<LocalRows> {
  const syncedAt = await readKv(db, 'synced_at');
  return {
    account: await readAccount(db),
    syncedAt: syncedAt ? Number(syncedAt) : null,
    batches: await readData<Batch>(db, 'batches'),
    batchMonths: await readData<BatchMonth>(db, 'batch_months'),
    tests: await readData<BatchTest>(db, 'batch_tests'),
    notices: await readData<BatchNotice>(db, 'batch_notices'),
    months: await readData<EnrolmentMonth>(db, 'enrolment_months'),
  };
}
