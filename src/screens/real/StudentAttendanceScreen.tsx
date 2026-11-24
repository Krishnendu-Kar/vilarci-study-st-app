import React, { useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useTheme } from '../../theme/ThemeProvider';
import { radius, spacing } from '../../theme/tokens';
import { Membership, useMemberships } from '../../lib/api/batches';
import { useStudentAttendance } from '../../lib/api/attendance';
import type { BatchMonth, EnrolmentMonth } from '../../lib/local/types';
import { useRefresh } from '../../lib/sync/useRefresh';
import { useActiveStudent } from '../../lib/store/useActiveStudent';
import { addMonths, monthLabel, monthsBetween } from '../../lib/utils/months';
import {
  classDaysOfMonth,
  localToday,
  LOW_ATTENDANCE,
  Mark,
  MARK_LABEL,
  markOf,
  monthOf,
  percentLabel,
  prettyTime,
  Tally,
  tally,
  weekdayShort,
} from '../../lib/utils/attendance';
import { AppText, Card, EmptyState, HeroCard, Pill, PillTone, Row, SectionHeader } from '../../components/ui/base';
import { Button } from '../../components/ui/Button';
import { Pager } from '../../components/ui/Pager';
import { Screen } from '../../components/ui/Screen';
import { RealTopBar } from '../../components/real/RealTopBar';

const MARK_TONE: Record<Mark, PillTone> = { P: 'success', L: 'gold', A: 'error' };

/**
 * The active student's attendance. From a batch (or with one batch) it shows
 * that batch, one month per page (swipe; the months on each side are built
 * ahead); from the menu with several batches, a card per batch.
 */
export function StudentAttendanceScreen() {
  const { colors } = useTheme();
  const navigation = useNavigation<any>();
  const onlyId: string | undefined = useRoute<any>().params?.membershipId;
  const { active } = useActiveStudent();
  const { memberships, isLoading } = useMemberships();
  const { refreshing, refresh } = useRefresh();

  const joined = memberships.filter(
    (m) => m.student_id === active?.id && m.status === 'approved' && (!onlyId || m.id === onlyId),
  );
  const single = active && !isLoading && joined.length === 1 ? joined[0] : null;

  return (
    <View style={{ flex: 1, backgroundColor: colors.bgApp }}>
      <RealTopBar
        title="Attendance"
        subtitle={single ? single.batch_name : active ? `${active.first_name}'s batches` : undefined}
      />
      {single ? (
        // Each month is its own page (with its own pull-to-refresh).
        <BatchAttendance m={single} />
      ) : (
        <Screen refreshing={refreshing} onRefresh={refresh}>
          {!active ? (
            <EmptyState icon="people-outline" title="Add a student first" message="Attendance is kept per student profile." />
          ) : isLoading ? (
            <ActivityIndicator color={colors.primary} style={{ marginTop: spacing.xxl }} />
          ) : !joined.length ? (
            <View>
              <EmptyState
                icon="checkmark-done-outline"
                title={`No attendance for ${active.first_name} yet`}
                message="It shows here once a teacher accepts the join request and starts marking classes."
              />
              <Button
                label="Join a batch"
                iconName="enter-outline"
                fullWidth
                onPress={() => navigation.navigate('JoinBatch', { studentId: active.id })}
                style={{ marginTop: spacing.md }}
              />
            </View>
          ) : (
            <View style={{ gap: spacing.md }}>
              {joined.map((m) => (
                <BatchSummaryCard key={m.id} m={m} onPress={() => navigation.push('StudentAttendance', { membershipId: m.id })} />
              ))}
            </View>
          )}
        </Screen>
      )}
    </View>
  );
}

/** One batch in the "all batches" list. */
function BatchSummaryCard({ m, onPress }: { m: Membership; onPress: () => void }) {
  const { colors } = useTheme();
  const { overall, thisMonth } = useStudentAttendance(m);
  const low = overall.percent != null && overall.percent < LOW_ATTENDANCE;
  return (
    <Pressable onPress={onPress} accessibilityRole="button" style={({ pressed }) => ({ opacity: pressed ? 0.85 : 1 })}>
      <Card>
        <Row gap={spacing.md}>
          <View style={{ flex: 1 }}>
            <AppText variant="subheading" numberOfLines={1}>
              {m.batch_name}
            </AppText>
            <AppText variant="caption" tone="muted" numberOfLines={1}>
              {overall.held
                ? `This month ${percentLabel(thisMonth.percent)} · ${overall.held} class${overall.held === 1 ? '' : 'es'} so far`
                : 'No classes marked yet'}
            </AppText>
          </View>
          <AppText variant="metricSm" style={{ color: low ? colors.error : overall.percent == null ? colors.textMuted : colors.success }}>
            {percentLabel(overall.percent)}
          </AppText>
          <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
        </Row>
      </Card>
    </Pressable>
  );
}

