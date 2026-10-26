import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useTheme } from '../theme/ThemeProvider';
import { spacing } from '../theme/tokens';
import { AppText, Row } from './ui/base';
import { MenuButton } from './SideMenu';

/**
 * Editorial page title for the utility screens (household, verify, settings,
 * help). Menu trigger top-left, plus a back chevron when the screen was pushed.
 */
export function ScreenTitle({ title, subtitle }: { title: string; subtitle?: string }) {
  const { colors } = useTheme();
  const navigation = useNavigation<any>();
  const canGoBack = navigation.canGoBack();

  return (
    <View>
      <Row gap={spacing.sm} style={{ marginBottom: spacing.md }}>
        <MenuButton />
        {canGoBack ? (
          <Pressable
            onPress={() => navigation.goBack()}
            accessibilityRole="button"
            accessibilityLabel="Go back"
            hitSlop={10}
            style={({ pressed }) => [
              {
                width: 38,
                height: 38,
                borderRadius: 19,
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: colors.surface,
                borderWidth: StyleSheet.hairlineWidth,
                borderColor: colors.border,
                opacity: pressed ? 0.6 : 1,
              },
            ]}
          >
            <Ionicons name="chevron-back" size={18} color={colors.textMain} />
          </Pressable>
        ) : null}
      </Row>
      <AppText variant="display">{title}</AppText>
      {subtitle ? (
        <AppText variant="caption" tone="muted" style={{ marginTop: 2 }}>
          {subtitle}
        </AppText>
      ) : null}
    </View>
  );
}
