// Teachers' notices for the active student, read from the phone's copy (they
// come down with each batch the student is in). "New" = posted after the
// newest one this phone has shown for that batch (useSeenNotices).
import { useCallback, useMemo, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { useAuth } from '../AuthProvider';
import { useLocalStore } from '../local/store';
import type { BatchNotice } from '../local/types';
import { useActiveStudent } from '../store/useActiveStudent';
import { seenKey, useSeenNotices } from '../store/useSeenNotices';
import { sortNotices } from '../utils/notices';
import { useMemberships } from './batches';

export interface NoticeItem extends BatchNotice {
  batchName: string;
  isNew: boolean;
}

/** The active student's notices (or one batch's): pinned first, then newest. */
export function useStudentNotices(onlyBatchId?: string): {
  items: NoticeItem[];
  newCount: number;
  markSeen: () => void;
} {
  const { session } = useAuth();
  const accountId = session?.user.id ?? '';
  const { active } = useActiveStudent();
  const { memberships } = useMemberships();
  const byBatch = useLocalStore((s) => s.notices);
  const seen = useSeenNotices((s) => s.seen);
  const mark = useSeenNotices((s) => s.markSeen);

  const batches = useMemo(() => {
    const out = new Map<string, string>();
    for (const m of memberships) {
      if (m.student_id !== active?.id || m.status !== 'approved' || m.batch_deleted) continue;
      if (onlyBatchId && m.batch_id !== onlyBatchId) continue;
      out.set(m.batch_id, m.batch_name);
    }
    return out;
  }, [memberships, active?.id, onlyBatchId]);

  const items = useMemo(() => {
    const list: NoticeItem[] = [];
    for (const [batchId, batchName] of batches) {
      const last = seen[seenKey(accountId, batchId)] ?? 0;
      for (const n of byBatch[batchId] ?? []) {
        if (n.deleted_at) continue;
        list.push({ ...n, batchName, isNew: n.created_at > last });
      }
    }
    return sortNotices(list);
  }, [batches, byBatch, seen, accountId]);

  const markSeen = useCallback(() => {
    if (!accountId) return;
    const newest = new Map<string, number>();
    for (const n of items) newest.set(n.batch_id, Math.max(newest.get(n.batch_id) ?? 0, n.created_at));
    for (const [batchId, upto] of newest) mark(seenKey(accountId, batchId), upto);
  }, [items, accountId, mark]);

  return { items, newCount: items.filter((n) => n.isNew).length, markSeen };
}

/**
 * While a screen showing notices is open: mark them seen, but keep the "New"
 * tag on the ones that were new when they appeared, for this visit.
 */
export function useSeenWhileOpen(items: NoticeItem[], markSeen: () => void): Set<string> {
  const [fresh, setFresh] = useState<Set<string>>(() => new Set());
  useFocusEffect(
    useCallback(() => {
      const newIds = items.filter((n) => n.isNew).map((n) => n.id);
      if (!newIds.length) return;
      setFresh((f) => new Set([...f, ...newIds]));
      markSeen();
    }, [items, markSeen]),
  );
  return fresh;
}
