import React from 'react';
import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useTheme } from '../../theme/ThemeProvider';
import { elevation, radius, spacing } from '../../theme/tokens';
import { accountName, useAuth } from '../../lib/AuthProvider';
import {
  ageFrom,
  describeProfileError,
  fullName,
  initialsOf,
  MAX_STUDENT_PROFILES,
  relationLabel,
  StudentProfile,
  useStudentProfiles,
} from '../../lib/api/studentProfiles';
import { AppText, Avatar, Card, EmptyState, HeroCard, IconName, Pill, Row, SectionHeader } from '../../components/ui/base';
import { Button } from '../../components/ui/Button';
import { Screen } from '../../components/ui/Screen';

/** Stable gradient per profile so a child keeps the same colour everywhere. */
export const PROFILE_GRADIENTS: [string, string][] = [
  ['#8E1437', '#C2185B'],
  ['#1E5AA8', '#4F8FE0'],
  ['#0F7A52', '#3DB385'],
  ['#B8860B', '#E0B23C'],
];

export function gradientFor(index: number): [string, string] {
  return PROFILE_GRADIENTS[index % PROFILE_GRADIENTS.length];
}

/** Features that are still demo-only, shown so the build progress is visible. */
const COMING_NEXT: { icon: IconName; title: string }[] = [
  { icon: 'business-outline', title: 'Join coaching centres with a code' },
  { icon: 'calendar-outline', title: 'Timetable & attendance' },
  { icon: 'wallet-outline', title: 'Fees & receipts' },
  { icon: 'document-text-outline', title: 'Tests, marks & marksheets' },
];

/**
 * Home of the real, database-connected app. Everything here is read from and
 * written to Supabase; the demo screens stay one tap away (top right).
 */
