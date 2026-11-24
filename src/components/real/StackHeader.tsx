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

/** Round icon button sized for the header; `danger` for destructive actions. */
export function HeaderIconButton({
  icon,
  label,
  onPress,
  danger,
  disabled,
}: {
  icon: IconName;
  label: string;
  onPress: () => void;
  danger?: boolean;
  disabled?: boolean;
}) {
  const { colors } = useTheme();
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      hitSlop={8}
      accessibilityRole="button"
      accessibilityLabel={label}
      style={({ pressed }) => [
        styles.iconBtn,
        {
          backgroundColor: danger ? colors.errorBg : colors.surface,
          borderColor: danger ? colors.errorBg : colors.border,
          opacity: disabled ? 0.4 : pressed ? 0.6 : 1,
        },
      ]}
    >
      <Ionicons name={icon} size={danger ? 17 : 19} color={danger ? colors.errorText : colors.textMain} />
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
});