/** One batch, a month per page: from the month the student joined to this month. */
function BatchAttendance({ m }: { m: Membership }) {
  const { overall, start, batchMonths, months } = useStudentAttendance(m);
  const today = localToday();
  const thisMonth = monthOf(today);
  const first = start ? monthOf(start) : thisMonth;
  const [month, setMonth] = useState(thisMonth);
  const pages = useMemo(() => monthsBetween(first <= thisMonth ? first : thisMonth, thisMonth), [first, thisMonth]);

  return (
    <Pager
      pages={pages}
      current={month}
      onChange={setMonth}
      preload={2}
      renderPage={(mo) => (
        <MonthPage
          m={m}
          month={mo}
          first={pages[0]}
          last={thisMonth}
          today={today}
          start={start}
          overall={overall}
          batchMonths={batchMonths}
          months={months}
          onMonth={setMonth}
        />
      )}
    />
  );
}

/** Overall numbers, then one month's class days with the student's mark on each. */
function MonthPage({
  m,
  month,
  first,
  last,
  today,
  start,
  overall,
  batchMonths,
  months,
  onMonth,
}: {
  m: Membership;
  month: string;
  first: string;
  last: string;
  today: string;
  start: string | null;
  overall: Tally;
  batchMonths: Record<string, BatchMonth>;
  months: Record<string, EnrolmentMonth>;
  onMonth: (month: string) => void;
}) {
  const { colors } = useTheme();
  const { refreshing, refresh } = useRefresh();

  // Only days the teacher recorded, from the day the student joined: held up to today, and cancellations (even ahead, so parents know).
  const days = useMemo(
    () =>
      classDaysOfMonth(month, m.weekly_schedule, batchMonths[month], today, { start: m.course_start, end: m.course_end }).filter(
        (d) => start && d.date >= start && ((d.state === 'held' && d.date <= today) || d.state === 'cancelled'),
      ),
    [month, m.weekly_schedule, m.course_start, m.course_end, batchMonths, today, start],
  );
  const monthTally = tally(batchMonths, months, start, today, month);
  const low = overall.percent != null && overall.percent < LOW_ATTENDANCE;
  const remark = months[month]?.remark?.trim();

  return (
    <Screen refreshing={refreshing} onRefresh={refresh}>
      <HeroCard>
        <AppText variant="overline" numberOfLines={1} style={{ color: colors.goldBright }}>
          {m.batch_name.toUpperCase()}
        </AppText>
        <Row gap={spacing.sm} align="flex-end" style={{ marginTop: 2 }}>
          <AppText variant="metric" style={{ color: low ? '#FFD7D2' : '#FDFBF9' }}>
            {percentLabel(overall.percent)}
          </AppText>
          <AppText variant="caption" style={{ color: 'rgba(253,251,249,0.75)', marginBottom: 6 }}>
            attendance
          </AppText>
        </Row>
        <AppText variant="caption" style={{ color: 'rgba(253,251,249,0.75)' }}>
          {overall.held
            ? `Came to ${overall.attended} of ${overall.held} class${overall.held === 1 ? '' : 'es'}${start ? ` since ${monthLabel(monthOf(start))}` : ''}`
            : 'No classes marked yet'}
        </AppText>
        <Row style={{ marginTop: spacing.md }} gap={spacing.xl}>
          <HeroStat value={overall.present} label="PRESENT" />
          <HeroStat value={overall.late} label="LATE" />
          <HeroStat value={overall.absent} label="ABSENT" warn={overall.absent > 0} />
        </Row>
        {low ? (
          <AppText variant="captionStrong" style={{ color: '#FFD7D2', marginTop: spacing.sm }}>
            Below {LOW_ATTENDANCE}% — worth a word with the teacher.
          </AppText>
        ) : null}
      </HeroCard>

      {/* ── Month ─────────────────────────────────────────────────────── */}
      <View style={[styles.stepper, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <Step icon="chevron-back" label="Previous month" disabled={month <= first} onPress={() => onMonth(addMonths(month, -1))} />
        <View style={{ flex: 1, alignItems: 'center' }}>
          <AppText variant="subheading">{monthLabel(month)}</AppText>
          <AppText variant="caption" tone="muted">
            {monthTally.held
              ? `${percentLabel(monthTally.percent)} · ${monthTally.held} class${monthTally.held === 1 ? '' : 'es'}`
              : 'No classes held'}
          </AppText>
        </View>
        <Step icon="chevron-forward" label="Next month" disabled={month >= last} onPress={() => onMonth(addMonths(month, 1))} />
      </View>

      {/* ── The teacher's remark for this month ─────────────────────────── */}
      {remark ? (
        <Card style={{ marginTop: spacing.lg }} accentColor={colors.primary}>
          <Row gap={spacing.sm}>
            <Ionicons name="chatbox-ellipses-outline" size={16} color={colors.primary} />
            <AppText variant="overline" tone="primary">
              FROM THE TEACHER · {monthLabel(month).toUpperCase()}
            </AppText>
          </Row>
          <AppText variant="body" selectable style={{ marginTop: spacing.sm }}>
            {remark}
          </AppText>
        </Card>
      ) : null}

      <View style={{ marginTop: spacing.lg }}>
        <SectionHeader title="Class days" subtitle={monthTally.held ? `Absent ${monthTally.absent} · Late ${monthTally.late}` : undefined} />
        {days.length ? (
          <Card padded={false}>
            {days.map((d, i) => {
              const mark = d.state === 'held' ? markOf(months[month], d.date) : null;
              return (
                <Row
                  key={d.date}
                  gap={spacing.md}
                  style={[
                    styles.row,
                    { borderTopWidth: i ? StyleSheet.hairlineWidth : 0, borderTopColor: colors.border },
                    d.date === today ? { backgroundColor: colors.primarySubtle } : null,
                  ]}
                >
                  <View style={styles.dateCol}>
                    <AppText variant="subheading">{Number(d.date.slice(8))}</AppText>
                    <AppText variant="caption" tone="muted">
                      {weekdayShort(d.date)}
                    </AppText>
                  </View>
                  <View style={{ flex: 1 }}>
                    <AppText variant="bodyStrong" numberOfLines={1}>
                      {d.extra ? 'Extra class' : prettyTime(d.time) || 'Class'}
                    </AppText>
                    {d.note || (d.extra && d.time) ? (
                      <AppText variant="caption" tone="muted" numberOfLines={1}>
                        {d.note ?? prettyTime(d.time)}
                      </AppText>
                    ) : null}
                  </View>
                  {mark ? <Pill label={MARK_LABEL[mark]} tone={MARK_TONE[mark]} /> : <Pill label="Cancelled" tone="neutral" />}
                </Row>
              );
            })}
          </Card>
        ) : (
          <Card muted>
            <AppText variant="caption" tone="muted">
              {month === last ? 'No classes marked this month yet.' : 'No classes were held this month.'}
            </AppText>
          </Card>
        )}
        <AppText variant="caption" tone="muted" style={{ marginTop: spacing.sm }}>
          The teacher marks attendance after each class. Late counts as present. Swipe left or right to change month.
        </AppText>
      </View>
    </Screen>
  );
}

function Step({
  icon,
  label,
  disabled,
  onPress,
}: {
  icon: 'chevron-back' | 'chevron-forward';
  label: string;
  disabled: boolean;
  onPress: () => void;
}) {
  const { colors } = useTheme();
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      hitSlop={8}
      accessibilityRole="button"
      accessibilityLabel={label}
      style={({ pressed }) => [styles.step, { backgroundColor: colors.surfaceMuted, opacity: disabled ? 0.3 : pressed ? 0.6 : 1 }]}
    >
      <Ionicons name={icon} size={18} color={colors.textMain} />
    </Pressable>
  );
}

function HeroStat({ value, label, warn }: { value: number; label: string; warn?: boolean }) {
  const { colors } = useTheme();
  return (
    <View>
      <AppText variant="metricSm" style={{ color: warn ? '#FFD7D2' : '#FDFBF9' }}>
        {value}
      </AppText>
      <AppText variant="overline" style={{ color: colors.goldBright }}>
        {label}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  stepper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    padding: spacing.sm,
    marginTop: spacing.xl,
    borderRadius: radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
  },
  step: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  row: { paddingVertical: spacing.md, paddingHorizontal: spacing.lg },
  dateCol: { width: 38, alignItems: 'center' },
});
