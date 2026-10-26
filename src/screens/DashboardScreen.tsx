import React, { useMemo } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useTheme } from '../theme/ThemeProvider';
import { elevation, fonts, radius, spacing } from '../theme/tokens';
import { useAppStore } from '../lib/store/useAppStore';
import {
  useAttendance,
  useFees,
  usePoints,
  useStudentContext,
  useSyllabus,
  useTests,
  useTimetable,
} from '../lib/api/hooks';
import {
  AppText,
  Card,
  CenterMark,
  Divider,
  EmptyState,
  HeroCard,
  Pill,
  PressableCard,
  ProgressBar,
  Row,
  SectionHeader,
} from '../components/ui/base';
import { Button } from '../components/ui/Button';
import { Screen } from '../components/ui/Screen';
import { useToast } from '../components/ui/Toast';
import { ContextHeader } from '../components/ContextHeader';
import { MiniRing } from '../components/charts/MiniRing';
import { formatTime, relativeDay, rupees, todayIso, WEEKDAYS_LONG } from '../lib/utils/format';

export function DashboardScreen() {
  const { colors, subject } = useTheme();
  const navigation = useNavigation<any>();
  const ctx = useStudentContext();
  const { stats } = useAttendance();
  const { summary } = useFees();
  const { next, byDay } = useTimetable();
  const { progress } = useSyllabus();
  const { tests } = useTests();
  const points = usePoints();
  const recordCheckIn = useAppStore((s) => s.recordCheckIn);
  const checkIns = useAppStore((s) => s.checkIns);
  const { toast, points: pointsToast } = useToast();

  const now = new Date();
  const today = todayIso(now);
  const dayIndex = now.getDay();
  const todayClasses = useMemo(() => byDay(dayIndex), [byDay, dayIndex]);
  const latestTest = tests.length ? tests[tests.length - 1] : null;

  const greeting = now.getHours() < 12 ? 'Good morning' : now.getHours() < 17 ? 'Good afternoon' : 'Good evening';
  const firstName = ctx.student.name.split(' ')[0];

  const checkIn = (centerId: string, centerName: string) => {
    const res = recordCheckIn(centerId, today);
    if (res.ok) pointsToast(res.points, `Checked in at ${centerName}`);
    else toast(res.message, 'warning');
  };

  const nextCheckedIn = next ? Boolean(checkIns[`${ctx.student.id}:${next.center_id}:${today}`]) : false;

  return (
    <View style={{ flex: 1, backgroundColor: colors.bgApp }}>
      <ContextHeader />
      <Screen>
        {/* ── Hero: identity, honours, momentum ───────────────────────────── */}
        <HeroCard>
          <Row justify="space-between" align="flex-start">
            <View style={{ flex: 1 }}>
              <AppText variant="overline" style={{ color: colors.goldBright }}>
                {greeting.toUpperCase()}
              </AppText>
              <AppText variant="display" style={{ color: '#FDFBF9', marginTop: 4 }}>
                {firstName}
              </AppText>
              <AppText variant="caption" style={{ color: 'rgba(253,251,249,0.62)', marginTop: 2 }}>
                {WEEKDAYS_LONG[dayIndex]} · {ctx.student.board} {ctx.student.class}
              </AppText>
            </View>
            <MiniRing value={stats.rate} size={76} track="rgba(253,251,249,0.18)" color={colors.goldBright} />
          </Row>

          <View
            style={{
              marginTop: spacing.xl,
              flexDirection: 'row',
              borderRadius: radius.md,
              backgroundColor: 'rgba(253,251,249,0.09)',
              paddingVertical: spacing.md,
            }}
          >
            <HeroStat label="Honours" value={points.total.toLocaleString('en-IN')} accent={colors.goldBright} />
            <HeroDivider />
            <HeroStat label="Streak" value={`${ctx.student.streak}d`} />
            <HeroDivider />
            <HeroStat label="Faculties" value={`${ctx.enrolledCenters.length}`} />
          </View>
        </HeroCard>

        {/* ── Up next ─────────────────────────────────────────────────────── */}
        <View style={{ marginTop: spacing.xl }}>
          {next ? (
            <Card level={2}>
              <Row justify="space-between" align="center">
                <AppText variant="overline" tone="muted">
                  {next.dayOffset === 0 ? 'UP NEXT TODAY' : `UP NEXT · ${WEEKDAYS_LONG[(dayIndex + next.dayOffset) % 7].toUpperCase()}`}
                </AppText>
                <View
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: 4,
                    backgroundColor: next.centerColor,
                  }}
                />
              </Row>

              <Row gap={spacing.lg} align="center" style={{ marginTop: spacing.md }}>
                <View style={{ alignItems: 'center' }}>
                  <AppText variant="metricSm">{formatTime(next.start_time).replace(/\s?[AP]M/, '')}</AppText>
                  <AppText variant="overline" tone="muted">
                    {formatTime(next.start_time).includes('AM') ? 'AM' : 'PM'}
                  </AppText>
                </View>
                <View style={{ width: StyleSheet.hairlineWidth, height: 44, backgroundColor: colors.border }} />
                <View style={{ flex: 1 }}>
                  <AppText variant="title">{next.subject}</AppText>
                  <AppText variant="caption" tone="secondary" numberOfLines={1}>
                    {next.teacher}
                  </AppText>
                  <AppText variant="caption" tone="muted" numberOfLines={1}>
                    {next.room} · {next.centerName}
                  </AppText>
                </View>
              </Row>

              <Divider style={{ marginVertical: spacing.lg }} />
              <Row justify="space-between" gap={spacing.md}>
                <AppText variant="caption" tone="muted" style={{ flex: 1 }}>
                  {nextCheckedIn ? 'Attendance confirmed for today.' : 'Scan the classroom code to log attendance.'}
                </AppText>
                <Button
                  label={nextCheckedIn ? 'Checked in' : 'Check in'}
                  iconName={nextCheckedIn ? 'checkmark-circle' : 'qr-code-outline'}
                  size="sm"
                  variant={nextCheckedIn ? 'secondary' : 'primary'}
                  onPress={() => checkIn(next.center_id, next.centerName)}
                />
              </Row>
            </Card>
          ) : (
            <EmptyState
              icon="🗓️"
              title="No classes scheduled"
              message="Join a faculty with its invite code to build your weekly timetable."
            />
          )}
        </View>

        {/* ── Ledger strip ────────────────────────────────────────────────── */}
        <Card style={{ marginTop: spacing.lg }} padded={false}>
          <Row align="stretch">
            <LedgerCell
              label="Attendance"
              value={`${stats.rate.toFixed(0)}%`}
              tint={stats.rate >= 85 ? colors.success : stats.rate >= 70 ? colors.warning : colors.error}
              onPress={() => navigation.navigate('Academics', { screen: 'Attendance' })}
            />
            <LedgerCell
              label="Fees due"
              value={summary.pendingTotal ? rupees(summary.pendingTotal) : 'Clear'}
              tint={summary.overdue.length ? colors.error : summary.pendingTotal ? colors.warning : colors.success}
              onPress={() => navigation.navigate('More', { screen: 'Fees' })}
              divided
            />
            <LedgerCell
              label="Syllabus"
              value={`${progress.coveragePercent.toFixed(0)}%`}
              tint={colors.primary}
              onPress={() => navigation.navigate('Academics', { screen: 'Syllabus' })}
              divided
            />
          </Row>
        </Card>

        {/* ── Fees attention ─────────────────────────────────────────────── */}
        {summary.pendingCount > 0 ? (
          <PressableCard
            style={{ marginTop: spacing.lg }}
            level={1}
            onPress={() => navigation.navigate('More', { screen: 'Fees' })}
          >
            <Row gap={spacing.md} align="center">
              <View
                style={{
                  width: 42,
                  height: 42,
                  borderRadius: 14,
                  backgroundColor: summary.overdue.length ? colors.errorBg : colors.goldSubtle,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Ionicons
                  name={summary.overdue.length ? 'alert-circle-outline' : 'wallet-outline'}
                  size={21}
                  color={summary.overdue.length ? colors.error : colors.gold}
                />
              </View>
              <View style={{ flex: 1 }}>
                <AppText variant="subheading">
                  {summary.overdue.length ? 'Fees overdue' : 'Upcoming fee payment'}
                </AppText>
                <AppText variant="caption" tone="muted" numberOfLines={1}>
                  {summary.nextDue
                    ? `${summary.nextDue.month} · due ${relativeDay(summary.nextDue.due_date, now)}`
                    : `${summary.pendingCount} pending`}
                </AppText>
              </View>
              <AppText
                variant="metricSm"
                style={{ color: summary.overdue.length ? colors.error : colors.gold }}
              >
                {rupees(summary.pendingTotal)}
              </AppText>
            </Row>
          </PressableCard>
        ) : null}

        {/* ── Today's timeline ───────────────────────────────────────────── */}
        <View style={{ marginTop: spacing.xxl }}>
          <SectionHeader
            title="Today"
            subtitle={`${todayClasses.length} session${todayClasses.length === 1 ? '' : 's'}`}
            action="Timetable"
            onAction={() => navigation.navigate('Academics', { screen: 'Timetable' })}
          />
          {todayClasses.length ? (
            <Card padded={false}>
              {todayClasses.map((c, idx) => {
                const tone = subject(c.subject);
                const done = Boolean(checkIns[`${ctx.student.id}:${c.center_id}:${today}`]);
                return (
                  <View key={c.id}>
                    {idx > 0 ? <Divider inset={spacing.lg} /> : null}
                    <Row gap={spacing.md} align="center" style={{ padding: spacing.lg }}>
                      <View style={{ width: 52 }}>
                        <AppText variant="captionStrong">{formatTime(c.start_time)}</AppText>
                        <AppText variant="caption" tone="muted">
                          {formatTime(c.end_time)}
                        </AppText>
                      </View>
                      <View
                        style={{
                          width: 3,
                          alignSelf: 'stretch',
                          minHeight: 34,
                          borderRadius: 2,
                          backgroundColor: tone.base,
                        }}
                      />
                      <View style={{ flex: 1 }}>
                        <AppText variant="subheading" numberOfLines={1}>
                          {c.subject}
                        </AppText>
                        <AppText variant="caption" tone="muted" numberOfLines={1}>
                          {c.teacher} · {c.centerName}
                        </AppText>
                      </View>
                      {done ? (
                        <Ionicons name="checkmark-circle" size={21} color={colors.success} />
                      ) : (
                        <Button label="+10" size="sm" variant="secondary" onPress={() => checkIn(c.center_id, c.centerName)} />
                      )}
                    </Row>
                  </View>
                );
              })}
            </Card>
          ) : (
            <EmptyState
              icon="🫖"
              title="No classes today"
              message="A good window for the Focus Room or a revision pass."
            />
          )}
        </View>

        {/* ── Latest result ──────────────────────────────────────────────── */}
        {latestTest ? (
          <View style={{ marginTop: spacing.xxl }}>
            <SectionHeader
              title="Latest result"
              subtitle={latestTest.subject}
              action="All tests"
              onAction={() => navigation.navigate('Academics', { screen: 'Tests' })}
            />
            <Card level={1}>
              <Row justify="space-between" align="flex-start" gap={spacing.lg}>
                <View style={{ flex: 1 }}>
                  <AppText variant="subheading">{latestTest.name}</AppText>
                  <AppText variant="caption" tone="muted" style={{ marginTop: 2 }}>
                    {relativeDay(latestTest.date, now)} · {latestTest.duration_min} min
                  </AppText>
                  {latestTest.weak_topics.length ? (
                    <Row gap={5} wrap style={{ marginTop: spacing.md }}>
                      {latestTest.weak_topics.map((w) => (
                        <Pill key={w} label={w} tone="warning" />
                      ))}
                    </Row>
                  ) : null}
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                  <Row gap={1} align="flex-end">
                    <AppText variant="metric" tone="primary">
                      {latestTest.marks_obtained}
                    </AppText>
                    <AppText variant="caption" tone="muted" style={{ marginBottom: 6 }}>
                      /{latestTest.total_marks}
                    </AppText>
                  </Row>
                  <Pill
                    label={`${((latestTest.marks_obtained / latestTest.total_marks) * 100).toFixed(0)}%`}
                    tone="success"
                  />
                </View>
              </Row>
            </Card>
          </View>
        ) : null}

        {/* ── Study tools ────────────────────────────────────────────────── */}
        <View style={{ marginTop: spacing.xxl }}>
          <SectionHeader title="Study tools" subtitle="Open to every Vilarci student" />
          <Row gap={spacing.sm} wrap>
            <ToolTile
              iconName="flask-outline"
              label="STEM Labs"
              hint="Virtual experiments"
              onPress={() => navigation.navigate('Learn', { screen: 'Labs' })}
            />
            <ToolTile
              iconName="timer-outline"
              label="Focus Room"
              hint="+25 per session"
              onPress={() => navigation.navigate('Learn', { screen: 'Focus' })}
            />
            <ToolTile
              iconName="play-circle-outline"
              label="Lessons"
              hint="Faculty videos"
              onPress={() => navigation.navigate('Learn', { screen: 'Videos' })}
            />
            <ToolTile
              iconName="help-circle-outline"
              label="Practice"
              hint="+30 above 80%"
              onPress={() => navigation.navigate('Learn', { screen: 'Practice' })}
            />
          </Row>
        </View>

        {/* ── Faculties ──────────────────────────────────────────────────── */}
        <View style={{ marginTop: spacing.xxl }}>
          <SectionHeader
            title="My faculties"
            subtitle={`${ctx.enrolledCenters.length} linked to this profile`}
          />
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ gap: spacing.sm, paddingRight: spacing.lg, paddingVertical: 2 }}
          >
            {ctx.enrolledCenters.map((c) => (
              <Card key={c.id} style={{ width: 252 }}>
                <Row gap={spacing.md} align="center">
                  <CenterMark text={c.logo_text} color={c.color} size={38} />
                  <View style={{ flex: 1 }}>
                    <AppText variant="subheading" numberOfLines={1}>
                      {c.name}
                    </AppText>
                    <AppText variant="caption" tone="muted" numberOfLines={1}>
                      {c.type}
                    </AppText>
                  </View>
                </Row>
                <AppText variant="caption" tone="secondary" style={{ marginTop: spacing.md }} numberOfLines={2}>
                  {c.tagline}
                </AppText>
                <Divider style={{ marginVertical: spacing.md }} />
                <AppText variant="caption" tone="muted" numberOfLines={1}>
                  {c.teacher_name}
                </AppText>
                <Row gap={5} wrap style={{ marginTop: spacing.sm }}>
                  {c.subjects.map((s) => (
                    <Pill key={s} label={s} tone="neutral" />
                  ))}
                  <Pill label={`${rupees(c.monthly_fee)}/mo`} tone="gold" />
                </Row>
              </Card>
            ))}
          </ScrollView>
        </View>

        {/* ── Momentum footer ────────────────────────────────────────────── */}
        <Card style={{ marginTop: spacing.xxl }} muted>
          <AppText variant="overline" tone="muted">
            THIS WEEK
          </AppText>
          <Row justify="space-between" style={{ marginTop: spacing.sm, marginBottom: 6 }}>
            <AppText variant="captionStrong">Revision progress</AppText>
            <AppText variant="caption" tone="muted">
              {progress.revisedPercent.toFixed(0)}% of topics
            </AppText>
          </Row>
          <ProgressBar value={progress.revisedPercent} gradient={colors.goldGradient} height={7} />
          <AppText variant="caption" tone="muted" style={{ marginTop: spacing.md }}>
            Logging a revision in the Curriculum tracker earns 15 honours points per topic.
          </AppText>
        </Card>
      </Screen>
    </View>
  );
}

