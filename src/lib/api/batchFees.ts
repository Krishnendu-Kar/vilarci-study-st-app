// A student's fee ledger in one batch, worked out on the phone from the
// course months, the student's monthly fee and the months the teacher marked
// paid or waived (enrolment_months.fee). A month without a mark is due once
// it has started, else upcoming. Money in paise.
import { useLocalStore } from '../local/store';
import type { EnrolmentMonth, MonthFee } from '../local/types';
import { currentMonth, monthsBetween } from '../utils/months';

export type LedgerState = 'paid' | 'waived' | 'due' | 'upcoming';

export const MODE_LABEL: Record<string, string> = { cash: 'Cash', upi: 'UPI', bank: 'Bank', other: 'Other' };

export interface LedgerMonth {
  month: string;
  state: LedgerState;
  fee: MonthFee | null;
}

export function buildLedger(
  start: string,
  end: string,
  months: Record<string, EnrolmentMonth> | undefined,
  monthlyFee: number,
) {
  const now = currentMonth();
  const list: LedgerMonth[] = monthsBetween(start, end).map((m) => {
    const fee = months?.[m]?.fee ?? null;
    return { month: m, state: fee ? fee.status : m <= now ? 'due' : 'upcoming', fee };
  });
  const dueMonths = list.filter((m) => m.state === 'due').length;
  return {
    months: list,
    totalCourse: list.length * monthlyFee,
    paid: list.reduce((s, m) => s + (m.fee?.status === 'paid' ? m.fee.amount : 0), 0),
    dueMonths,
    dueAmount: dueMonths * monthlyFee,
  };
}

/** Every synced month row of the account's students: enrolment id → month → row. */
export function useEnrolmentMonths(): Record<string, Record<string, EnrolmentMonth>> {
  return useLocalStore((s) => s.months);
}
