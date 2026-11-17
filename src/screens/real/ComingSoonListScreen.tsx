import React from 'react';
import { StyleSheet, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useTheme } from '../../theme/ThemeProvider';
import { radius, spacing } from '../../theme/tokens';
import { useAuth } from '../../lib/AuthProvider';
import { COMING_SOON, COMING_SOON_COUNT } from '../../lib/comingSoon';
import { AppText, Card, HeroCard, Pill, Row } from '../../components/ui/base';
import { Button } from '../../components/ui/Button';
import { Screen } from '../../components/ui/Screen';
import { RealTopBar } from '../../components/real/RealTopBar';

/** Every real-app section that isn't connected to the database yet, in one list. */
export function ComingSoonListScreen() {
  const { colors } = useTheme();
  const { enterDemo } = useAuth();

  return (
    <View style={{ flex: 1, backgroundColor: colors.bgApp }}>
      <RealTopBar title="Coming soon" subtitle={`${COMING_SOON_COUNT} features on the way`} />
      <Screen>
        <HeroCard>
          <Row gap={spacing.sm}>
            <Ionicons name="hourglass-outline" size={15} color={colors.goldBright} />
            <AppText variant="overline" style={{ color: colors.goldBright }}>
              BEING CONNECTED NEXT
            </AppText>
          </Row>
          <AppText variant="caption" style={{ color: 'rgba(253,251,249,0.78)', marginTop: spacing.sm }}>
            These are already designed. Each one moves into the menu as soon as it works with your real account — until
            then, try them in the demo.
          </AppText>
          <Button
            label="Open the demo"
            variant="secondary"
            size="sm"
            iconName="play-circle-outline"
            onPress={enterDemo}
            style={{ marginTop: spacing.md, alignSelf: 'flex-start' }}
          />
        </HeroCard>

        {COMING_SOON.map((section) => (
          <View key={section.title} style={{ marginTop: spacing.xxl }}>
            <AppText variant="overline" tone="muted" style={{ marginBottom: spacing.sm }}>
              {section.title}
            </AppText>
            <Card padded={false}>
              {section.items.map((f, i) => (
                <Row
                  key={f.title}
                  gap={spacing.md}
                  align="flex-start"
                  style={{
                    padding: spacing.lg,
                    borderTopWidth: i ? StyleSheet.hairlineWidth : 0,
                    borderTopColor: colors.border,
                  }}
                >
                  <View style={[styles.icon, { backgroundColor: colors.primarySubtle }]}>
                    <Ionicons name={f.icon} size={19} color={colors.primary} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Row justify="space-between" gap={spacing.sm}>
                      <AppText variant="subheading" style={{ flex: 1 }} numberOfLines={1}>
                        {f.title}
                      </AppText>
                      <Pill label="Soon" tone="gold" />
                    </Row>
                    <AppText variant="caption" tone="secondary" style={{ marginTop: 2 }}>
                      {f.description}
                    </AppText>
                  </View>
                </Row>
              ))}
            </Card>
          </View>
        ))}
      </Screen>
    </View>
  );
}

const styles = StyleSheet.create({
  icon: {
    width: 38,
    height: 38,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
