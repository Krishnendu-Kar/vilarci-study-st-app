import React from 'react';
import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useTheme } from '../../theme/ThemeProvider';
import { elevation, radius, spacing } from '../../theme/tokens';
import { accountName, useAuth } from '../../lib/AuthProvider';
import { ageFrom, fullName, initialsOf, relationLabel } from '../../lib/api/studentProfiles';
import { Membership, STATUS_LABEL, useMyMemberships } from '../../lib/api/batches';
import { useActiveStudent } from '../../lib/store/useActiveStudent';
import { rupees } from '../../lib/utils/format';
import { gradientFor } from '../../lib/utils/profileColors';
import { AppText, Avatar, Card, EmptyState, HeroCard, IconName, Pill, Row, SectionHeader } from '../../components/ui/base';
import { Button } from '../../components/ui/Button';
import { Screen } from '../../components/ui/Screen';
import { RealMenuButton, useRealSideMenu } from '../../components/real/RealSideMenu';


/** Features that are still demo-only, shown so the build progress is visible. */
const COMING_NEXT: { icon: IconName; title: string }[] = [
  { icon: 'business-outline', title: 'Join coaching centres with a code' },
  { icon: 'calendar-outline', title: 'Timetable & attendance' },
  { icon: 'wallet-outline', title: 'Fees & receipts' },
  { icon: 'document-text-outline', title: 'Tests, marks & marksheets' },
];

/**
 * Home of the real app, always about ONE student — the active profile chosen
 * in the side menu. Everything here is that student's.
 */
export function RealHomeScreen() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();
  const { session, profile, enterDemo } = useAuth();
  const { open: openMenu } = useRealSideMenu();
  const { active, activeIndex, profiles, isLoading } = useActiveStudent();
  const memberships = useMyMemberships();

  const accountFirst = profile?.first_name || accountName(profile, session).split(' ')[0];
  const mine = (memberships.data ?? []).filter((m) => m.student_id === active?.id);
  const joined = mine.filter((m) => m.status === 'approved').length;
  const waiting = mine.filter((m) => m.status === 'pending').length;
  const age = active ? ageFrom(active.dob) : null;

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
          onPress={openMenu}
          accessibilityRole="button"
          accessibilityLabel={active ? `Viewing ${fullName(active)}. Switch student` : 'Add a student'}
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
            <AppText variant="overline" tone="muted">
              {active ? 'VIEWING' : 'NO STUDENT YET'}
            </AppText>
            <Row gap={3}>
              <AppText variant="subheading" numberOfLines={1} style={{ flexShrink: 1 }}>
                {active ? fullName(active) : 'Add a student'}
              </AppText>
              {profiles.length > 1 ? <Ionicons name="chevron-down" size={14} color={colors.textMuted} /> : null}
            </Row>
          </View>
        </Pressable>
        <Pressable
          onPress={enterDemo}
          accessibilityRole="button"
          accessibilityLabel="Open demo screens"
          hitSlop={6}
          style={({ pressed }) => [
            styles.demoBtn,
            { backgroundColor: colors.surface, borderColor: colors.border, opacity: pressed ? 0.7 : 1, ...elevation(1, colors.shadowColor, colors.shadowOpacity) },
          ]}
        >
          <Ionicons name="play-circle-outline" size={17} color={colors.primary} />
          <AppText variant="captionStrong" tone="primary">
            Demo
          </AppText>
        </Pressable>
      </Row>

      <Screen refreshing={memberships.isRefetching} onRefresh={() => memberships.refetch()}>
        {isLoading ? (
          <ActivityIndicator color={colors.primary} style={{ marginTop: spacing.xxl }} />
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
            {/* ── Active student ─────────────────────────────────────────── */}
            <HeroCard>
              <Row gap={spacing.md} align="flex-start">
                <Avatar initials={initialsOf(active)} gradient={gradientFor(activeIndex)} size={56} ring />
                <View style={{ flex: 1 }}>
                  <AppText variant="overline" style={{ color: colors.goldBright }}>
                    {active.created_by === 'self' ? 'MY STUDENT PROFILE' : `ADDED AS ${relationLabel(active).toUpperCase()}`}
                  </AppText>
                  <AppText variant="title" numberOfLines={2} style={{ color: '#FDFBF9', marginTop: 2 }}>
                    {fullName(active)}
                  </AppText>
                  <AppText variant="caption" style={{ color: 'rgba(253,251,249,0.72)', marginTop: 2 }}>
                    {[active.class_name, active.board, age !== null ? `${age} yrs` : null].filter(Boolean).join(' · ') ||
                      'Add class and board in the profile'}
                  </AppText>
                </View>
                <Pressable
                  onPress={() => navigation.navigate('StudentForm', { id: active.id })}
                  hitSlop={8}
                  accessibilityRole="button"
                  accessibilityLabel="Edit student profile"
                  style={styles.heroEdit}
                >
                  <Ionicons name="create-outline" size={16} color="#FDFBF9" />
                </Pressable>
              </Row>
              <Row style={{ marginTop: spacing.lg }} gap={spacing.xl}>
                <HeroStat value={String(joined)} label="BATCHES" />
                <HeroStat value={String(waiting)} label="WAITING" />
              </Row>
            </HeroCard>

            {/* ── This student's private batches ───────────────────────── */}
            <View style={{ marginTop: spacing.xxl }}>
              <SectionHeader
                title={`${active.first_name}'s batches`}
                subtitle="Private batches and their status"
                action={mine.length ? 'Join' : undefined}
                onAction={() => navigation.navigate('JoinBatch', { studentId: active.id })}
              />
              {memberships.isLoading ? (
                <ActivityIndicator color={colors.primary} />
              ) : mine.length ? (
                <View style={{ gap: spacing.md }}>
                  {mine.map((m) => (
                    <MembershipCard key={m.id} m={m} />
                  ))}
                </View>
              ) : (
                <Card>
                  <Row gap={spacing.md} align="flex-start">
                    <Ionicons name="key-outline" size={20} color={colors.primary} style={{ marginTop: 2 }} />
                    <AppText variant="caption" tone="secondary" style={{ flex: 1 }}>
                      {active.first_name} hasn't joined a batch yet. Got a join link or code from a teacher — tuition,
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
              )}
            </View>
          </>
        )}

        {/* ── Build progress ────────────────────────────────────────────── */}
        <View style={{ marginTop: spacing.xxl }}>
          <SectionHeader title="Coming next" subtitle="Already designed — try them in the demo" />
          <Card>
            {COMING_NEXT.map((f, i) => (
              <Row
                key={f.title}
                gap={spacing.md}
                style={{ paddingVertical: spacing.sm, borderTopWidth: i ? StyleSheet.hairlineWidth : 0, borderTopColor: colors.border }}
              >
                <Ionicons name={f.icon} size={18} color={colors.textMuted} />
                <AppText variant="bodyStrong" tone="secondary" style={{ flex: 1 }}>
                  {f.title}
                </AppText>
                <Pill label="Demo" tone="neutral" />
              </Row>
            ))}
            <Button label="Open the demo" variant="secondary" size="sm" iconName="play-circle-outline" fullWidth onPress={enterDemo} style={{ marginTop: spacing.md }} />
          </Card>
        </View>
      </Screen>
    </View>
  );
}

