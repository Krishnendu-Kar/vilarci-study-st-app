// React bindings over the pure selectors. Screens use only these hooks, so the
// data source can change without touching UI code.
import { useMemo } from 'react';
import { useAppStore } from '../store/useAppStore';
import { DATA, household } from '../data';
import type { Student } from '../data/types';
import { todayIso } from '../utils/format';
import * as S from './selectors';

export function useStudents(): Student[] {
  const addedStudents = useAppStore((s) => s.addedStudents);
  const contactEdits = useAppStore((s) => s.contactEdits);
  const joinedCenters = useAppStore((s) => s.joinedCenters);
  return useMemo(
    () => S.resolveStudents(addedStudents, contactEdits, joinedCenters),
    [addedStudents, contactEdits, joinedCenters],
  );
}

export function useStudentContext(): S.StudentContext {
  const students = useStudents();
  const currentStudentId = useAppStore((s) => s.currentStudentId);
  const currentCenterId = useAppStore((s) => s.currentCenterId);

  return useMemo(() => {
    const student = students.find((s) => s.id === currentStudentId) ?? students[0];
    return S.buildContext(student, currentCenterId);
  }, [students, currentStudentId, currentCenterId]);
}

export function useFees() {
  const ctx = useStudentContext();
  return useMemo(() => {
    const invoices = S.feesFor(ctx).sort((a, b) => b.due_date.localeCompare(a.due_date));
    return { invoices, summary: S.feeSummary(invoices, todayIso()) };
  }, [ctx]);
}

export function useAttendance() {
  const ctx = useStudentContext();
  return useMemo(() => {
    const records = S.attendanceFor(ctx).sort((a, b) => b.date.localeCompare(a.date));
    return { records, stats: S.attendanceStats(records) };
  }, [ctx]);
}

export function useTimetable() {
  const ctx = useStudentContext();
  return useMemo(() => {
    const entries = S.timetableFor(ctx);
    return {
      entries,
      byDay: (dayIndex: number) => S.classesOnDay(entries, dayIndex),
      next: S.nextClass(entries),
    };
  }, [ctx]);
}

export function useSyllabus() {
  const ctx = useStudentContext();
  const revisedTopics = useAppStore((s) => s.revisedTopics);
  return useMemo(() => {
    const topics = S.syllabusFor(ctx);
    return {
      topics: topics.map((t) => ({
        ...t,
        revised_by_student: t.revised_by_student || Boolean(revisedTopics[t.id]),
      })),
      progress: S.syllabusProgress(topics, revisedTopics),
    };
  }, [ctx, revisedTopics]);
}

export function useVideos() {
  const ctx = useStudentContext();
  return useMemo(() => S.videosFor(ctx), [ctx]);
}

export function useTests() {
  const ctx = useStudentContext();
  return useMemo(() => {
    const tests = S.testsFor(ctx);
    return {
      tests,
      trend: S.scoreTrend(tests),
      mastery: S.subjectMastery(tests),
      weakTopics: S.weakTopics(tests),
    };
  }, [ctx]);
}

export function useDocuments() {
  const ctx = useStudentContext();
  return useMemo(() => S.documentsFor(ctx), [ctx]);
}

export function usePoints() {
  const ctx = useStudentContext();
  const localAwards = useAppStore((s) => s.localAwards);
  const bonusPointsFor = useAppStore((s) => s.bonusPointsFor);
  const focusSessions = useAppStore((s) => s.focusSessions);
  const simulationsOpened = useAppStore((s) => s.simulationsOpened);

  return useMemo(() => {
    const history = S.pointsHistoryFor(ctx, localAwards);
    return {
      history,
      total: S.totalPoints(ctx.student, bonusPointsFor(ctx.student.id)),
      teacherTotal: S.teacherAwardTotal(history),
      systemTotal: S.systemAwardTotal(history),
      badges: S.badgesFor(ctx.student, ctx, focusSessions, simulationsOpened),
      streak: ctx.student.streak,
    };
  }, [ctx, localAwards, bonusPointsFor, focusSessions, simulationsOpened]);
}

export function useBatches() {
  const ctx = useStudentContext();
  return useMemo(() => {
    const names = S.batchesFor(ctx);
    return {
      names,
      board: (name: string) => S.batchLeaderboard(name),
      banner: (name: string) => {
        const board = S.batchLeaderboard(name);
        return board ? S.motivationBanner(board, ctx.student) : null;
      },
    };
  }, [ctx]);
}

export function useTopScholars(limit = 5) {
  return useMemo(() => S.topScholars(limit), [limit]);
}

export function useSimulations() {
  return DATA.simulations;
}

export function useMcqs() {
  return DATA.mcqs;
}

export function useHousehold() {
  const students = useStudents();
  const bonusPointsFor = useAppStore((s) => s.bonusPointsFor);
  return useMemo(
    () => ({
      household,
      rows: S.householdRows(students, bonusPointsFor),
    }),
    [students, bonusPointsFor],
  );
}

export function useVerifier() {
  const students = useStudents();
  return useMemo(() => (code: string) => S.verifyCode(code, students), [students]);
}

export function useAllCenters() {
  return DATA.centers;
}
