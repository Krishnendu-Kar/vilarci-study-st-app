import React, { useState } from 'react';
import { Pressable, Share, StyleSheet, View } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useTheme } from '../../theme/ThemeProvider';
import { radius, spacing } from '../../theme/tokens';
import { describeLeaveError, joinLinkFor, useLeaveBatch, useMemberships } from '../../lib/api/batches';
import { useStudentNotices } from '../../lib/api/notices';
import { buildLedger, useEnrolmentMonths } from '../../lib/api/batchFees';
import { latestRemark, useStudentAttendance } from '../../lib/api/attendance';
import { useStudentTests } from '../../lib/api/tests';
import { LOW_ATTENDANCE, percentLabel } from '../../lib/utils/attendance';
import { useLocalStore } from '../../lib/local/store';
import { useRefresh } from '../../lib/sync/useRefresh';
import { courseLabel, monthLabel } from '../../lib/utils/months';
import { money } from '../../lib/utils/format';
import { DAY_KEYS, DAY_NAMES, todayKey } from '../../lib/utils/timetable';
import { AppText, Card, Divider, EmptyState, HeroCard, IconBubble, IconName, Pill, Row, SectionHeader } from '../../components/ui/base';
import { Screen } from '../../components/ui/Screen';
import { ConfirmSheet } from '../../components/ui/ConfirmSheet';
import { Sheet } from '../../components/ui/Sheet';
import { useToast } from '../../components/ui/Toast';
import { HeaderIconButton, StackHeader } from '../../components/real/StackHeader';
import { NoticeCard } from '../../components/real/NoticeCard';

/**
 * One batch the student has joined: what it is, its sections (Fees and
 * Attendance live, the rest coming soon), the week's classes, notices and the teacher. Everything
 * comes from the phone's copy.
 */
