// A student's tests and marks, read from the phone's copy. Tests come with the
// batch (batch_tests, with the teacher's class summary); the marks come in the
// student's own month rows — parents never receive other students' marks.
import { useMemo } from 'react';
import { useLocalStore } from '../local/store';
import type { BatchTest, EnrolmentMonth } from '../local/types';
import { attendanceStart } from '../utils/attendance';
import { averagePercent, Score, scoreOf, scorePercent, sortTests, summaryOf, TestSummary } from '../utils/tests';
import type { Membership } from './batches';

const NO_TESTS: BatchTest[] = [];
const NO_MONTHS: Record<string, EnrolmentMonth> = {};

export interface TestResult {
  test: BatchTest;
  /** The student's mark, "AB", or null (not marked yet). */
  score: Score | null;
  percent: number | null;
  summary: TestSummary | null;
  /** The class average as a percentage of the max. */
  classPercent: number | null;
}

export interface StudentTests {
  results: TestResult[];
  /** Average % over the tests with marks (absences left out). */
  average: number | null;
  /** Tests with marks / marked absent. */
  marked: number;
  absent: number;
  best: TestResult | null;
  latest: TestResult | null;
}

/**
 * One membership's tests, newest first: tests held since the student joined,
 * plus any older one they have a mark for.
 */
export function useStudentTests(m: Membership | undefined): StudentTests {
  const tests = useLocalStore((s) => (m ? s.tests[m.batch_id] ?? NO_TESTS : NO_TESTS));
  const months = useLocalStore((s) => (m ? s.months[m.id] ?? NO_MONTHS : NO_MONTHS));
  return useMemo(() => {
    const start = m ? attendanceStart(m.joined_month, m.decided_at) : null;
    const results: TestResult[] = sortTests(tests.filter((t) => !t.deleted_at))
      .map((test) => {
        const score = scoreOf(months, test.id);
        const summary = summaryOf(test);
        return {
          test,
          score,
          percent: scorePercent(score, test.max_marks),
          summary,
          classPercent: summary?.avg != null ? scorePercent(summary.avg, test.max_marks) : null,
        };
      })
      .filter((r) => r.score != null || (start != null && r.test.held_on >= start));
    const withMarks = results.filter((r) => typeof r.score === 'number');
    const best = withMarks.reduce<TestResult | null>((b, r) => (b == null || (r.percent ?? 0) > (b.percent ?? 0) ? r : b), null);
    return {
      results,
      average: averagePercent(results.map((r) => ({ score: r.score, max: r.test.max_marks }))),
      marked: withMarks.length,
      absent: results.filter((r) => r.score === 'AB').length,
      best,
      latest: results.find((r) => r.score != null) ?? null,
    };
  }, [m, tests, months]);
}
