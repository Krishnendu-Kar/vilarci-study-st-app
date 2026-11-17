import React from 'react';
import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useTheme } from '../../theme/ThemeProvider';
import { elevation, radius, spacing } from '../../theme/tokens';
import { accountName, useAuth } from '../../lib/AuthProvider';
import { ageFrom, fullName, initialsOf } from '../../lib/api/studentProfiles';
import { useMemberships } from '../../lib/api/batches';
import { useRefresh } from '../../lib/sync/useRefresh';
import { useLocalStore } from '../../lib/local/store';
import { SyncBanner } from '../../components/real/SyncBanner';
import { useActiveStudent } from '../../lib/store/useActiveStudent';
import { gradientFor } from '../../lib/utils/profileColors';
import { DAY_NAMES, daysFromToday, weekClasses } from '../../lib/utils/timetable';
import { AppText, Avatar, Card, EmptyState, HeroCard, IconName, Row } from '../../components/ui/base';
import { Button } from '../../components/ui/Button';
import { Screen } from '../../components/ui/Screen';
import { RealMenuButton } from '../../components/real/RealSideMenu';

/**
 * Home of the real app, always about ONE student — the active profile chosen
 * in the side menu. Everything here is that student's.
 */
export function RealHomeScreen() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();
  const { session, profile } = useAuth();
  const { active, activeIndex, isLoading } = useActiveStudent();
  const { memberships, isLoading: membershipsLoading } = useMemberships();
  const { refreshing, refresh } = useRefresh();
  // Nothing on this phone yet and the first sync failed (a new phone, offline).
  const noCopy = useLocalStore((s) => !s.account && Boolean(s.syncError));

  const accountFirst = profile?.first_name || accountName(profile, session).split(' ')[0];
  const mine = memberships.filter((m) => m.student_id === active?.id);
  const joined = mine.filter((m) => m.status === 'approved').length;
  const waiting = mine.filter((m) => m.status === 'pending').length;
  const age = active ? ageFrom(active.dob) : null;
  const details = active ? [active.class_name, active.board, age !== null ? `${age} yrs` : null].filter(Boolean).join(' · ') : '';

  // Today's classes, or the next day that has any.
  const week = weekClasses(mine);
  const nextDay = daysFromToday().find(({ day }) => week[day].length);
  const nextClasses = nextDay ? week[nextDay.day] : [];

  return (
    <View style={{ flex: 1, backgroundColor: colors.bgApp }}>
      {/* ── App bar: who is being shown ─────────────────────────────────── */}
      <Row
        justify="space-between"
        gap={spacing.md}
        style={{ paddingTop: insets.top + spacing.sm, paddingHorizontal: spacing.lg, paddingBottom: spacing.sm }}
      >
        <RealMenuButton />
        <Pressable
          onPress={() => navigation.navigate('StudentForm', active ? { id: active.id } : undefined)}
          accessibilityRole="button"
          accessibilityLabel={active ? `Viewing ${fullName(active)}. Open profile` : 'Add a student'}
          style={({ pressed }) => ({ flexDirection: 'row', alignItems: 'center', gap: spacing.sm, flex: 1, opacity: pressed ? 0.7 : 1 })}
        >
          {active ? (
            <Avatar initials={initialsOf(active)} gradient={gradientFor(activeIndex)} size={40} ring />
          ) : (
            <View style={[styles.emptyAvatar, { borderColor: colors.borderStrong }]}>
              <Ionicons name="person-add-outline" size={17} color={colors.textMuted} />
            </View>
          )}
          <View style={{ flex: 1 }}>
            <Row gap={3}>
              <AppText variant="subheading" numberOfLines={1} style={{ flexShrink: 1 }}>
                {active ? fullName(active) : 'Add a student'}
              </AppText>
              <Ionicons name="chevron-forward" size={14} color={colors.textMuted} />
            </Row>
            <AppText variant="caption" tone="muted" numberOfLines={1}>
              {active ? details || 'View profile' : 'No student yet'}
            </AppText>
          </View>
        </Pressable>
      </Row>

      <Screen refreshing={refreshing} onRefresh={refresh}>
        <SyncBanner />
        {isLoading ? (
          <ActivityIndicator color={colors.primary} style={{ marginTop: spacing.xxl }} />
        ) : noCopy ? (
          <EmptyState
            icon="cloud-offline-outline"
            title="Connect to the internet once"
            message="Your students and batches are saved on this phone after the first sync. Then they open even without internet."
          />
        ) : !active ? (
          /* ── No student profile yet ─────────────────────────────────── */
          <>
            <HeroCard>
              <AppText variant="overline" style={{ color: colors.goldBright }}>
                WELCOME
              </AppText>
              <AppText variant="display" style={{ color: '#FDFBF9', marginTop: 2 }}>
                Hi, {accountFirst}
              </AppText>
              <AppText variant="caption" style={{ color: 'rgba(253,251,249,0.7)', marginTop: 2 }}>
                Add a student to get started — yourself or someone you study for.
              </AppText>
            </HeroCard>
            <View style={{ marginTop: spacing.xl }}>
              <EmptyState
                icon="people-outline"
                title="No student profiles yet"
                message="Each student gets their own batches, classes, attendance and marks. You can add up to 3."
              />
              <Button
                label="Add a student"
                iconName="person-add-outline"
                fullWidth
                onPress={() => navigation.navigate('StudentForm')}
                style={{ marginTop: spacing.md }}
              />
            </View>
          </>
        ) : (
          <>
            {/* ── Batches at a glance ────────────────────────────────────── */}
            <Row gap={spacing.md} align="stretch">
              <BatchStat
                value={joined}
                label={joined === 1 ? 'Batch joined' : 'Batches joined'}
                icon="school-outline"
                featured
                onPress={() => navigation.navigate('Batches')}
              />
              <BatchStat
                value={waiting}
                label={waiting === 1 ? 'Request waiting' : 'Requests waiting'}
                icon="hourglass-outline"
                onPress={() => navigation.navigate('Batches')}
              />
            </Row>

            {/* ── Today / next classes: one compact card ───────────────── */}
            {joined ? (
              <Card padded={false} style={{ marginTop: spacing.xl, paddingHorizontal: spacing.md, paddingVertical: spacing.sm }}>
                <Row justify="space-between">
                  <AppText variant="overline" tone="muted">
                    {(!nextDay ? 'Classes' : nextDay.offset === 0 ? 'Today' : nextDay.offset === 1 ? 'Tomorrow' : DAY_NAMES[nextDay.day]).toUpperCase()}
                    {nextDay ? ` · ${nextClasses.length} CLASS${nextClasses.length === 1 ? '' : 'ES'}` : ''}
                  </AppText>
                  <Pressable onPress={() => navigation.navigate('StudentTimetable')} hitSlop={10} accessibilityRole="button">
                    <Row gap={2}>
                      <AppText variant="captionStrong" tone="primary">
                        Timetable
                      </AppText>
                      <Ionicons name="chevron-forward" size={13} color={colors.primary} />
                    </Row>
                  </Pressable>
                </Row>
                {nextClasses.length ? (
                  nextClasses.map((c, i) => (
                    <Row
                      key={`${c.membership.id}-${i}`}
                      gap={spacing.sm}
                      style={{ paddingVertical: 6, marginTop: i ? 0 : 4, borderTopWidth: i ? StyleSheet.hairlineWidth : 0, borderTopColor: colors.border }}
                    >
                      <AppText variant="captionStrong" tone="primary" style={{ width: 66 }}>
                        {c.start}
                      </AppText>
                      <AppText variant="bodyStrong" numberOfLines={1} style={{ flex: 1 }}>
                        {c.membership.batch_name}
                      </AppText>
                      <AppText variant="caption" tone="muted">
                        till {c.end}
                      </AppText>
                    </Row>
                  ))
                ) : (
                  <AppText variant="caption" tone="muted" style={{ paddingVertical: 6 }}>
                    The teacher hasn’t set class days yet.
                  </AppText>
                )}
              </Card>
            ) : null}

            {/* ── First batch: the batch list itself lives in the Batches tab ── */}
            {!membershipsLoading && !mine.length ? (
              <Card style={{ marginTop: spacing.xxl }}>
                <Row gap={spacing.md} align="flex-start">
                  <Ionicons name="key-outline" size={20} color={colors.primary} style={{ marginTop: 2 }} />
                  <AppText variant="caption" tone="secondary" style={{ flex: 1 }}>
                    {active.first_name} hasn’t joined a batch yet. Got a join link or code from a teacher — tuition,
                    music, art, yoga or anything else? Open the link, or enter the code.
                  </AppText>
                </Row>
                <Button
                  label={`Join a batch for ${active.first_name}`}
                  iconName="enter-outline"
                  fullWidth
                  onPress={() => navigation.navigate('JoinBatch', { studentId: active.id })}
                  style={{ marginTop: spacing.md }}
                />
              </Card>
            ) : null}
          </>
        )}
      </Screen>
    </View>
  );
}

