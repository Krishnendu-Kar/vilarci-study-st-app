import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useTheme } from '../../theme/ThemeProvider';
import { radius, spacing } from '../../theme/tokens';
import { useMemberships } from '../../lib/api/batches';
import { useStudentNotices } from '../../lib/api/notices';
import { buildLedger, useEnrolmentMonths } from '../../lib/api/batchFees';
import { useStudentAttendance } from '../../lib/api/attendance';
import { LOW_ATTENDANCE, percentLabel } from '../../lib/utils/attendance';
import { useLocalStore } from '../../lib/local/store';
import { useRefresh } from '../../lib/sync/useRefresh';
import { courseLabel, monthLabel } from '../../lib/utils/months';
import { money } from '../../lib/utils/format';
import { DAY_KEYS, DAY_NAMES, todayKey } from '../../lib/utils/timetable';
import { AppText, Card, EmptyState, HeroCard, IconBubble, IconName, Pill, Row, SectionHeader } from '../../components/ui/base';
import { Screen } from '../../components/ui/Screen';
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
  const { overall } = useStudentAttendance(m);

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

  return (
    <View style={{ flex: 1, backgroundColor: colors.bgApp }}>
      <StackHeader
        title={m.batch_name}
        right={<HeaderIconButton icon="megaphone-outline" label="Notices" badge={newNotices} tilt={-15} onPress={openNotices} />}
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
          <Tile icon="document-text-outline" title="Tests & Results" soon onPress={soon('Tests & Results', 'document-text-outline')} />
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
    </View>
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
});