export function BatchDetailScreen() {
  const { colors } = useTheme();
  const navigation = useNavigation<any>();
  const membershipId: string | undefined = useRoute<any>().params?.membershipId;
  const { memberships } = useMemberships();
  const monthsByEnrolment = useEnrolmentMonths();
  const { refreshing, refresh } = useRefresh();

  const m = memberships.find((x) => x.id === membershipId);
  const batch = useLocalStore((s) => (m ? s.batches[m.batch_id] : undefined));
  // The active student's notices for this batch. They count as seen once the
  // Notices screen is opened (from the 📣 icon or "See all"), not here.
  const { items: notices } = useStudentNotices(m?.batch_id ?? '-');
  const newNotices = notices.filter((n) => n.isNew).length;
  const { overall, months: studentMonths } = useStudentAttendance(m);
  const remark = latestRemark(studentMonths);
  const results = useStudentTests(m);
  const toast = useToast();
  const leave = useLeaveBatch();
  const [confirmLeave, setConfirmLeave] = useState(false);
  const [menu, setMenu] = useState(false);

  if (!m) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.bgApp }}>
        <StackHeader title="Batch" />
        <Screen>
          <EmptyState icon="school-outline" title="Batch not found" message="This batch is no longer on this phone." />
        </Screen>
      </View>
    );
  }

  const ledger =
    m.course_start && m.course_end ? buildLedger(m.course_start, m.course_end, monthsByEnrolment[m.id], m.monthly_fee ?? 0) : null;
  const feeLine = !ledger ? 'Not set yet' : ledger.dueAmount ? `${money(ledger.dueAmount)} due` : 'Nothing due';
  const course = courseLabel(m.course_start, m.course_end);
  const today = todayKey();
  const teacher = batch?.teacher_card;

  const soon = (title: string, icon: IconName) => () => navigation.navigate('ComingSoon', { title, icon });
  const openNotices = () => navigation.navigate('StudentNotices', { batchId: m.batch_id, batchName: m.batch_name });

  /** Close the menu, then go — after its slide-out, so two sheets never overlap (iOS refuses that). */
  const fromMenu = (go: () => void) => () => {
    setMenu(false);
    setTimeout(go, 300);
  };

  const shareLink = () => {
    if (!m.join_code) return;
    Share.share({
      message:
        `Join ${m.batch_name} (${m.subject})${m.teacher_name ? ` with ${m.teacher_name}` : ''} on Vilarci Study.\n\n` +
        `Tap to join: ${joinLinkFor(m.join_code)}\nJoin code: ${m.join_code}`,
    }).catch(() => {});
  };

  const doLeave = async () => {
    try {
      await leave.mutateAsync(m.id);
      toast.toast(`Left ${m.batch_name}`, 'info');
      navigation.goBack();
    } catch (err) {
      toast.toast(describeLeaveError(err), 'error');
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.bgApp }}>
      <StackHeader
        title={m.batch_name}
        right={
          <>
            <HeaderIconButton icon="megaphone-outline" label="Notices" badge={newNotices} tilt={-15} onPress={openNotices} />
            <HeaderIconButton icon="ellipsis-vertical" label="Batch options" onPress={() => setMenu(true)} />
          </>
        }
      />
      <Screen refreshing={refreshing} onRefresh={refresh}>
        {/* ── What this batch is ─────────────────────────────────────── */}
        <HeroCard>
          <AppText variant="overline" style={{ color: colors.goldBright }}>
            {[m.subject, m.grade, m.board].filter(Boolean).join(' · ').toUpperCase()}
          </AppText>
          <AppText variant="display" numberOfLines={2} style={{ color: '#FDFBF9', marginTop: 2 }}>
            {m.batch_name}
          </AppText>
          <View style={{ marginTop: spacing.md, gap: 6 }}>
            <HeroLine
              icon="person-outline"
              text={m.joined_month ? `${m.student_name} · joined ${monthLabel(m.joined_month)}` : m.student_name}
            />
            {m.teacher_name ? <HeroLine icon="school-outline" text={`Teacher · ${m.teacher_name}`} /> : null}
            {course ? <HeroLine icon="calendar-outline" text={course} /> : null}
            {m.room ? <HeroLine icon="location-outline" text={m.room} /> : null}
          </View>
        </HeroCard>

        {/* ── The teacher's latest remark ────────────────────────────── */}
        {remark ? (
          <Pressable
            onPress={() => navigation.navigate('StudentAttendance', { membershipId: m.id })}
            accessibilityRole="button"
            style={({ pressed }) => ({ marginTop: spacing.lg, opacity: pressed ? 0.85 : 1 })}
          >
            <Card accentColor={colors.primary}>
              <Row gap={spacing.sm}>
                <Ionicons name="chatbox-ellipses-outline" size={16} color={colors.primary} />
                <AppText variant="overline" tone="primary" style={{ flex: 1 }}>
                  FROM THE TEACHER · {monthLabel(remark.month).toUpperCase()}
                </AppText>
              </Row>
              <AppText variant="body" numberOfLines={4} style={{ marginTop: spacing.sm }}>
                {remark.text}
              </AppText>
            </Card>
          </Pressable>
        ) : null}

        {/* ── Sections ───────────────────────────────────────────────── */}
        <View style={styles.grid}>
          <Tile
            icon="wallet-outline"
            title="Fees"
            line={feeLine}
            lineTone={ledger?.dueAmount ? 'error' : 'muted'}
            onPress={() => navigation.navigate('BatchFees', { membershipId: m.id })}
          />
          <Tile
            icon="checkmark-done-outline"
            title="Attendance"
            line={overall.held ? `${percentLabel(overall.percent)} · ${overall.held} class${overall.held === 1 ? '' : 'es'}` : 'No classes yet'}
            lineTone={overall.percent != null && overall.percent < LOW_ATTENDANCE ? 'error' : 'muted'}
            onPress={() => navigation.navigate('StudentAttendance', { membershipId: m.id })}
          />
          <Tile
            icon="document-text-outline"
            title="Tests & Results"
            line={results.average != null ? `Avg ${results.average}% · ${results.marked} test${results.marked === 1 ? '' : 's'}` : results.results.length ? 'Not marked yet' : 'No tests yet'}
            onPress={() => navigation.navigate('StudentTests', { membershipId: m.id })}
          />
          <Tile icon="book-outline" title="Syllabus" soon onPress={soon('Syllabus', 'book-outline')} />
        </View>

        {/* ── Week ───────────────────────────────────────────────────── */}
        <View style={{ marginTop: spacing.xxl }}>
          <SectionHeader title="Classes every week" />
          <Card padded={false}>
            {DAY_KEYS.map((d, i) => {
              const v = m.weekly_schedule?.[d]?.trim();
              const closed = !v || v.toLowerCase() === 'closed';
              const isToday = d === today;
              return (
                <Row
                  key={d}
                  justify="space-between"
                  style={{
                    paddingVertical: 10,
                    paddingHorizontal: spacing.lg,
                    borderTopWidth: i ? StyleSheet.hairlineWidth : 0,
                    borderTopColor: colors.border,
                    backgroundColor: isToday ? colors.primarySubtle : 'transparent',
                  }}
                >
                  <AppText variant={isToday ? 'bodyStrong' : 'body'} style={{ color: isToday ? colors.primary : colors.textMain }}>
                    {DAY_NAMES[d]}
                    {isToday ? ' · Today' : ''}
                  </AppText>
                  <AppText variant={closed ? 'caption' : 'bodyStrong'} tone={closed ? 'muted' : undefined}>
                    {closed ? 'No class' : v}
                  </AppText>
                </Row>
              );
            })}
          </Card>
        </View>

        {/* ── Notices ────────────────────────────────────────────────── */}
        <View style={{ marginTop: spacing.xxl }}>
          <SectionHeader
            title="Notices"
            subtitle={newNotices ? `${newNotices} new` : notices.length > 3 ? `${notices.length} notices` : undefined}
            action={notices.length ? 'See all' : undefined}
            onAction={openNotices}
          />
          {notices.length ? (
            <View style={{ gap: spacing.sm }}>
              {notices.slice(0, 3).map((n) => (
                <Pressable
                  key={n.id}
                  onPress={openNotices}
                  accessibilityRole="button"
                  style={({ pressed }) => ({ opacity: pressed ? 0.85 : 1 })}
                >
                  <NoticeCard notice={n} isNew={n.isNew} lines={4} />
                </Pressable>
              ))}
            </View>
          ) : (
            <Card muted>
              <AppText variant="caption" tone="muted">
                No notices from the teacher yet.
              </AppText>
            </Card>
          )}
        </View>

        {/* ── Teacher ────────────────────────────────────────────────── */}
        {teacher?.name ? (
          <View style={{ marginTop: spacing.xxl }}>
            <SectionHeader title="Teacher" />
            <Card>
              <AppText variant="subheading">{teacher.name}</AppText>
              <AppText variant="caption" tone="muted">
                {[
                  teacher.qualification,
                  teacher.subject,
                  teacher.experience_years != null ? `${teacher.experience_years} yrs experience` : null,
                ]
                  .filter(Boolean)
                  .join(' · ')}
              </AppText>
              {teacher.achievements?.length ? (
                <View style={{ marginTop: spacing.sm, gap: 4 }}>
                  {teacher.achievements.map((a, i) => (
                    <Row key={i} gap={6} align="flex-start">
                      <Ionicons name="ribbon-outline" size={13} color={colors.gold} style={{ marginTop: 3 }} />
                      <AppText variant="caption" tone="secondary" style={{ flex: 1 }}>
                        {a}
                      </AppText>
                    </Row>
                  ))}
                </View>
              ) : null}
            </Card>
          </View>
        ) : null}
      </Screen>

      {/* ── ⋮ menu ─────────────────────────────────────────────────────── */}
      <Sheet visible={menu} onClose={() => setMenu(false)} title={m.batch_name} subtitle={[m.subject, m.grade, m.board].filter(Boolean).join(' · ')}>
        <View style={{ paddingBottom: spacing.md }}>
          <MenuRow
            icon="person-add-outline"
            title="Add students"
            subtitle="Invite a friend: QR code, link and join code"
            onPress={fromMenu(() => navigation.navigate('BatchInvite', { membershipId: m.id }))}
          />
          <MenuRow
            icon="information-circle-outline"
            title="Batch info"
            subtitle="Teacher, fee, course, room and timetable"
            onPress={fromMenu(() => navigation.navigate('BatchInfo', { membershipId: m.id }))}
          />
          <MenuRow
            icon="checkmark-done-outline"
            title="Attendance"
            subtitle={overall.held ? `${percentLabel(overall.percent)} so far` : 'No classes marked yet'}
            onPress={fromMenu(() => navigation.navigate('StudentAttendance', { membershipId: m.id }))}
          />
          <MenuRow
            icon="document-text-outline"
            title="Tests & Results"
            subtitle={results.average != null ? `Average ${results.average}%` : 'No marks yet'}
            onPress={fromMenu(() => navigation.navigate('StudentTests', { membershipId: m.id }))}
          />
          <MenuRow
            icon="wallet-outline"
            title="Fees"
            subtitle={feeLine}
            onPress={fromMenu(() => navigation.navigate('BatchFees', { membershipId: m.id }))}
          />
          <MenuRow
            icon="megaphone-outline"
            title="Notices"
            subtitle={newNotices ? `${newNotices} new` : notices.length ? `${notices.length} from the teacher` : 'None yet'}
            onPress={fromMenu(openNotices)}
          />
          {m.join_code ? <MenuRow icon="share-social-outline" title="Share join link" onPress={fromMenu(shareLink)} /> : null}
          {m.status === 'approved' ? (
            <>
              <Divider style={{ marginVertical: spacing.sm }} />
              <MenuRow
                icon="exit-outline"
                title="Leave batch"
                subtitle="The teacher keeps the history · needs the internet"
                danger
                onPress={fromMenu(() => setConfirmLeave(true))}
              />
            </>
          ) : null}
        </View>
      </Sheet>

      <ConfirmSheet
        visible={confirmLeave}
        title={`Take ${m.student_name.split(' ')[0]} out of ${m.batch_name}?`}
        message={
          'The teacher stops seeing your number and the batch leaves this app. ' +
          'Attendance and fees so far stay with the teacher. You can join again later with the same code. Needs the internet.'
        }
        confirmLabel="Leave"
        confirmIcon="exit-outline"
        onClose={() => setConfirmLeave(false)}
        onConfirm={doLeave}
      />
    </View>
  );
}

