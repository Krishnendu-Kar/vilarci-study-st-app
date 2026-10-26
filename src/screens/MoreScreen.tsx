import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useTheme } from '../theme/ThemeProvider';
import { elevation, radius, spacing } from '../theme/tokens';
import { useFees, useHousehold, usePoints, useStudentContext } from '../lib/api/hooks';
import { AppText, Avatar, Card, Divider, HeroCard, ListRow, Pill, Row, SectionHeader } from '../components/ui/base';
import { Screen } from '../components/ui/Screen';
import { rupees } from '../lib/utils/format';

type IconName = React.ComponentProps<typeof Ionicons>['name'];

/**
 * The More tab: who you are, then everything that isn't daily study —
 * money, family, documents and preferences.
 */
export function MoreScreen() {
  const { colors } = useTheme();
  const navigation = useNavigation<any>();
  const ctx = useStudentContext();
  const { summary } = useFees();
  const points = usePoints();
  const { household, rows } = useHousehold();

  const go = (route: string) => navigation.navigate(route);

  return (
    <View style={{ flex: 1, backgroundColor: colors.bgApp }}>
      <Screen topInset>
        <AppText variant="display">More</AppText>

        {/* ── Identity ────────────────────────────────────────────────────── */}
        <HeroCard style={{ marginTop: spacing.lg }}>
          <Row gap={spacing.md}>
            <Avatar initials={ctx.student.photo_initials} gradient={ctx.student.avatar_gradient} size={58} ring />
            <View style={{ flex: 1 }}>
              <AppText variant="title" style={{ color: '#FDFBF9' }} numberOfLines={1}>
                {ctx.student.name}
              </AppText>
              <AppText variant="caption" style={{ color: 'rgba(253,251,249,0.66)' }}>
                {ctx.student.class} · {ctx.student.board} · Roll {ctx.student.roll}
              </AppText>
            </View>
          </Row>
          <View style={styles.heroDivider} />
          <Row>
            <HeroStat value={points.total.toLocaleString('en-IN')} label="POINTS" />
            <View style={styles.heroRule} />
            <HeroStat value={`${points.streak}d`} label="STREAK" />
            <View style={styles.heroRule} />
            <HeroStat value={String(ctx.enrolledCenters.length)} label="FACULTIES" />
          </Row>
        </HeroCard>

        {/* ── Primary destinations ────────────────────────────────────────── */}
        <Row gap={spacing.md} style={{ marginTop: spacing.lg }}>
          <Tile
            icon="wallet-outline"
            tint={summary.pendingTotal ? colors.error : colors.success}
            title="Fees"
            meta={summary.pendingTotal ? `${rupees(summary.pendingTotal)} due` : 'All clear'}
            badge={summary.overdue.length ? `${summary.overdue.length} overdue` : undefined}
            onPress={() => go('Fees')}
          />
          <Tile
            icon="people-outline"
            tint={colors.primary}
            title="Household"
            meta={`${rows.length} of ${household.max_profiles} profiles`}
            onPress={() => go('Parent')}
          />
        </Row>
        <Row gap={spacing.md} style={{ marginTop: spacing.md }}>
          <Tile
            icon="shield-checkmark-outline"
            tint={colors.info}
            title="Verify"
            meta="Check a marksheet"
            onPress={() => go('Verify')}
          />
          <Tile
            icon="trophy-outline"
            tint={colors.gold}
            title="Honours"
            meta={`${points.badges.filter((b: { earned?: boolean }) => b.earned).length} badges earned`}
            onPress={() => navigation.navigate('Honours')}
          />
        </Row>

        {/* ── Preferences ─────────────────────────────────────────────────── */}
        <View style={{ marginTop: spacing.xxl }}>
          <SectionHeader title="Account" />
          <Card padded={false}>
            <View style={{ paddingHorizontal: spacing.lg }}>
              <ListRow
                title="Settings"
                subtitle="Profile, contacts, faculties, appearance"
                iconName="settings-outline"
                onPress={() => go('Settings')}
              />
              <Divider />
              <ListRow
                title="Help & support"
                subtitle="FAQ, points rules, contact us"
                iconName="help-buoy-outline"
                onPress={() => go('Help')}
              />
            </View>
          </Card>
        </View>

        <Card muted style={{ marginTop: spacing.lg }}>
          <Row gap={spacing.sm}>
            <Ionicons name="school-outline" size={16} color={colors.textMuted} />
            <AppText variant="caption" tone="muted" style={{ flex: 1 }}>
              Teacher app coming soon — classes, attendance and awards from the faculty side.
            </AppText>
            <Pill label="Soon" tone="gold" />
          </Row>
        </Card>
      </Screen>
    </View>
  );
}

function HeroStat({ value, label }: { value: string; label: string }) {
  const { colors } = useTheme();
  return (
    <View style={{ flex: 1, alignItems: 'center' }}>
      <AppText variant="metricSm" style={{ color: '#FDFBF9' }}>
        {value}
      </AppText>
      <AppText variant="overline" style={{ color: colors.goldBright, marginTop: 2 }}>
        {label}
      </AppText>
    </View>
  );
}

function Tile({
  icon,
  tint,
  title,
  meta,
  badge,
  onPress,
}: {
  icon: IconName;
  tint: string;
  title: string;
  meta: string;
  badge?: string;
  onPress: () => void;
}) {
  const { colors } = useTheme();
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${title}, ${meta}`}
      style={({ pressed }) => [
        {
          flex: 1,
          minHeight: 128,
          padding: spacing.lg,
          borderRadius: radius.lg,
          backgroundColor: colors.surface,
          borderWidth: StyleSheet.hairlineWidth,
          borderColor: colors.border,
          justifyContent: 'space-between',
          transform: [{ scale: pressed ? 0.98 : 1 }],
          ...elevation(1, colors.shadowColor, colors.shadowOpacity),
        },
      ]}
    >
      <Row justify="space-between" align="flex-start">
        <View
          style={{
            width: 40,
            height: 40,
            borderRadius: 14,
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: `${tint}16`,
          }}
        >
          <Ionicons name={icon} size={20} color={tint} />
        </View>
        {badge ? <Pill label={badge} tone="error" /> : null}
      </Row>
      <View style={{ marginTop: spacing.md }}>
        <AppText variant="subheading">{title}</AppText>
        <AppText variant="caption" tone="muted" numberOfLines={1}>
          {meta}
        </AppText>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  heroDivider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: 'rgba(253,251,249,0.22)',
    marginVertical: spacing.lg,
  },
  heroRule: {
    width: StyleSheet.hairlineWidth,
    alignSelf: 'stretch',
    backgroundColor: 'rgba(253,251,249,0.22)',
  },
});
