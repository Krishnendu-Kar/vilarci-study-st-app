// Pure relational selectors. This is the ONLY module that knows where records
// come from — swapping the mock store for Supabase means rewriting the bodies
// here, never the screens.
import { DATA } from '../data';
import type {
  AcademicDocument,
  AttendanceRecord,
  BatchLeaderboard,
  Center,
  FeeInvoice,
  LeaderboardRow,
  MotivationBanner,
  PointsHistoryEntry,
  Student,
  SyllabusTopic,
  TestResult,
  TimetableEntry,
  Video,
} from '../data/types';
import { ALL_CENTERS } from '../store/useAppStore';
import { toMinutes, WEEKDAYS } from '../utils/format';

export interface StudentContext {
  student: Student;
  /** Centres the student is enrolled in (base data + codes joined in-app). */
  enrolledCenters: Center[];
  /** Centre ids a view should include for the active filter. */
  visibleCenterIds: string[];
  /** The single active centre, or null in consolidated "All centres" mode. */
  activeCenter: Center | null;
  isAllCenters: boolean;
}

export function resolveStudents(
  addedStudents: Student[],
  contactEdits: Record<string, Partial<Student>>,
  joinedCenters: Record<string, string[]>,
): Student[] {
  return [...DATA.students, ...addedStudents].map((s) => {
    const extra = joinedCenters[s.id] ?? [];
    const merged = extra.length
      ? { ...s, enrolled_centers: Array.from(new Set([...s.enrolled_centers, ...extra])) }
      : s;
    const edits = contactEdits[s.id];
    return edits ? { ...merged, ...edits } : merged;
  });
}

export function buildContext(student: Student, currentCenterId: string): StudentContext {
  const enrolledCenters = student.enrolled_centers
    .map((id) => DATA.centers.find((c) => c.id === id))
    .filter((c): c is Center => Boolean(c));

  const isAllCenters = currentCenterId === ALL_CENTERS || !student.enrolled_centers.includes(currentCenterId);

  return {
    student,
    enrolledCenters,
    visibleCenterIds: isAllCenters ? student.enrolled_centers : [currentCenterId],
    activeCenter: isAllCenters ? null : enrolledCenters.find((c) => c.id === currentCenterId) ?? null,
    isAllCenters,
  };
}

export function centerById(id?: string | null): Center | null {
  if (!id) return null;
  return DATA.centers.find((c) => c.id === id) ?? null;
}

export function centerByCode(code: string): Center | null {
  const n = code.trim().toUpperCase();
  return DATA.centers.find((c) => c.code.toUpperCase() === n) ?? null;
}

// ─── Student + centre scoped tables ────────────────────────────────────────────

const inCenters = (ids: string[]) => (r: { center_id: string }) => ids.includes(r.center_id);

export function feesFor(ctx: StudentContext): FeeInvoice[] {
  return DATA.fees
    .filter((f) => f.student_id === ctx.student.id)
    .filter(inCenters(ctx.visibleCenterIds));
}

export function attendanceFor(ctx: StudentContext): AttendanceRecord[] {
  return DATA.attendance
    .filter((a) => a.student_id === ctx.student.id)
    .filter(inCenters(ctx.visibleCenterIds));
}

export function timetableFor(ctx: StudentContext): TimetableEntry[] {
  return DATA.timetable.filter(inCenters(ctx.visibleCenterIds));
}

export function syllabusFor(ctx: StudentContext): SyllabusTopic[] {
  return DATA.syllabus.filter(inCenters(ctx.visibleCenterIds));
}

export function videosFor(ctx: StudentContext): Video[] {
  return DATA.videos.filter(inCenters(ctx.visibleCenterIds));
}

export function testsFor(ctx: StudentContext): TestResult[] {
  return DATA.tests
    .filter((t) => t.student_id === ctx.student.id)
    .filter(inCenters(ctx.visibleCenterIds))
    .sort((a, b) => a.date.localeCompare(b.date));
}

export function documentsFor(ctx: StudentContext): AcademicDocument[] {
  return DATA.documents
    .filter((d) => d.student_id === ctx.student.id)
    .filter(inCenters(ctx.visibleCenterIds))
    .sort((a, b) => b.issue_date.localeCompare(a.issue_date));
}

