import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { DATA } from '../data';
import type { PointsAwardType, PointsHistoryEntry, Student } from '../data/types';

export type ThemeMode = 'system' | 'light' | 'dark';
export type Language = 'en' | 'bn';

/** 'all' renders the consolidated "All Enrolled Centers" view. */
export const ALL_CENTERS = 'all';

export interface LocalAward {
  id: string;
  student_id: string;
  center_id: string | null;
  center_name: string | null;
  award_type: PointsAwardType;
  awarded_by: string;
  date: string;
  action: string;
  points: number;
  description: string;
}

interface AppState {
  // ── context ───────────────────────────────────────────────────────────────
  currentStudentId: string;
  currentCenterId: string;
  setCurrentStudent: (id: string) => void;
  setCurrentCenter: (id: string) => void;

  // ── preferences ───────────────────────────────────────────────────────────
  themeMode: ThemeMode;
  setThemeMode: (mode: ThemeMode) => void;
  language: Language;
  setLanguage: (lang: Language) => void;

  // ── locally-added sibling profiles (household cap of 5) ───────────────────
  addedStudents: Student[];
  addStudentProfile: (profile: Omit<Student, 'id'>) => string;

  // ── contact edits made from Settings (father / mother / guardian) ─────────
  contactEdits: Record<string, Partial<Student>>;
  updateContacts: (studentId: string, patch: Partial<Student>) => void;

  // ── enrolment via 6-character coaching code ───────────────────────────────
  joinedCenters: Record<string, string[]>;
  joinCenterByCode: (studentId: string, code: string) => { ok: boolean; message: string };

  // ── academic actions that mint points ─────────────────────────────────────
  revisedTopics: Record<string, boolean>;
  localAwards: LocalAward[];
  checkIns: Record<string, true>;
  focusSessions: number;
  simulationsOpened: Record<string, true>;

  markTopicRevised: (topicId: string, topicName: string, centerId: string | null) => number;
  recordCheckIn: (centerId: string, date: string) => { ok: boolean; points: number; message: string };
  completeFocusSession: (minutes: number) => number;
  recordSimulationOpened: (simId: string) => void;
  awardPractice: (scorePercent: number, subject: string) => number;

  // ── derived helpers ───────────────────────────────────────────────────────
  bonusPointsFor: (studentId: string) => number;
  resetDemoProgress: () => void;
}

