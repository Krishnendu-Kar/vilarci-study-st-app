import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { useAuth } from '../AuthProvider';
import { StudentProfile, useStudentProfiles } from '../api/studentProfiles';

/** Which student profile the real app is showing, remembered per account. */
const useActiveStudentStore = create<{
  byAccount: Record<string, string>;
  setActive: (accountId: string, studentId: string) => void;
}>()(
  persist(
    (set) => ({
      byAccount: {},
      setActive: (accountId, studentId) => set((s) => ({ byAccount: { ...s.byAccount, [accountId]: studentId } })),
    }),
    { name: 'vilarci_active_student_v1', storage: createJSONStorage(() => AsyncStorage) },
  ),
);

/**
 * The active student profile. Falls back to the first profile when nothing is
 * chosen yet or the chosen one was deleted, so screens always have someone to
 * show once a profile exists.
 */
export function useActiveStudent(): {
  active: StudentProfile | null;
  activeIndex: number;
  profiles: StudentProfile[];
  isLoading: boolean;
  setActive: (studentId: string) => void;
} {
  const { session } = useAuth();
  const accountId = session?.user.id ?? '';
  const { data: profiles = [], isLoading } = useStudentProfiles();
  const storedId = useActiveStudentStore((s) => s.byAccount[accountId]);
  const setActiveFor = useActiveStudentStore((s) => s.setActive);

  const found = profiles.findIndex((p) => p.id === storedId);
  const activeIndex = found >= 0 ? found : profiles.length ? 0 : -1;

  return {
    active: activeIndex >= 0 ? profiles[activeIndex] : null,
    activeIndex,
    profiles,
    isLoading,
    setActive: (studentId) => {
      if (accountId) setActiveFor(accountId, studentId);
    },
  };
}
