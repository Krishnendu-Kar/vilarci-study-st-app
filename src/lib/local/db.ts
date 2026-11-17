// The phone's copy of the account's data (new-db-plan.md §10): one SQLite file
// per account, so two accounts on one phone never mix, and logging out can
// delete it. Rows are stored as the server sent them (data = JSON) with the
// few columns needed to find, replace and delete them.
import * as SQLite from 'expo-sqlite';

const VERSION = 1;

let current: { userId: string; db: SQLite.SQLiteDatabase } | null = null;
let opening: { userId: string; promise: Promise<SQLite.SQLiteDatabase> } | null = null;

const fileName = (userId: string) => `vilarci-${userId}.db`;

/** The open database and whose it is, or null when nobody is signed in. */
export function currentDb(): { userId: string; db: SQLite.SQLiteDatabase } | null {
  return current;
}

export async function openLocalDb(userId: string): Promise<SQLite.SQLiteDatabase> {
  if (current?.userId === userId) return current.db;
  if (opening?.userId === userId) return opening.promise;
  const promise = (async () => {
    await closeLocalDb();
    const db = await SQLite.openDatabaseAsync(fileName(userId));
    await migrate(db);
    current = { userId, db };
    return db;
  })();
  opening = { userId, promise };
  try {
    return await promise;
  } finally {
    if (opening?.promise === promise) opening = null;
  }
}

export async function closeLocalDb(): Promise<void> {
  const was = current;
  current = null;
  if (was) await was.db.closeAsync().catch(() => {});
}

/** Logging out: the account's data leaves the phone. */
export async function deleteLocalDb(userId: string): Promise<void> {
  if (current?.userId === userId) await closeLocalDb();
  await SQLite.deleteDatabaseAsync(fileName(userId)).catch(() => {});
}

async function migrate(db: SQLite.SQLiteDatabase): Promise<void> {
  await db.execAsync('PRAGMA journal_mode = WAL;');
  const row = await db.getFirstAsync<{ user_version: number }>('PRAGMA user_version');
  const from = row?.user_version ?? 0;
  if (from >= VERSION) return;

  // Never edit a shipped step; add the next one below it.
  if (from < 1) {
    await db.execAsync(`
      CREATE TABLE kv (k TEXT PRIMARY KEY NOT NULL, v TEXT NOT NULL) STRICT;
      CREATE TABLE cursors (
        batch_id TEXT PRIMARY KEY NOT NULL,
        seq INTEGER NOT NULL,
        enrolments TEXT NOT NULL,
        synced_at INTEGER NOT NULL
      ) STRICT;
      CREATE TABLE batches (id TEXT PRIMARY KEY NOT NULL, seq INTEGER NOT NULL, data TEXT NOT NULL) STRICT;
      CREATE TABLE batch_months (
        batch_id TEXT NOT NULL, month TEXT NOT NULL, seq INTEGER NOT NULL, data TEXT NOT NULL,
        PRIMARY KEY (batch_id, month)
      ) STRICT;
      CREATE TABLE batch_tests (
        batch_id TEXT NOT NULL, id TEXT NOT NULL, seq INTEGER NOT NULL, data TEXT NOT NULL,
        PRIMARY KEY (batch_id, id)
      ) STRICT;
      CREATE TABLE batch_notices (
        batch_id TEXT NOT NULL, id TEXT NOT NULL, seq INTEGER NOT NULL, data TEXT NOT NULL,
        PRIMARY KEY (batch_id, id)
      ) STRICT;
      CREATE TABLE enrolment_months (
        enrolment_id TEXT NOT NULL, month TEXT NOT NULL, batch_id TEXT NOT NULL,
        seq INTEGER NOT NULL, data TEXT NOT NULL,
        PRIMARY KEY (enrolment_id, month)
      ) STRICT;
      CREATE INDEX enrolment_months_batch ON enrolment_months (batch_id);
    `);
  }

  await db.execAsync(`PRAGMA user_version = ${VERSION};`);
}