export function pointsHistoryFor(
  ctx: StudentContext,
  localAwards: PointsHistoryEntry[],
): PointsHistoryEntry[] {
  const all = [...localAwards, ...DATA.points_history];
  return all
    .filter((p) => p.student_id === ctx.student.id)
    // Universal awards (no centre) always show; centre awards respect the filter.
    .filter((p) => p.center_id === null || ctx.visibleCenterIds.includes(p.center_id))
    .sort((a, b) => b.date.localeCompare(a.date));
}

// ─── Derived analytics ────────────────────────────────────────────────────────

export interface AttendanceStats {
  total: number;
  present: number;
  late: number;
  absent: number;
  /** Present + late counted as attended, matching the website gauge. */
  rate: number;
  byMonth: { month: string; rate: number; present: number; total: number }[];
}

export function attendanceStats(records: AttendanceRecord[]): AttendanceStats {
  const present = records.filter((r) => r.status === 'present').length;
  const late = records.filter((r) => r.status === 'late').length;
  const absent = records.filter((r) => r.status === 'absent').length;
  const total = records.length;

  const months = new Map<string, { present: number; total: number }>();
  for (const r of records) {
    const key = r.date.slice(0, 7);
    const bucket = months.get(key) ?? { present: 0, total: 0 };
    bucket.total += 1;
    if (r.status !== 'absent') bucket.present += 1;
    months.set(key, bucket);
  }

  return {
    total,
    present,
    late,
    absent,
    rate: total ? ((present + late) / total) * 100 : 0,
    byMonth: [...months.entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([month, b]) => ({
        month,
        present: b.present,
        total: b.total,
        rate: b.total ? (b.present / b.total) * 100 : 0,
      })),
  };
}

export interface FeeSummary {
  paidTotal: number;
  pendingTotal: number;
  pendingCount: number;
  nextDue: FeeInvoice | null;
  /** Pending invoices whose due date has already passed. */
  overdue: FeeInvoice[];
}

export function feeSummary(invoices: FeeInvoice[], todayIso: string): FeeSummary {
  const pending = invoices.filter((f) => f.status === 'pending');
  const sorted = [...pending].sort((a, b) => a.due_date.localeCompare(b.due_date));
  return {
    paidTotal: invoices.filter((f) => f.status === 'paid').reduce((s, f) => s + f.amount, 0),
    pendingTotal: pending.reduce((s, f) => s + f.amount, 0),
    pendingCount: pending.length,
    nextDue: sorted[0] ?? null,
    overdue: sorted.filter((f) => f.due_date < todayIso),
  };
}

export interface ScorePoint {
  label: string;
  date: string;
  percent: number;
  name: string;
  subject: string;
}

export function scoreTrend(tests: TestResult[]): ScorePoint[] {
  return tests.map((t) => ({
    label: t.date.slice(5),
    date: t.date,
    percent: t.total_marks ? (t.marks_obtained / t.total_marks) * 100 : 0,
    name: t.name,
    subject: t.subject,
  }));
}

export interface SubjectMastery {
  subject: string;
  percent: number;
  obtained: number;
  max: number;
  tests: number;
}

export function subjectMastery(tests: TestResult[]): SubjectMastery[] {
  const map = new Map<string, { obtained: number; max: number; tests: number }>();
  for (const t of tests) {
    const b = map.get(t.subject) ?? { obtained: 0, max: 0, tests: 0 };
    b.obtained += t.marks_obtained;
    b.max += t.total_marks;
    b.tests += 1;
    map.set(t.subject, b);
  }
  return [...map.entries()]
    .map(([subject, b]) => ({
      subject,
      obtained: b.obtained,
      max: b.max,
      tests: b.tests,
      percent: b.max ? (b.obtained / b.max) * 100 : 0,
    }))
    .sort((a, b) => b.percent - a.percent);
}

export interface SyllabusProgress {
  covered: number;
  partial: number;
  skipped: number;
  upcoming: number;
  total: number;
  coveragePercent: number;
  revisedPercent: number;
}