const today = () => new Date().toISOString().slice(0, 10);
const uid = (prefix: string) => `${prefix}-${Date.now().toString(36)}-${Math.floor(Math.random() * 1e4)}`;

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      currentStudentId: 'student-1',
      currentCenterId: ALL_CENTERS,
      setCurrentStudent: (id) => set({ currentStudentId: id, currentCenterId: ALL_CENTERS }),
      setCurrentCenter: (id) => set({ currentCenterId: id }),

      themeMode: 'light',
      setThemeMode: (themeMode) => set({ themeMode }),
      language: 'en',
      setLanguage: (language) => set({ language }),

      addedStudents: [],
      addStudentProfile: (profile) => {
        const id = uid('student-local');
        set((s) => ({ addedStudents: [...s.addedStudents, { ...profile, id } as Student] }));
        return id;
      },

      contactEdits: {},
      updateContacts: (studentId, patch) =>
        set((s) => ({
          contactEdits: {
            ...s.contactEdits,
            [studentId]: { ...(s.contactEdits[studentId] ?? {}), ...patch },
          },
        })),

      joinedCenters: {},
      joinCenterByCode: (studentId, code) => {
        const normalized = code.trim().toUpperCase();
        const center = DATA.centers.find((c) => c.code.toUpperCase() === normalized);
        if (!center) {
          return { ok: false, message: `No coaching centre found for code "${normalized}".` };
        }
        const base = DATA.students.find((s) => s.id === studentId);
        const extra = get().joinedCenters[studentId] ?? [];
        const already = [...(base?.enrolled_centers ?? []), ...extra].includes(center.id);
        if (already) {
          return { ok: false, message: `Already enrolled at ${center.name}.` };
        }
        set((s) => ({
          joinedCenters: { ...s.joinedCenters, [studentId]: [...extra, center.id] },
        }));
        return { ok: true, message: `Enrolled at ${center.name} — ${center.teacher_name}.` };
      },

      revisedTopics: {},
      localAwards: [],
      checkIns: {},
      focusSessions: 0,
      simulationsOpened: {},

      markTopicRevised: (topicId, topicName, centerId) => {
        if (get().revisedTopics[topicId]) return 0;
        const points = 15;
        const center = DATA.centers.find((c) => c.id === centerId);
        set((s) => ({
          revisedTopics: { ...s.revisedTopics, [topicId]: true },
          localAwards: [
            {
              id: uid('ph'),
              student_id: s.currentStudentId,
              center_id: centerId,
              center_name: center?.name ?? null,
              award_type: 'system',
              awarded_by: 'Curriculum Tracker',
              date: today(),
              action: 'topic_revised',
              points,
              description: `Self-revision confirmed: ${topicName}`,
            },
            ...s.localAwards,
          ],
        }));
        return points;
      },

      recordCheckIn: (centerId, date) => {
        const studentId = get().currentStudentId;
        const key = `${studentId}:${centerId}:${date}`;
        if (get().checkIns[key]) {
          return { ok: false, points: 0, message: 'Already checked in for this session today.' };
        }
        const points = 10;
        const center = DATA.centers.find((c) => c.id === centerId);
        set((s) => ({
          checkIns: { ...s.checkIns, [key]: true },
          localAwards: [
            {
              id: uid('ph'),
              student_id: studentId,
              center_id: centerId,
              center_name: center?.name ?? null,
              award_type: 'system',
              awarded_by: 'System QR Scanner',
              date,
              action: 'attendance',
              points,
              description: `On-time QR attendance check-in verified at ${center?.name ?? 'centre'}`,
            },
            ...s.localAwards,
          ],
        }));
        return { ok: true, points, message: `Checked in at ${center?.name ?? 'centre'} (+${points} pts)` };
      },

      completeFocusSession: (minutes) => {
        const points = 25;
        set((s) => ({
          focusSessions: s.focusSessions + 1,
          localAwards: [
            {
              id: uid('ph'),
              student_id: s.currentStudentId,
              center_id: null,
              center_name: null,
              award_type: 'system',
              awarded_by: 'Focus Room Engine',
              date: today(),
              action: 'focus_session',
              points,
              description: `${minutes}-minute distraction-free focus session completed`,
            },
            ...s.localAwards,
          ],
        }));
        return points;
      },

      recordSimulationOpened: (simId) =>
        set((s) => ({ simulationsOpened: { ...s.simulationsOpened, [simId]: true } })),

      awardPractice: (scorePercent, subject) => {
        if (scorePercent < 80) return 0;
        const points = 30;
        set((s) => ({
          localAwards: [
            {
              id: uid('ph'),
              student_id: s.currentStudentId,
              center_id: null,
              center_name: null,
              award_type: 'system',
              awarded_by: 'Practice Engine',
              date: today(),
              action: 'practice_test',
              points,
              description: `${subject} practice set cleared with ${Math.round(scorePercent)}%`,
            },
            ...s.localAwards,
          ],
        }));
        return points;
      },

      bonusPointsFor: (studentId) =>
        get()
          .localAwards.filter((a) => a.student_id === studentId)
          .reduce((sum, a) => sum + a.points, 0),

      resetDemoProgress: () =>
        set({
          revisedTopics: {},
          localAwards: [],
          checkIns: {},
          focusSessions: 0,
          simulationsOpened: {},
          joinedCenters: {},
          contactEdits: {},
          addedStudents: [],
        }),
    }),
    {
      name: 'vilarci_state_v2',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (s) => ({
        currentStudentId: s.currentStudentId,
        currentCenterId: s.currentCenterId,
        themeMode: s.themeMode,
        language: s.language,
        addedStudents: s.addedStudents,
        contactEdits: s.contactEdits,
        joinedCenters: s.joinedCenters,
        revisedTopics: s.revisedTopics,
        localAwards: s.localAwards,
        checkIns: s.checkIns,
        focusSessions: s.focusSessions,
        simulationsOpened: s.simulationsOpened,
      }),
    },
  ),
);

/** Convert a local award into the shared PointsHistoryEntry shape. */
export function toHistoryEntry(a: LocalAward): PointsHistoryEntry {
  return { ...a };
}