/** One compact number about the student's batches; the featured one sits on the brand gradient. */
function BatchStat({
  value,
  label,
  icon,
  featured,
  onPress,
}: {
  value: number;
  label: string;
  icon: IconName;
  featured?: boolean;
  onPress: () => void;
}) {
  const { colors } = useTheme();
  const fg = featured ? '#FDFBF9' : colors.textMain;
  const body = (
    <>
      <View style={[styles.statIcon, { backgroundColor: featured ? 'rgba(253,251,249,0.16)' : colors.goldSubtle }]}>
        <Ionicons name={icon} size={16} color={featured ? colors.goldBright : colors.gold} />
      </View>
      <View style={{ flex: 1 }}>
        <AppText variant="metricSm" style={{ color: fg }}>
          {value}
        </AppText>
        <AppText variant="caption" numberOfLines={1} style={{ color: featured ? 'rgba(253,251,249,0.75)' : colors.textMuted, fontSize: 11.5 }}>
          {label}
        </AppText>
      </View>
    </>
  );
  const frame = [styles.stat, elevation(1, colors.shadowColor, colors.shadowOpacity)];
  return (
    <Pressable onPress={onPress} accessibilityRole="button" accessibilityLabel={`${value} ${label}. Open batches`} style={({ pressed }) => ({ flex: 1, opacity: pressed ? 0.85 : 1 })}>
      {featured ? (
        <LinearGradient colors={colors.primaryGradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={frame}>
          {body}
        </LinearGradient>
      ) : (
        <View style={[frame, { backgroundColor: colors.surface, borderWidth: StyleSheet.hairlineWidth, borderColor: colors.border }]}>{body}</View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  emptyAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stat: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.sm + 2,
    paddingHorizontal: spacing.md,
    borderRadius: radius.lg,
  },
  statIcon: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
