import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useTheme } from '../../theme/ThemeProvider';
import { radius, spacing } from '../../theme/tokens';
import { useAuth } from '../../lib/AuthProvider';
import { AppText, IconName, Row } from '../../components/ui/base';
import { Button } from '../../components/ui/Button';
import { RealMenuButton } from '../../components/real/RealSideMenu';

/** Placeholder for real-app sections that aren't built yet. */
export function ComingSoonScreen() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();
  const { enterDemo } = useAuth();
  const params = (useRoute().params ?? {}) as { title?: string; icon?: IconName };
  const title = params.title ?? 'This section';
  const icon = params.icon ?? 'construct-outline';

  return (
    <View style={{ flex: 1, backgroundColor: colors.bgApp }}>
      <Row gap={spacing.sm} style={{ paddingTop: insets.top + spacing.sm, paddingHorizontal: spacing.lg, paddingBottom: spacing.sm }}>
        <RealMenuButton />
        {navigation.canGoBack() ? (
          <Pressable
            onPress={() => navigation.goBack()}
            hitSlop={10}
            accessibilityRole="button"
            accessibilityLabel="Go back"
            style={({ pressed }) => [styles.iconBtn, { backgroundColor: colors.surface, borderColor: colors.border, opacity: pressed ? 0.6 : 1 }]}
          >
            <Ionicons name="arrow-back" size={19} color={colors.textMain} />
          </Pressable>
        ) : null}
      </Row>

      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: spacing.xl, paddingBottom: insets.bottom + spacing.xxxl }}>
        <View style={[styles.badge, { backgroundColor: colors.primarySubtle }]}>
          <Ionicons name={icon} size={38} color={colors.primary} />
        </View>
        <View style={[styles.soonPill, { backgroundColor: colors.goldSubtle }]}>
          <Ionicons name="hourglass-outline" size={13} color={colors.gold} />
          <AppText variant="overline" style={{ color: colors.gold }}>
            COMING SOON
          </AppText>
        </View>
        <AppText variant="display" center style={{ marginTop: spacing.md }}>
          {title}
        </AppText>
        <AppText variant="body" tone="secondary" center style={{ marginTop: spacing.sm, maxWidth: 320 }}>
          We're connecting this to your real account next. You can already see how it will work in the demo.
        </AppText>

        <Button
          label={`Preview ${title} in the demo`}
          iconName="play-circle-outline"
          variant="secondary"
          onPress={enterDemo}
          style={{ marginTop: spacing.xl }}
        />
        <Button
          label="Back to home"
          variant="ghost"
          iconName="home-outline"
          onPress={() => navigation.navigate('RealHome')}
          style={{ marginTop: spacing.sm }}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  iconBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: StyleSheet.hairlineWidth,
  },
  badge: {
    width: 88,
    height: 88,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  soonPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: spacing.lg,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: radius.pill,
  },
});
