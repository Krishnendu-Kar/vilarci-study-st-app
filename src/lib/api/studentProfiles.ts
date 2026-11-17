// Student profiles. They come from the phone's copy of the account (the sync
// snapshot), so screens never wait for the network. Adding, editing and
// removing are online actions the server checks (3 per account, one "self"),
// followed by a sync that brings the change back.
import { useMutation } from '@tanstack/react-query';
import * as Crypto from 'expo-crypto';
import { supabase } from '../supabase';
import { useLocalStore } from '../local/store';
import type { Gender, Relation, StudentProfile } from '../local/types';
import { requestSync } from '../sync/engine';

export type { Gender, Relation, StudentProfile };

export const MAX_STUDENT_PROFILES = 3;

/** Dropdown options, in display order. */
export const RELATIONS: { value: Relation; label: string }[] = [
  { value: 'self', label: 'Self' },
  { value: 'father', label: 'Father' },
  { value: 'mother', label: 'Mother' },
  { value: 'friend', label: 'Friend' },
  { value: 'teacher', label: 'Teacher' },
  { value: 'other', label: 'Others' },
];

export const OTHER_RELATION_MIN = 3;
export const OTHER_RELATION_MAX = 20;

/** "Self", "Father", … or the typed relation for 'other'. */
export function relationLabel(p: Pick<StudentProfile, 'relation' | 'relation_other'>): string {
  if (p.relation === 'other') return p.relation_other?.trim() || 'Other';
  return RELATIONS.find((r) => r.value === p.relation)?.label ?? p.relation;
}

export type StudentProfileInput = Pick<
  StudentProfile,
  'relation' | 'relation_other' | 'first_name' | 'middle_name' | 'last_name' | 'gender' | 'dob' | 'class_name' | 'board'
>;

/** The server explains refusals in plain sentences; only network trouble needs words. */
export function describeProfileError(err: unknown): string {
  const msg = String((err as Error)?.message ?? '');
  if (/network|fetch/i.test(msg)) return 'No connection. Check your internet and try again.';
  return msg || 'Something went wrong. Please try again.';
}

const NONE: StudentProfile[] = [];

/** The account's student profiles, oldest first. Loading only until the first snapshot (or a failed sync). */
export function useStudentProfiles(): { profiles: StudentProfile[]; isLoading: boolean } {
  const profiles = useLocalStore((s) => s.account?.students ?? NONE);
  const isLoading = useLocalStore((s) => !s.account && !s.syncError);
  return { profiles, isLoading };
}

export function useSaveStudentProfile() {
  return useMutation({
    mutationFn: async ({ id, input }: { id?: string; input: StudentProfileInput }) => {
      const { error } = await supabase.rpc('student_save', { p_id: id ?? Crypto.randomUUID(), p_data: input });
      if (error) throw error;
      await requestSync();
    },
  });
}

export function useDeleteStudentProfile() {
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.rpc('student_delete', { p_id: id });
      if (error) throw error;
      await requestSync();
    },
  });
}

export function fullName(p: Pick<StudentProfile, 'first_name' | 'middle_name' | 'last_name'>): string {
  return [p.first_name, p.middle_name, p.last_name].filter((s) => s && s.trim()).join(' ');
}

export function initialsOf(p: Pick<StudentProfile, 'first_name' | 'last_name'>): string {
  return `${p.first_name.trim()[0] ?? ''}${p.last_name.trim()[0] ?? ''}`.toUpperCase() || '?';
}

/** Whole years from an ISO date. */
export function ageFrom(dob: string | null): number | null {
  if (!dob) return null;
  const d = new Date(dob);
  const now = new Date();
  let age = now.getFullYear() - d.getFullYear();
  const m = now.getMonth() - d.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < d.getDate())) age--;
  return age;
}