export function syllabusProgress(
  topics: SyllabusTopic[],
  revisedOverrides: Record<string, boolean>,
): SyllabusProgress {
  const count = (s: SyllabusTopic['status']) => topics.filter((t) => t.status === s).length;
  const covered = count('covered');
  const revised = topics.filter((t) => t.revised_by_student || revisedOverrides[t.id]).length;
  return {
    covered,
    partial: count('partial'),
    skipped: count('skipped'),
    upcoming: count('upcoming'),
    total: topics.length,
    coveragePercent: topics.length ? (covered / topics.length) * 100 : 0,
    revisedPercent: topics.length ? (revised / topics.length) * 100 : 0,
  };
}

export function weakTopics(tests: TestResult[]): string[] {
  const seen = new Set<string>();
  for (const t of [...tests].reverse()) for (const w of t.weak_topics) seen.add(w);
  return [...seen];
}

// ─── Timetable helpers ────────────────────────────────────────────────────────

export interface ScheduleEntry extends TimetableEntry {
  centerName: string;
  centerColor: string;
}

export function decorate(entries: TimetableEntry[]): ScheduleEntry[] {
  return entries.map((e) => {
    const c = centerById(e.center_id);
    return { ...e, centerName: c?.name ?? 'Centre', centerColor: c?.color ?? '#800020' };
  });
}

export function classesOnDay(entries: TimetableEntry[], dayIndex: number): ScheduleEntry[] {
  const day = WEEKDAYS[dayIndex];
  return decorate(entries.filter((e) => e.day_of_week === day)).sort(
    (a, b) => toMinutes(a.start_time) - toMinutes(b.start_time),
  );
}

/** Next class from now, scanning forward up to a full week. */
export function nextClass(entries: TimetableEntry[], now = new Date()): (ScheduleEntry & { dayOffset: number }) | null {
  const nowMinutes = now.getHours() * 60 + now.getMinutes();
  for (let offset = 0; offset < 7; offset++) {
    const dayIndex = (now.getDay() + offset) % 7;
    const dayClasses = classesOnDay(entries, dayIndex);
    for (const c of dayClasses) {
      if (offset > 0 || toMinutes(c.start_time) >= nowMinutes) {
        return { ...c, dayOffset: offset };
      }
    }
  }
  return null;
}

// ─── Gamification ─────────────────────────────────────────────────────────────

export function totalPoints(student: Student, bonus: number): number {
  return student.points + bonus;
}

export function teacherAwardTotal(history: PointsHistoryEntry[]): number {
  return history.filter((h) => h.award_type === 'teacher').reduce((s, h) => s + h.points, 0);
}

export function systemAwardTotal(history: PointsHistoryEntry[]): number {
  return history.filter((h) => h.award_type === 'system').reduce((s, h) => s + h.points, 0);
}

/** Batches the student can inspect, derived from their enrolled centres. */
export function batchesFor(ctx: StudentContext): string[] {
  const names = new Set<string>();
  for (const center of ctx.enrolledCenters) {
    for (const [batchName, info] of Object.entries(DATA.batch_leaderboards)) {
      const sameCenter = info.center === center.name || info.center.startsWith(center.name);
      const hasStudent = info.students.some((s) => s.student_id === ctx.student.id);
      if (sameCenter && (hasStudent || center.active_batch === batchName)) names.add(batchName);
    }
  }
  // Fall back to any batch that lists this student, so switchers are never empty.
  if (!names.size) {
    for (const [batchName, info] of Object.entries(DATA.batch_leaderboards)) {
      if (info.students.some((s) => s.student_id === ctx.student.id)) names.add(batchName);
    }
  }
  return [...names];
}

export function batchLeaderboard(batchName: string): BatchLeaderboard | null {
  return DATA.batch_leaderboards[batchName] ?? null;
}

/**
 * Live rank differential — ported from the website's peer motivation algorithm.
 * Rank #1 gets a celebration, ranked students get a concrete points gap, and
 * students not in the roster get a spectator message.
 */
