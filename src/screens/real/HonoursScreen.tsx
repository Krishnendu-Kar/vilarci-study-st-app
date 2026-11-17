import React from 'react';
import { StyleSheet, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useTheme } from '../../theme/ThemeProvider';
import { radius, spacing } from '../../theme/tokens';
import { useAuth } from '../../lib/AuthProvider';
import { useActiveStudent } from '../../lib/store/useActiveStudent';
import { AppText, Card, HeroCard, IconName, Row } from '../../components/ui/base';
import { Button } from '../../components/ui/Button';
import { Screen } from '../../components/ui/Screen';
import { RealTopBar } from '../../components/real/RealTopBar';

/** Honours tab. Not connected to real data yet: what's coming, and the demo. */
export function HonoursScreen() {
  const { colors } = useTheme();
  const { enterDemo } = useAuth();
  const { active } = useActiveStudent();
  const name = active?.first_name;

  const parts: { icon: IconName; title: string; text: string }[] = [
    { icon: 'sparkles-outline', title: 'Points', text: 'Earned for coming to class on time and for test results.' },
    { icon: 'ribbon-outline', title: 'Milestones & badges', text: 'Streaks and top finishes, collected through the year.' },
    {
      icon: 'podium-outline',
      title: 'Batch standing',
      text: `Where ${name ?? 'your student'} stands in each batch. Other students' names stay private.`,
    },
  ];

  return (
    <View style={{ flex: 1, backgroundColor: colors.bgApp }}>
      <RealTopBar title="Honours" subtitle={name ? `${name}'s points and badges` : undefined} />
      <Screen>
        <HeroCard>
          <Row gap={spacing.sm}>
            <Ionicons name="trophy" size={16} color={colors.goldBright} />
            <AppText variant="overline" style={{ color: colors.goldBright }}>
              COMING SOON
            </AppText>
          </Row>
          <AppText variant="title" style={{ color: '#FDFBF9', marginTop: spacing.sm }}>
            Honours
          </AppText>
          <AppText variant="caption" style={{ color: 'rgba(253,251,249,0.78)', marginTop: 2 }}>
            Rewards for showing up and doing well, from the batches {name ?? 'your student'} has joined. It starts once
            teachers mark attendance and tests in the app.
          </AppText>
        </HeroCard>

        <Card padded={false} style={{ marginTop: spacing.xl }}>
          {parts.map((p, i) => (
            <Row
              key={p.title}
              gap={spacing.md}
              align="flex-start"
              style={{ padding: spacing.lg, borderTopWidth: i ? StyleSheet.hairlineWidth : 0, borderTopColor: colors.border }}
            >
              <View style={[styles.icon, { backgroundColor: colors.goldSubtle }]}>
                <Ionicons name={p.icon} size={19} color={colors.gold} />
              </View>
              <View style={{ flex: 1 }}>
                <AppText variant="subheading">{p.title}</AppText>
                <AppText variant="caption" tone="secondary" style={{ marginTop: 2 }}>
                  {p.text}
                </AppText>
              </View>
            </Row>
          ))}
        </Card>

        <Button
          label="Preview Honours in the demo"
          iconName="play-circle-outline"
          variant="secondary"
          fullWidth
          onPress={enterDemo}
          style={{ marginTop: spacing.xl }}
        />
      </Screen>
    </View>
  );
}

const styles = StyleSheet.create({
  icon: { width: 38, height: 38, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center' },
});
