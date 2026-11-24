// A student's attendance, read from the phone's copy (parents only read; the
// teacher marks it). Class days come with the batch (batch_months), the
// student's absent/late marks with their own month rows (enrolment_months) —
// the server only sends a parent their own students' rows.
import { useMemo } from 'react';
import { useLocalStore } from '../local/store';
import type { BatchMonth, EnrolmentMonth } from '../local/types';
import { attendanceStart, EMPTY_TALLY, localToday, monthOf, Tally, tally } from '../utils/attendance';
import type { Membership } from './batches';

const NO_BATCH_MONTHS: Record<string, BatchMonth> = {};
const NO_MONTHS: Record<string, EnrolmentMonth> = {};

export interface StudentAttendance {
  /** From the day the student joined until today. */
  overall: Tally;
  /** This calendar month so far. */
  thisMonth: Tally;
  /** First day that counts ('YYYY-MM-DD'), null before approval. */
  start: string | null;
  batchMonths: Record<string, BatchMonth>;
  months: Record<string, EnrolmentMonth>;
}

/** The teacher's most recent monthly remark for this student, or null. */
export function latestRemark(months: Record<string, EnrolmentMonth>): { month: string; text: string } | null {
  const month = Object.keys(months)
    .filter((k) => months[k]?.remark?.trim())
    .sort()
    .pop();
  return month ? { month, text: months[month].remark!.trim() } : null;
}

/** One membership's attendance (empty for requests that were never approved). */
export function useStudentAttendance(m: Membership | undefined): StudentAttendance {
  const batchMonths = useLocalStore((s) => (m ? s.batchMonths[m.batch_id] ?? NO_BATCH_MONTHS : NO_BATCH_MONTHS));
  const months = useLocalStore((s) => (m ? s.months[m.id] ?? NO_MONTHS : NO_MONTHS));
  return useMemo(() => {
    const start = m ? attendanceStart(m.joined_month, m.decided_at) : null;
    if (!m || !start) return { overall: EMPTY_TALLY, thisMonth: EMPTY_TALLY, start, batchMonths, months };
    const today = localToday();
    return {
      overall: tally(batchMonths, months, start, today),
      thisMonth: tally(batchMonths, months, start, today, monthOf(today)),
      start,
      batchMonths,
      months,
    };
  }, [m, batchMonths, months]);
}