export function motivationBanner(batch: BatchLeaderboard, student: Student): MotivationBanner {
  const self = batch.students.find(
    (s) => s.student_id === student.id || s.student_name === student.name,
  );

  if (!self) {
    const topper = batch.students[0];
    return {
      kind: 'spectator',
      title: `${batch.teacher} · ${batch.subject}`,
      subtitle: topper
        ? `${topper.student_name} leads this batch with ${topper.points.toLocaleString('en-IN')} pts. Join the batch to appear on this board.`
        : 'No standings published for this batch yet.',
      icon: '👀',
    };
  }

  if (self.rank === 1) {
    return {
      kind: 'rank1',
      title: `Incredible! You are Rank #1 in this batch`,
      subtitle: `${self.points.toLocaleString('en-IN')} pts and a ${self.streak}. Hold the crown — keep the streak alive.`,
      icon: '🏆',
    };
  }

  const peerAbove = batch.students.find((s) => s.rank === self.rank - 1);
  const gap = peerAbove ? peerAbove.points - self.points : 50;
  return {
    kind: 'ranked',
    title: `${student.name} is Rank #${self.rank} in this batch!`,
    subtitle: `Only ${gap.toLocaleString('en-IN')} pts needed to overtake ${
      peerAbove?.student_name ?? 'the student above'
    } for Rank #${self.rank - 1}. Complete 1 quiz or test to climb up.`,
    icon: '⚡',
  };
}

/**
 * Institution-wide hall of fame. Strictly the top 5 — the active student is
 * never appended at the bottom if they fall outside it.
 */
export function topScholars(limit = 5): LeaderboardRow[] {
  return DATA.leaderboard.slice(0, limit);
}

export function badgesFor(
  student: Student,
  ctx: StudentContext,
  focusSessions: number,
  simulationsOpened: Record<string, true>,
) {
  const docs = documentsFor(ctx);
  const invoices = feesFor(ctx);
  const simCount = Object.keys(simulationsOpened).length;

  return DATA.badges.map((b) => {
    switch (b.id) {
      case 'badge-1':
        return { ...b, earned: ctx.enrolledCenters.length > 1 };
      case 'badge-2':
        return { ...b, earned: student.streak >= 7 };
      case 'badge-3':
        return { ...b, earned: docs.some((d) => d.percentage >= 85) };
      case 'badge-4': {
        const earned = focusSessions >= 10;
        return { ...b, earned, progress: `${Math.min(focusSessions, 10)}/10 sessions` };
      }
      case 'badge-5':
        return { ...b, earned: invoices.length > 0 && invoices.every((f) => f.status === 'paid') };
      case 'badge-6': {
        const earned = simCount >= 5;
        return { ...b, earned, progress: `${Math.min(simCount, 5)}/5 labs` };
      }
      default:
        return b;
    }
  });
}

// ─── Credential verification ──────────────────────────────────────────────────

export type VerifyResult =
  | { state: 'valid'; document: AcademicDocument; student: Student | null }
  | { state: 'revoked'; document: AcademicDocument; student: Student | null }
  | { state: 'not_found'; code: string };

export function verifyCode(code: string, students: Student[]): VerifyResult {
  const normalized = code.trim().toUpperCase();
  const doc = DATA.documents.find((d) => d.code.toUpperCase() === normalized);
  if (!doc) return { state: 'not_found', code: normalized };
  const student = students.find((s) => s.id === doc.student_id) ?? null;
  return { state: doc.status === 'valid' ? 'valid' : 'revoked', document: doc, student };
}

// ─── Household rollup (parent overview) ───────────────────────────────────────

export interface HouseholdRow {
  student: Student;
  centers: Center[];
  attendanceRate: number;
  pendingFees: number;
  pendingCount: number;
  averagePercent: number;
  points: number;
  streak: number;
  testCount: number;
}

export function householdRows(students: Student[], bonusFor: (id: string) => number): HouseholdRow[] {
  return students.map((student) => {
    const ctx = buildContext(student, ALL_CENTERS);
    const att = attendanceStats(attendanceFor(ctx));
    const fs = feeSummary(feesFor(ctx), '9999-12-31');
    const tests = testsFor(ctx);
    const totalMax = tests.reduce((s, t) => s + t.total_marks, 0);
    const totalGot = tests.reduce((s, t) => s + t.marks_obtained, 0);

    return {
      student,
      centers: ctx.enrolledCenters,
      attendanceRate: att.rate,
      pendingFees: fs.pendingTotal,
      pendingCount: fs.pendingCount,
      averagePercent: totalMax ? (totalGot / totalMax) * 100 : 0,
      points: student.points + bonusFor(student.id),
      streak: student.streak,
      testCount: tests.length,
    };
  });
}
