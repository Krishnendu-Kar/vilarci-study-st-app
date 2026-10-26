// Joining teachers' private batches. Everything goes through RPCs that check
// the caller: preview a batch by code, request to join with one of the
// account's student profiles, and list this account's memberships.
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../supabase';
import { useAuth } from '../AuthProvider';

export type WeekSchedule = Record<'mon' | 'tue' | 'wed' | 'thu' | 'fri' | 'sat' | 'sun', string>;
export type MembershipStatus = 'pending' | 'approved' | 'declined';

export interface BatchPreview {
  batch_id: string;
  name: string;
  subject: string;
  grade: string | null;
  board: string | null;
  room: string;
  weekly_schedule: WeekSchedule;
  monthly_fee: number;
  capacity: number;
  seats_taken: number;
  teacher_name: string;
  teacher_subject: string;
  teacher_qualification: string;
}

export interface Membership {
  id: string;
  student_id: string;
  student_name: string;
  status: MembershipStatus;
  requested_at: string;
  batch_id: string;
  batch_name: string;
  subject: string;
  grade: string | null;
  board: string | null;
  room: string;
  weekly_schedule: WeekSchedule;
  monthly_fee: number;
  teacher_name: string;
  /** First day of the course's first / last month; null until the teacher sets it. */
  course_start: string | null;
  course_end: string | null;
}

const CODE_RE = /^VLR-[A-Z0-9]{6}$/;

/** "vlr-cz78hg " → "VLR-CZ78HG"; accepts the 6 characters without the prefix too. */
export function normalizeJoinCode(input: string): string {
  const v = input.trim().toUpperCase().replace(/\s+/g, '');
  return /^[A-Z0-9]{6}$/.test(v) ? `VLR-${v}` : v;
}

export function isJoinCode(code: string): boolean {
  return CODE_RE.test(code);
}

/** Pulls a join code out of any join link: https://vilarci.in/join/…, vilarcistudy://join/…, exp://…/--/join/… */
export function joinCodeFromUrl(url: string | null | undefined): string | null {
  if (!url) return null;
  const m = /\/join\/([A-Za-z0-9-]+)/.exec(url) ?? /[?&]code=([A-Za-z0-9-]+)/.exec(url);
  if (!m) return null;
  const code = normalizeJoinCode(decodeURIComponent(m[1]));
  return isJoinCode(code) ? code : null;
}

export function useBatchPreview(code: string | null) {
  return useQuery({
    queryKey: ['batch-preview', code],
    enabled: Boolean(code && isJoinCode(code)),
    queryFn: async (): Promise<BatchPreview | null> => {
      const { data, error } = await supabase.rpc('batch_preview', { p_code: code });
      if (error) throw error;
      return ((data ?? []) as BatchPreview[])[0] ?? null;
    },
  });
}

export function useMyMemberships() {
  const { session } = useAuth();
  return useQuery({
    queryKey: ['my-memberships', session?.user.id],
    enabled: Boolean(session),
    queryFn: async (): Promise<Membership[]> => {
      const { data, error } = await supabase.rpc('my_batch_memberships');
      if (error) throw error;
      return (data ?? []) as Membership[];
    },
  });
}

export function useRequestJoin() {
  const { session } = useAuth();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ code, studentId }: { code: string; studentId: string }) => {
      const { error } = await supabase.rpc('request_join_batch', { p_code: code, p_student_id: studentId });
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['my-memberships', session?.user.id] }),
  });
}

export function useLeaveBatch() {
  const { session } = useAuth();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (membershipId: string) => {
      const { error } = await supabase.from('batch_students').delete().eq('id', membershipId);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['my-memberships', session?.user.id] }),
  });
}

export function describeJoinError(err: unknown): string {
  const msg = String((err as Error)?.message ?? '');
  if (/already a member/i.test(msg)) return 'This student is already in the batch.';
  if (/already waiting/i.test(msg)) return 'A request for this student is already waiting for the teacher.';
  if (/batch is full/i.test(msg)) return 'This batch is full. Ask the teacher to add more seats.';
  if (/no batch found/i.test(msg)) return 'No batch found for this code. Check it with your teacher.';
  if (/not on your account/i.test(msg)) return 'Choose one of your own student profiles.';
  if (/network|fetch/i.test(msg)) return 'No connection. Check your internet and try again.';
  return msg || 'Something went wrong. Please try again.';
}

export const STATUS_LABEL: Record<MembershipStatus, string> = {
  pending: 'Waiting for teacher',
  approved: 'Joined',
  declined: 'Declined',
};
