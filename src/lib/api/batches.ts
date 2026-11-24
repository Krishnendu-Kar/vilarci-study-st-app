// Batches the account's students are in (or asked to join), from the phone's
// copy: the account snapshot says which, with what status; approved batches'
// details come from their synced rows. Previewing and joining by code are
// online actions (React Query), followed by a sync.
import { useMemo } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../supabase';
import { useLocalStore } from '../local/store';
import type { EnrolmentStatus, TeacherCard, WeekSchedule } from '../local/types';
import { requestSync } from '../sync/engine';

export type { WeekSchedule };
export type MembershipStatus = EnrolmentStatus;

/** What the join screen shows for a code (join_preview). Money in paise. */
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
  course_start: string | null;
  course_end: string | null;
  require_approval: boolean;
  teacher: TeacherCard;
  /** The caller's students already in (or asking to join) this batch. */
  mine: { student_id: string; enrolment_id: string; status: MembershipStatus }[];
}

/** One student in one batch, as the screens use it. Money in paise. */
export interface Membership {
  /** The enrolment id. */
  id: string;
  student_id: string;
  student_name: string;
  status: MembershipStatus;
  requested_at: number;
  batch_id: string;
  batch_deleted: boolean;
  batch_name: string;
  subject: string;
  grade: string | null;
  board: string | null;
  room: string;
  /** Known once the batch's rows are on the phone (approved, or approved before). */
  weekly_schedule: WeekSchedule | null;
  /** This student's monthly fee (their own fee, else the batch's); null when unknown. */
  monthly_fee: number | null;
  teacher_name: string;
  course_start: string | null;
  course_end: string | null;
  joined_month: string | null;
  /** When the teacher last decided (approved) — attendance counts from that day. */
  decided_at: number | null;
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

/** Every enrolment of the account's students, newest request first. */
export function useMemberships(): { memberships: Membership[]; isLoading: boolean } {
  const account = useLocalStore((s) => s.account);
  const batches = useLocalStore((s) => s.batches);
  const isLoading = useLocalStore((s) => !s.account && !s.syncError);

  const memberships = useMemo(() => {
    if (!account) return [];
    const students = new Map(account.students.map((p) => [p.id, p]));
    const out: Membership[] = [];
    for (const e of account.enrolments) {
      const student = students.get(e.student_id);
      const batch = batches[e.batch_id];
      const card = e.batch;
      // An approved batch whose rows haven't arrived yet shows on the next sync round.
      if (!student || (!batch && !card)) continue;
      out.push({
        id: e.id,
        student_id: e.student_id,
        student_name: `${student.first_name} ${student.last_name}`.trim(),
        status: e.status,
        requested_at: e.requested_at,
        batch_id: e.batch_id,
        batch_deleted: e.batch_deleted,
        batch_name: batch?.name ?? card!.name,
        subject: batch?.subject ?? card!.subject,
        grade: batch?.grade ?? card?.grade ?? null,
        board: batch?.board ?? card?.board ?? null,
        room: batch?.room ?? '',
        weekly_schedule: batch?.weekly_schedule ?? null,
        monthly_fee: e.fee_override ?? batch?.monthly_fee ?? null,
        teacher_name: batch?.teacher_card.name ?? card?.teacher_name ?? '',
        course_start: batch?.course_start ?? null,
        course_end: batch?.course_end ?? null,
        joined_month: e.joined_month,
        decided_at: e.decided_at,
      });
    }
    return out.sort((a, b) => b.requested_at - a.requested_at);
  }, [account, batches]);

  return { memberships, isLoading };
}

export function useBatchPreview(code: string | null) {
  return useQuery({
    queryKey: ['join-preview', code],
    enabled: Boolean(code && isJoinCode(code)),
    queryFn: async (): Promise<BatchPreview | null> => {
      const { data, error } = await supabase.rpc('join_preview', { p_code: code });
      if (error) throw error;
      return (data ?? null) as BatchPreview | null;
    },
  });
}

export function useRequestJoin() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ code, studentId }: { code: string; studentId: string }) => {
      const { error } = await supabase.rpc('join_request', { p_code: code, p_student_id: studentId });
      if (error) throw error;
      await requestSync();
    },
    onSuccess: (_, { code }) => queryClient.invalidateQueries({ queryKey: ['join-preview', code] }),
  });
}

export function useLeaveBatch() {
  return useMutation({
    mutationFn: async (enrolmentId: string) => {
      const { error } = await supabase.rpc('enrolment_leave', { p_enrolment_id: enrolmentId });
      if (error) throw error;
      await requestSync();
    },
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
  left: 'Left',
  removed: 'Removed',
};