function MembershipCard({ m }: { m: Membership }) {
  const { colors } = useTheme();
  const tone = m.status === 'approved' ? 'success' : m.status === 'pending' ? 'gold' : 'error';
  return (
    <Card>
      <Row justify="space-between" align="flex-start" gap={spacing.md}>
        <View style={{ flex: 1 }}>
          <AppText variant="subheading" numberOfLines={1}>
            {m.batch_name}
          </AppText>
          <AppText variant="caption" tone="muted" numberOfLines={1}>
            {[m.subject, m.grade, m.board].filter(Boolean).join(' · ')}
          </AppText>
        </View>
        <Pill label={STATUS_LABEL[m.status]} tone={tone} />
      </Row>
      <Row gap={6} style={{ marginTop: spacing.sm }}>
        <Ionicons name="person-circle-outline" size={14} color={colors.textMuted} />
        <AppText variant="caption" tone="secondary" style={{ flex: 1 }} numberOfLines={1}>
          {m.teacher_name} · {rupees(m.monthly_fee)}/month
        </AppText>
      </Row>
    </Card>
  );
}

function HeroStat({ value, label }: { value: string; label: string }) {
  const { colors } = useTheme();
  return (
    <View>
      <AppText variant="metricSm" style={{ color: '#FDFBF9' }}>
        {value}
      </AppText>
      <AppText variant="overline" style={{ color: colors.goldBright, marginTop: 1 }}>
        {label}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  demoBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: radius.pill,
    borderWidth: StyleSheet.hairlineWidth,
  },
  emptyAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroEdit: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(253,251,249,0.16)',
  },
});