function MenuRow({
  icon,
  title,
  subtitle,
  danger,
  onPress,
}: {
  icon: IconName;
  title: string;
  subtitle?: string;
  danger?: boolean;
  onPress: () => void;
}) {
  const { colors } = useTheme();
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      style={({ pressed }) => [styles.menuRow, { backgroundColor: pressed ? colors.surfaceMuted : 'transparent' }]}
    >
      <View style={[styles.menuIcon, { backgroundColor: danger ? colors.errorBg : colors.primarySubtle }]}>
        <Ionicons name={icon} size={18} color={danger ? colors.error : colors.primary} />
      </View>
      <View style={{ flex: 1 }}>
        <AppText variant="bodyStrong" style={{ color: danger ? colors.error : colors.textMain }}>
          {title}
        </AppText>
        {subtitle ? (
          <AppText variant="caption" tone="muted" numberOfLines={1}>
            {subtitle}
          </AppText>
        ) : null}
      </View>
      {danger ? null : <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />}
    </Pressable>
  );
}

function HeroLine({ icon, text }: { icon: IconName; text: string }) {
  return (
    <Row gap={6}>
      <Ionicons name={icon} size={14} color="rgba(253,251,249,0.7)" />
      <AppText variant="caption" numberOfLines={1} style={{ color: 'rgba(253,251,249,0.85)', flex: 1 }}>
        {text}
      </AppText>
    </Row>
  );
}

