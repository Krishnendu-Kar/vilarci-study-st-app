// Real student profiles (public.children). Any account — a student included —
// can hold up to three. `created_by` is the account owner's relation to the
// student (self, father, mother, friend, teacher, other + free text); at most
// one 'self' per account. RLS limits every query to the signed-in account.
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../supabase';
import { useAuth } from '../AuthProvider';

export const MAX_STUDENT_PROFILES = 3;

export type Relation = 'self' | 'father' | 'mother' | 'friend' | 'teacher' | 'other';

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
export function relationLabel(p: Pick<StudentProfile, 'created_by' | 'created_by_other'>): string {
  if (p.created_by === 'other') return p.created_by_other?.trim() || 'Other';
  return RELATIONS.find((r) => r.value === p.created_by)?.label ?? p.created_by;
}

export type Gender = 'male' | 'female' | 'other';

export interface StudentProfile {
  id: string;
  account_id: string;
  created_by: Relation;
  created_by_other: string | null;
  first_name: string;
  middle_name: string;
  last_name: string;
  gender: Gender | null;
  dob: string | null;
  class_name: string | null;
  board: string | null;
  created_at: string;
  updated_at: string;
}

export type StudentProfileInput = Pick<
  StudentProfile,
  'created_by' | 'created_by_other' | 'first_name' | 'middle_name' | 'last_name' | 'gender' | 'dob' | 'class_name' | 'board'
>;

const key = (accountId: string | undefined) => ['student-profiles', accountId] as const;

/** Turns database errors into sentences people can act on. */
export function describeProfileError(err: unknown): string {
  const msg = String((err as Error)?.message ?? '');
  if (/at most 3 children/i.test(msg)) return `You can add up to ${MAX_STUDENT_PROFILES} student profiles.`;
  if (/children_one_self_profile_idx|duplicate key/i.test(msg)) return 'You already have a “Self” profile.';
  if (/created_by_other|check constraint/i.test(msg)) {
    return `Describe the relation in ${OTHER_RELATION_MIN}–${OTHER_RELATION_MAX} characters.`;
  }
  if (/network|fetch/i.test(msg)) return 'No connection. Check your internet and try again.';
  return msg || 'Something went wrong. Please try again.';
}

export function useStudentProfiles() {
  const { session } = useAuth();
  const accountId = session?.user.id;
  return useQuery({
    queryKey: key(accountId),
    enabled: Boolean(accountId),
    queryFn: async (): Promise<StudentProfile[]> => {
      const { data, error } = await supabase
        .from('children')
        .select('*')
        .order('created_at', { ascending: true });
      if (error) throw error;
      return (data ?? []) as StudentProfile[];
    },
  });
}

export function useSaveStudentProfile() {
  const { session } = useAuth();
  const accountId = session?.user.id;
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, input }: { id?: string; input: StudentProfileInput }) => {
      if (!accountId) throw new Error('Please log in again.');
      const row = { ...input, middle_name: input.middle_name ?? '' };
      const query = id
        ? supabase.from('children').update(row).eq('id', id)
        : supabase.from('children').insert({ ...row, account_id: accountId });
      const { error } = await query;
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: key(accountId) }),
  });
}

export function useDeleteStudentProfile() {
  const { session } = useAuth();
  const accountId = session?.user.id;
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('children').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: key(accountId) }),
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