// ─── Local pieces ─────────────────────────────────────────────────────────────

function HeroStat({ label, value, accent }: { label: string; value: string; accent?: string }) {
  return (
    <View style={{ flex: 1, alignItems: 'center' }}>
      <AppText variant="metricSm" style={{ color: accent ?? '#FDFBF9' }}>
        {value}
      </AppText>
      <AppText variant="overline" style={{ color: 'rgba(253,251,249,0.55)', marginTop: 1 }}>
        {label.toUpperCase()}
      </AppText>
    </View>
  );
}

function HeroDivider() {
  return <View style={{ width: StyleSheet.hairlineWidth, backgroundColor: 'rgba(253,251,249,0.2)' }} />;
}

function LedgerCell({
  label,
  value,
  tint,
  onPress,
  divided,
}: {
  label: string;
  value: string;
  tint: string;
  onPress: () => void;
  divided?: boolean;
}) {
  const { colors } = useTheme();
  return (
    <>
      {divided ? <View style={{ width: StyleSheet.hairlineWidth, backgroundColor: colors.border }} /> : null}
      <Pressable
        onPress={onPress}
        style={({ pressed }) => [
          { flex: 1, paddingVertical: spacing.lg, alignItems: 'center', opacity: pressed ? 0.6 : 1 },
        ]}
      >
        <AppText variant="metricSm" style={{ color: tint }}>
          {value}
        </AppText>
        <AppText variant="overline" tone="muted" style={{ marginTop: 2 }}>
          {label.toUpperCase()}
        </AppText>
      </Pressable>
    </>
  );
}

function ToolTile({
  iconName,
  label,
  hint,
  onPress,
}: {
  iconName: React.ComponentProps<typeof Ionicons>['name'];
  label: string;
  hint: string;
  onPress: () => void;
}) {
  const { colors } = useTheme();
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        {
          width: '48.4%',
          borderRadius: radius.lg,
          backgroundColor: colors.surface,
          borderWidth: StyleSheet.hairlineWidth,
          borderColor: colors.border,
          padding: spacing.lg,
          opacity: pressed ? 0.85 : 1,
        },
        elevation(1, colors.shadowColor, colors.shadowOpacity),
      ]}
    >
      <LinearGradient
        colors={colors.primaryGradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{ width: 38, height: 38, borderRadius: 13, alignItems: 'center', justifyContent: 'center' }}
      >
        <Ionicons name={iconName} size={19} color="#fff" />
      </LinearGradient>
      <AppText variant="subheading" style={{ marginTop: spacing.md }}>
        {label}
      </AppText>
      <AppText variant="caption" tone="muted" numberOfLines={1}>
        {hint}
      </AppText>
    </Pressable>
  );
}

export const dashboardFonts = fonts;