/** One section of the batch; `soon` ones open the Coming soon screen. */
function Tile({
  icon,
  title,
  line,
  lineTone = 'muted',
  soon,
  onPress,
}: {
  icon: IconName;
  title: string;
  line?: string;
  lineTone?: 'muted' | 'error';
  soon?: boolean;
  onPress: () => void;
}) {
  const { colors } = useTheme();
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={soon ? `${title}, coming soon` : title}
      style={({ pressed }) => [
        styles.tile,
        { backgroundColor: colors.surface, borderColor: colors.border, opacity: pressed ? 0.85 : 1 },
      ]}
    >
      <Row justify="space-between" align="flex-start">
        <IconBubble
          name={icon}
          size={36}
          tint={soon ? colors.textMuted : colors.primary}
          bg={soon ? colors.surfaceMuted : colors.primarySubtle}
        />
        {soon ? <Pill label="Soon" tone="neutral" /> : <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />}
      </Row>
      <AppText variant="bodyStrong" numberOfLines={1} style={{ marginTop: spacing.sm, color: soon ? colors.textSecondary : colors.textMain }}>
        {title}
      </AppText>
      <AppText variant="caption" tone={soon ? 'muted' : lineTone} numberOfLines={1}>
        {soon ? 'Coming soon' : line}
      </AppText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md, marginTop: spacing.xl },
  tile: {
    flexBasis: '47%',
    flexGrow: 1,
    padding: spacing.md,
    borderRadius: radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
  },
  menuRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.sm,
    borderRadius: radius.md,
  },
  menuIcon: { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center' },
});
