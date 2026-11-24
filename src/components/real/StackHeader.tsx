import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useTheme } from '../../theme/ThemeProvider';
import { spacing } from '../../theme/tokens';
import { AppText, IconName, Row } from '../ui/base';

/** Back, an optional title and actions on the right — for screens pushed on top of the tabs. */
export function StackHeader({ title, right }: { title?: string; right?: React.ReactNode }) {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();
  return (
    <Row gap={spacing.md} style={{ paddingTop: insets.top + spacing.sm, paddingHorizontal: spacing.lg, paddingBottom: spacing.sm }}>
      <HeaderIconButton icon="arrow-back" label="Go back" onPress={() => navigation.goBack()} />
      {title ? (
        <AppText variant="title" style={{ flex: 1 }} numberOfLines={1}>
          {title}
        </AppText>
      ) : (
        <View style={{ flex: 1 }} />
      )}
      {right ? <Row gap={spacing.sm}>{right}</Row> : null}
    </Row>
  );
}

/** Round icon button sized for the header; `danger` for destructive actions, `badge` for a count (e.g. new notices). */
export function HeaderIconButton({
  icon,
  label,
  onPress,
  danger,
  disabled,
  badge,
  tilt,
}: {
  icon: IconName;
  label: string;
  onPress: () => void;
  danger?: boolean;
  disabled?: boolean;
  badge?: number;
  /** Turns the icon only (degrees, negative = to the left); the button and badge stay straight. */
  tilt?: number;
}) {
  const { colors } = useTheme();
  const tint = danger ? colors.errorText : badge ? colors.primary : colors.textMain;
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      hitSlop={8}
      accessibilityRole="button"
      accessibilityLabel={badge ? `${label}, ${badge} new` : label}
      style={({ pressed }) => [
        styles.iconBtn,
        {
          backgroundColor: danger ? colors.errorBg : colors.surface,
          borderColor: danger ? colors.errorBg : colors.border,
          opacity: disabled ? 0.4 : pressed ? 0.6 : 1,
        },
      ]}
    >
      <Ionicons
        name={icon}
        size={danger ? 17 : 19}
        color={tint}
        style={tilt ? { transform: [{ rotate: `${tilt}deg` }] } : undefined}
      />
      {badge ? (
        <View style={[styles.badge, { backgroundColor: colors.error, borderColor: colors.bgApp }]}>
          <AppText variant="caption" style={styles.badgeText}>
            {badge > 9 ? '9+' : badge}
          </AppText>
        </View>
      ) : null}
    </Pressable>
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
    position: 'absolute',
    top: -4,
    right: -4,
    minWidth: 18,
    height: 18,
    paddingHorizontal: 4,
    borderRadius: 9,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: { color: '#FFFFFF', fontSize: 10, lineHeight: 13, fontWeight: '700' },
});
