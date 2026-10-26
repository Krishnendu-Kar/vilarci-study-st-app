import React from 'react';
import { View } from 'react-native';
import { useTheme } from '../theme/ThemeProvider';
import { spacing } from '../theme/tokens';
import { useStudentContext, useTests } from '../lib/api/hooks';
import { centerById } from '../lib/api/selectors';
import {
  AppText,
  Card,
  Divider,
  EmptyState,
  Pill,
  ProgressBar,
  Row,
  SectionHeader,
  StatTile,
} from '../components/ui/base';
import { Screen } from '../components/ui/Screen';
import { ContextHeader } from '../components/ContextHeader';
import { ACADEMIC_NAV, SubNav } from '../components/SubNav';
import { ScoreTrendChart } from '../components/charts/ScoreTrendChart';
import { SubjectMasteryBars } from '../components/charts/SubjectMasteryBars';
import { formatDate, gradeFor } from '../lib/utils/format';

export function TestsScreen() {
  const { colors, subject } = useTheme();
  const ctx = useStudentContext();
  const { tests, trend, mastery, weakTopics } = useTests();

  if (!tests.length) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.bgApp }}>
        <ContextHeader />
        <SubNav items={ACADEMIC_NAV} />
        <Screen>
          <EmptyState
            icon="📝"
            title="No assessments yet"
            message="Test scorecards published by your faculties will land here."
          />
        </Screen>
      </View>
    );
  }

  const totalMax = tests.reduce((s, t) => s + t.total_marks, 0);
  const totalGot = tests.reduce((s, t) => s + t.marks_obtained, 0);
  const average = totalMax ? (totalGot / totalMax) * 100 : 0;
  const best = [...tests].sort(
    (a, b) => b.marks_obtained / b.total_marks - a.marks_obtained / a.total_marks,
  )[0];

  return (
    <View style={{ flex: 1, backgroundColor: colors.bgApp }}>
      <ContextHeader />
      <SubNav items={ACADEMIC_NAV} />
      <Screen>
        <AppText variant="title">Tests & Assessments</AppText>
        <AppText variant="caption" tone="muted">
          {tests.length} graded ·{' '}
          {ctx.isAllCenters ? `${ctx.enrolledCenters.length} centres` : ctx.activeCenter?.name}
        </AppText>

        <Row gap={spacing.sm} wrap style={{ marginTop: spacing.lg }}>
          <StatTile
            label="Average"
            value={`${average.toFixed(1)}%`}
            sub={`Grade ${gradeFor(average)} across all faculties`}
            tone={average >= 85 ? 'success' : average >= 70 ? 'primary' : 'warning'}
            icon="🎯"
          />
          <StatTile
            label="Best score"
            value={`${((best.marks_obtained / best.total_marks) * 100).toFixed(0)}%`}
            sub={best.subject}
            tone="accent"
            icon="🏆"
          />
        </Row>

        <View style={{ marginTop: spacing.lg }}>
          <ScoreTrendChart points={trend} />
        </View>

        <View style={{ marginTop: spacing.xl }}>
          <SectionHeader icon="📊" title="Subject mastery" subtitle="Aggregated marks per subject" />
          <Card>
            <SubjectMasteryBars data={mastery} />
          </Card>
        </View>

        {weakTopics.length ? (
          <View style={{ marginTop: spacing.xl }}>
            <SectionHeader
              icon="🔍"
              title="Diagnostic weak topics"
              subtitle="Tagged by your teachers across recent assessments"
            />
            <Card rail={colors.accent}>
              <Row gap={6} wrap>
                {weakTopics.map((w) => (
                  <Pill key={w} label={w} tone="warning" />
                ))}
              </Row>
              <Divider style={{ marginVertical: spacing.md }} />
              <AppText variant="caption" tone="muted">
                Revise these in the Curriculum tracker to earn 15 pts per topic, or drill them in the Practice
                set.
              </AppText>
            </Card>
          </View>
        ) : null}

        <View style={{ marginTop: spacing.xl }}>
          <SectionHeader icon="🧾" title="Scorecards" subtitle="Most recent first" />
          <View style={{ gap: spacing.sm }}>
            {[...tests].reverse().map((t) => {
              const pct = (t.marks_obtained / t.total_marks) * 100;
              const tone = subject(t.subject);
              const center = centerById(t.center_id);
              return (
                <Card key={t.id} rail={center?.color}>
                  <Row justify="space-between" align="flex-start" gap={spacing.md}>
                    <View style={{ flex: 1 }}>
                      <AppText variant="overline" style={{ color: tone.text }}>
                        {t.subject.toUpperCase()}
                      </AppText>
                      <AppText variant="subheading" style={{ marginTop: 3 }}>
                        {t.name}
                      </AppText>
                      <AppText variant="caption" tone="muted" style={{ marginTop: 2 }}>
                        {formatDate(t.date)} · {t.duration_min} min · {center?.name}
                      </AppText>
                    </View>
                    <View style={{ alignItems: 'flex-end' }}>
                      <AppText variant="metric" style={{ color: tone.base }}>
                        {t.marks_obtained}
                      </AppText>
                      <AppText variant="caption" tone="muted">
                        / {t.total_marks}
                      </AppText>
                      <Pill
                        label={`${pct.toFixed(0)}% · ${gradeFor(pct)}`}
                        tone={pct >= 85 ? 'success' : pct >= 70 ? 'primary' : 'warning'}
                        style={{ marginTop: 5 }}
                      />
                    </View>
                  </Row>

                  <View style={{ marginTop: spacing.md }}>
                    <ProgressBar value={pct} color={tone.base} height={6} />
                  </View>

                  <Divider style={{ marginVertical: spacing.md }} />
                  <AppText variant="overline" tone="muted">
                    TOPICS TESTED
                  </AppText>
                  <Row gap={5} wrap style={{ marginTop: 5 }}>
                    {t.topics_tested.map((tt) => (
                      <Pill key={tt} label={tt} tone="info" />
                    ))}
                  </Row>
                  {t.weak_topics.length ? (
                    <>
                      <AppText variant="overline" tone="muted" style={{ marginTop: spacing.sm }}>
                        NEEDS WORK
                      </AppText>
                      <Row gap={5} wrap style={{ marginTop: 5 }}>
                        {t.weak_topics.map((w) => (
                          <Pill key={w} label={w} tone="error" />
                        ))}
                      </Row>
                    </>
                  ) : null}
                </Card>
              );
            })}
          </View>
        </View>
      </Screen>
    </View>
  );
}
