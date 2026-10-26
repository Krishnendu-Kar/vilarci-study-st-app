// Read-only fee ledger for the account's student profiles (public.batch_fees).
// Teachers record payments; a month without a row is due or upcoming.
import { useQuery } from '@tanstack/react-query';
import { supabase } from '../supabase';
import { currentMonth, monthsBetween } from '../utils/months';

export type FeeStatus = 'paid' | 'waived';
export type LedgerState = 'paid' | 'waived' | 'due' | 'upcoming';

export interface FeeRow {
  id: string;
  membership_id: string;
  month: string;
  status: FeeStatus;
  amount: number;
  paid_on: string | null;
  mode: 'cash' | 'upi' | 'bank' | 'other' | null;
  note: string;
}

export const MODE_LABEL: Record<string, string> = { cash: 'Cash', upi: 'UPI', bank: 'Bank', other: 'Other' };

export interface LedgerMonth {
  month: string;
  state: LedgerState;
  row: FeeRow | null;
}

export function buildLedger(start: string, end: string, rows: FeeRow[], monthlyFee: number) {
  const now = currentMonth();
  const byMonth = new Map(rows.map((r) => [r.month, r]));
  const months: LedgerMonth[] = monthsBetween(start, end).map((m) => {
    const row = byMonth.get(m) ?? null;
    return { month: m, state: row ? row.status : m <= now ? 'due' : 'upcoming', row };
  });
  const dueMonths = months.filter((m) => m.state === 'due').length;
  return {
    months,
    totalCourse: months.length * monthlyFee,
    paid: months.reduce((s, m) => s + (m.state === 'paid' ? m.row!.amount : 0), 0),
    dueMonths,
    dueAmount: dueMonths * monthlyFee,
  };
}

/** Ledger rows for several memberships at once (one student's batches). */
export function useFeesForMemberships(membershipIds: string[]) {
  const ids = [...membershipIds].sort();
  return useQuery({
    queryKey: ['member-fees', ids.join(',')],
    enabled: ids.length > 0,
    queryFn: async (): Promise<FeeRow[]> => {
      const { data, error } = await supabase.from('batch_fees').select('*').in('membership_id', ids).order('month');
      if (error) throw error;
      return (data ?? []) as FeeRow[];
    },
  });
}