export function RealHomeScreen() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();
  const { session, profile, enterDemo } = useAuth();
  const profiles = useStudentProfiles();

  const list = profiles.data ?? [];
  const name = accountName(profile, session);
  const firstName = profile?.first_name || name.split(' ')[0];
  const canAdd = list.length < MAX_STUDENT_PROFILES;

  return (
    <View style={{ flex: 1, backgroundColor: colors.bgApp }}>
      {/* ── App bar ─────────────────────────────────────────────────────── */}
      <Row
        justify="space-between"
        style={{ paddingTop: insets.top + spacing.sm, paddingHorizontal: spacing.lg, paddingBottom: spacing.sm }}
      >
        <Pressable
          onPress={() => navigation.navigate('Account')}
          accessibilityRole="button"
          accessibilityLabel="Your account"
          style={({ pressed }) => ({ flexDirection: 'row', alignItems: 'center', gap: spacing.sm, flex: 1, opacity: pressed ? 0.7 : 1 })}
        >
          <Avatar
            initials={`${profile?.first_name?.[0] ?? name[0] ?? 'V'}${profile?.last_name?.[0] ?? ''}`.toUpperCase()}
            gradient={['#5a0812', '#8E1437']}
            size={40}
            ring
          />
          <View style={{ flex: 1 }}>
            <AppText variant="overline" tone="muted">
              MY ACCOUNT
            </AppText>
            <AppText variant="subheading" numberOfLines={1}>
              {name}
            </AppText>
          </View>
        </Pressable>
        <Pressable
          onPress={enterDemo}
          accessibilityRole="button"
          accessibilityLabel="Open demo screens"
          hitSlop={6}
          style={({ pressed }) => [
            styles.demoBtn,
            {
              backgroundColor: colors.surface,
              borderColor: colors.border,
              opacity: pressed ? 0.7 : 1,
              ...elevation(1, colors.shadowColor, colors.shadowOpacity),
            },
          ]}
        >
          <Ionicons name="play-circle-outline" size={17} color={colors.primary} />
          <AppText variant="captionStrong" tone="primary">
            Demo
          </AppText>
        </Pressable>
      </Row>

      <Screen refreshing={profiles.isRefetching} onRefresh={() => profiles.refetch()}>
        <HeroCard>
          <AppText variant="overline" style={{ color: colors.goldBright }}>
            WELCOME
          </AppText>
          <AppText variant="display" style={{ color: '#FDFBF9', marginTop: 2 }}>
            Hi, {firstName}
          </AppText>
          <AppText variant="caption" style={{ color: 'rgba(253,251,249,0.7)', marginTop: 2 }}>
            Your Vilarci Study account is live and connected.
          </AppText>
          <Row style={{ marginTop: spacing.lg }} gap={spacing.lg}>
            <HeroStat value={`${list.length}/${MAX_STUDENT_PROFILES}`} label="STUDENT PROFILES" />
            <HeroStat value={profile?.whatsapp_number ? 'Verified' : '—'} label="WHATSAPP" />
          </Row>
        </HeroCard>

        {/* ── Student profiles ──────────────────────────────────────────── */}
        <View style={{ marginTop: spacing.xxl }}>
          <SectionHeader
            title="Student profiles"
            subtitle="Up to 3 per account — yourself and anyone you study for"
            action={canAdd && list.length > 0 ? 'Add' : undefined}
            onAction={() => navigation.navigate('StudentForm')}
          />

          {profiles.isLoading ? (
            <ActivityIndicator color={colors.primary} style={{ marginVertical: spacing.xl }} />
          ) : profiles.isError ? (
            <Card>
              <AppText variant="caption" tone="error">
                {describeProfileError(profiles.error)}
              </AppText>
              <Button label="Try again" variant="secondary" size="sm" onPress={() => profiles.refetch()} style={{ marginTop: spacing.md }} />
            </Card>
          ) : list.length === 0 ? (
            <View>
              <EmptyState
                icon="people-outline"
                title="No student profiles yet"
                message="Add yourself if you're studying, plus up to 2 more — a child, a friend, anyone. Each profile gets its own classes, attendance and marks."
              />
              <Button
                label="Add a student profile"
                iconName="person-add-outline"
                fullWidth
                onPress={() => navigation.navigate('StudentForm')}
                style={{ marginTop: spacing.md }}
              />
            </View>
          ) : (
            <View style={{ gap: spacing.md }}>
              {list.map((p, i) => (
                <ProfileCard key={p.id} profile={p} index={i} onPress={() => navigation.navigate('StudentForm', { id: p.id })} />
              ))}
              {canAdd ? (
                <Pressable
                  onPress={() => navigation.navigate('StudentForm')}
                  accessibilityRole="button"
                  style={({ pressed }) => [
                    styles.addTile,
                    { borderColor: colors.borderStrong, opacity: pressed ? 0.7 : 1 },
                  ]}
                >
                  <Ionicons name="add-circle-outline" size={20} color={colors.primary} />
                  <AppText variant="subheading" tone="primary">
                    Add student profile ({list.length}/{MAX_STUDENT_PROFILES})
                  </AppText>
                </Pressable>
              ) : (
                <AppText variant="caption" tone="muted" center>
                  All {MAX_STUDENT_PROFILES} student profiles are in use.
                </AppText>
              )}
            </View>
          )}
        </View>

        {/* ── Build progress ────────────────────────────────────────────── */}
        <View style={{ marginTop: spacing.xxl }}>
          <SectionHeader title="Coming next" subtitle="Already designed — try them in the demo" />
          <Card>
            {COMING_NEXT.map((f, i) => (
              <Row key={f.title} gap={spacing.md} style={{ paddingVertical: spacing.sm, borderTopWidth: i ? StyleSheet.hairlineWidth : 0, borderTopColor: colors.border }}>
                <Ionicons name={f.icon} size={18} color={colors.textMuted} />
                <AppText variant="bodyStrong" tone="secondary" style={{ flex: 1 }}>
                  {f.title}
                </AppText>
                <Pill label="Demo" tone="neutral" />
              </Row>
            ))}
            <Button
              label="Open the demo"
              variant="secondary"
              size="sm"
              iconName="play-circle-outline"
              fullWidth
              onPress={enterDemo}
              style={{ marginTop: spacing.md }}
            />
          </Card>
        </View>
      </Screen>
    </View>
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

function ProfileCard({ profile, index, onPress }: { profile: StudentProfile; index: number; onPress: () => void }) {
  const { colors } = useTheme();
  const age = ageFrom(profile.dob);
  const meta = [profile.class_name, profile.board, age !== null ? `${age} yrs` : null].filter(Boolean).join(' · ');
  return (
    <Pressable onPress={onPress} accessibilityRole="button" style={({ pressed }) => ({ opacity: pressed ? 0.9 : 1 })}>
      <Card>
        <Row gap={spacing.md}>
          <Avatar initials={initialsOf(profile)} gradient={gradientFor(index)} size={48} />
          <View style={{ flex: 1 }}>
            <Row gap={6}>
              <AppText variant="subheading" numberOfLines={1} style={{ flexShrink: 1 }}>
                {fullName(profile)}
              </AppText>
              <Pill
                label={profile.created_by === 'self' ? 'Self' : `By ${relationLabel(profile)}`}
                tone={profile.created_by === 'self' ? 'gold' : 'primary'}
              />
            </Row>
            <AppText variant="caption" tone="muted" numberOfLines={1} style={{ marginTop: 2 }}>
              {meta || 'Add class and board'}
            </AppText>
          </View>
          <Ionicons name="chevron-forward" size={17} color={colors.textMuted} />
        </Row>
      </Card>
    </Pressable>
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
  addTile: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.lg,
    borderRadius: radius.lg,
    borderWidth: 1.5,
    borderStyle: 'dashed',
  },
});
