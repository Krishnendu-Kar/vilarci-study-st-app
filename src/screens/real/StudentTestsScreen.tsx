import React from 'react';
import { ActivityIndicator, Pressable, View } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useTheme } from '../../theme/ThemeProvider';
import { spacing } from '../../theme/tokens';
import { Membership, useMemberships } from '../../lib/api/batches';
import { TestResult, useStudentTests } from '../../lib/api/tests';
import { useRefresh } from '../../lib/sync/useRefresh';
import { useActiveStudent } from '../../lib/store/useActiveStudent';
import { classDateLabel } from '../../lib/utils/attendance';
import { formatMarks } from '../../lib/utils/tests';
import { AppText, Card, EmptyState, HeroCard, Pill, Row, SectionHeader } from '../../components/ui/base';
import { Button } from '../../components/ui/Button';
import { Screen } from '../../components/ui/Screen';
import { RealTopBar } from '../../components/real/RealTopBar';

/** The active student's tests: every batch as a card, or one batch's results (from its page). */
export function StudentTestsScreen() {
  const { colors } = useTheme();
  const navigation = useNavigation<any>();
  const onlyId: string | undefined = useRoute<any>().params?.membershipId;
  const { active } = useActiveStudent();
  const { memberships, isLoading } = useMemberships();
  const { refreshing, refresh } = useRefresh();

  const joined = memberships.filter(
    // Tests are set in batches and institute subjects (a section has none of its own).
    (m) => m.student_id === active?.id && m.status === 'approved' && m.kind !== 'section' && (!onlyId || m.id === onlyId),
  );
  const single = joined.length === 1 ? joined[0] : null;

  return (
    <View style={{ flex: 1, backgroundColor: colors.bgApp }}>
      <RealTopBar title="Tests & Results" subtitle={single ? single.batch_name : active ? `${active.first_name}'s batches` : undefined} />
      <Screen refreshing={refreshing} onRefresh={refresh}>
        {!active ? (
          <EmptyState icon="people-outline" title="Add a student first" message="Results are kept per student profile." />
        ) : isLoading ? (
          <ActivityIndicator color={colors.primary} style={{ marginTop: spacing.xxl }} />
        ) : !joined.length ? (
          <View>
            <EmptyState
              icon="document-text-outline"
              title={`No results for ${active.first_name} yet`}
              message="Tests and marks show here once a teacher accepts the join request and enters them."
            />
            <Button
              label="Join a batch"
              iconName="enter-outline"
              fullWidth
              onPress={() => navigation.navigate('JoinBatch', { studentId: active.id })}
              style={{ marginTop: spacing.md }}
            />
          </View>
        ) : single ? (
          <BatchResults m={single} />
        ) : (
          <View style={{ gap: spacing.md }}>
            {joined.map((m) => (
              <BatchSummaryCard key={m.id} m={m} onPress={() => navigation.push('StudentTests', { membershipId: m.id })} />
            ))}
          </View>
        )}
      </Screen>
    </View>
  );
}

function BatchSummaryCard({ m, onPress }: { m: Membership; onPress: () => void }) {
  const { colors } = useTheme();
  const { average, marked, latest } = useStudentTests(m);
  return (
    <Pressable onPress={onPress} accessibilityRole="button" style={({ pressed }) => ({ opacity: pressed ? 0.85 : 1 })}>
      <Card>
        <Row gap={spacing.md}>
          <View style={{ flex: 1 }}>
            <AppText variant="subheading" numberOfLines={1}>
              {m.batch_name}
            </AppText>
            <AppText variant="caption" tone="muted" numberOfLines={1}>
              {latest
                ? `Latest: ${latest.test.title} · ${latest.score === 'AB' ? 'Absent' : `${formatMarks(latest.score as number)}/${formatMarks(latest.test.max_marks)}`}`
                : 'No marks yet'}
            </AppText>
          </View>
          <View style={{ alignItems: 'flex-end' }}>
            <AppText variant="metricSm" style={{ color: average == null ? colors.textMuted : colors.primary }}>
              {average == null ? '—' : `${average}%`}
            </AppText>
            <AppText variant="caption" tone="muted">
              {marked} test{marked === 1 ? '' : 's'}
            </AppText>
          </View>
          <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
        </Row>
      </Card>
    </Pressable>
  );
}

function BatchResults({ m }: { m: Membership }) {
  const { colors } = useTheme();
  const { results, average, marked, absent, best } = useStudentTests(m);

  return (
    <>
      <HeroCard>
        <AppText variant="overline" numberOfLines={1} style={{ color: colors.goldBright }}>
          {m.batch_name.toUpperCase()}
        </AppText>
        <Row gap={spacing.sm} align="flex-end" style={{ marginTop: 2 }}>
          <AppText variant="metric" style={{ color: '#FDFBF9' }}>
            {average == null ? '—' : `${average}%`}
          </AppText>
          <AppText variant="caption" style={{ color: 'rgba(253,251,249,0.75)', marginBottom: 6 }}>
            average score
          </AppText>
        </Row>
        <AppText variant="caption" style={{ color: 'rgba(253,251,249,0.75)' }}>
          {marked || absent
            ? `${marked} test${marked === 1 ? '' : 's'} marked${absent ? ` · absent for ${absent}` : ''}`
            : 'No marks yet'}
        </AppText>
        {best?.percent != null ? (
          <Row gap={6} style={{ marginTop: spacing.md }}>
            <Ionicons name="trophy-outline" size={14} color={colors.goldBright} />
            <AppText variant="caption" numberOfLines={1} style={{ color: 'rgba(253,251,249,0.85)', flex: 1 }}>
              Best: {best.test.title} · {best.percent}%
            </AppText>
          </Row>
        ) : null}
      </HeroCard>

      <View style={{ marginTop: spacing.xxl }}>
        <SectionHeader title="Tests" subtitle={results.length ? 'Newest first' : undefined} />
        {results.length ? (
          <View style={{ gap: spacing.md }}>
            {results.map((r) => (
              <ResultCard key={r.test.id} r={r} />
            ))}
          </View>
        ) : (
          <Card muted>
            <AppText variant="caption" tone="muted">
              No tests yet. They show here as soon as the teacher adds one.
            </AppText>
          </Card>
        )}
        <AppText variant="caption" tone="muted" style={{ marginTop: spacing.sm }}>
          Only {m.student_name.split(' ')[0]}’s marks come to this phone. The class average and highest are worked out by the teacher’s app.
        </AppText>
      </View>
    </>
  );
}

function ResultCard({ r }: { r: TestResult }) {
  const { colors } = useTheme();
  const { test, score, percent, summary, classPercent } = r;
  const compare =
    percent != null && classPercent != null
      ? percent > classPercent
        ? { label: 'Above class average', tone: 'success' as const, icon: 'trending-up-outline' as const }
        : percent < classPercent
          ? { label: 'Below class average', tone: 'warning' as const, icon: 'trending-down-outline' as const }
          : { label: 'At class average', tone: 'neutral' as const, icon: 'remove-outline' as const }
      : null;
  const top = typeof score === 'number' && summary?.high != null && score >= summary.high;
  return (
    <Card>
      <Row justify="space-between" align="flex-start" gap={spacing.md}>
        <View style={{ flex: 1 }}>
          <AppText variant="subheading" numberOfLines={2}>
            {test.title}
          </AppText>
          <AppText variant="caption" tone="muted" numberOfLines={1}>
            {[test.subject, classDateLabel(test.held_on)].filter(Boolean).join(' · ')}
          </AppText>
        </View>
        <View style={{ alignItems: 'flex-end' }}>
          {score === 'AB' ? (
            <Pill label="Absent" tone="error" />
          ) : score == null ? (
            <Pill label="Not marked yet" tone="neutral" />
          ) : (
            <>
              <AppText variant="metricSm" style={{ color: colors.textMain }}>
                {formatMarks(score)}
                <AppText variant="caption" tone="muted">
                  {' '}/ {formatMarks(test.max_marks)}
                </AppText>
              </AppText>
              <AppText variant="captionStrong" tone="primary">
                {percent}%
              </AppText>
            </>
          )}
        </View>
      </Row>
      {summary && (summary.avg != null || summary.high != null) ? (
        <AppText variant="caption" tone="secondary" style={{ marginTop: spacing.sm }}>
          {[
            summary.avg != null ? `Class average ${formatMarks(summary.avg)}${classPercent != null ? ` (${classPercent}%)` : ''}` : null,
            summary.high != null ? `Highest ${formatMarks(summary.high)}` : null,
          ]
            .filter(Boolean)
            .join(' · ')}
        </AppText>
      ) : null}
      {compare || top ? (
        <Row gap={spacing.sm} wrap style={{ marginTop: spacing.sm }}>
          {top ? <Pill label="Top score" tone="gold" icon="trophy-outline" /> : null}
          {compare ? <Pill label={compare.label} tone={compare.tone} icon={compare.icon} /> : null}
        </Row>
      ) : null}
    </Card>
  );
}
