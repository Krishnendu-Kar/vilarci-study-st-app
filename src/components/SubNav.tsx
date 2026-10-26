import React from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useTheme } from '../theme/ThemeProvider';
import { spacing } from '../theme/tokens';
import { Chip } from './ui/base';

export interface SubNavItem {
  route: string;
  label: string;
  icon: string;
}

/**
 * Horizontal segmented switcher pinned under the context header. Replaces the
 * website's left sidebar nav for the grouped academic / learning sections.
 */
export function SubNav({ items }: { items: SubNavItem[] }) {
  const { colors } = useTheme();
  const navigation = useNavigation<any>();
  const route = useRoute();

  return (
    <View
      style={{
        backgroundColor: colors.surface,
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderBottomColor: colors.border,
      }}
    >
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{
          paddingHorizontal: spacing.lg,
          paddingVertical: spacing.sm,
          gap: spacing.sm,
        }}
      >
        {items.map((item) => (
          <Chip
            key={item.route}
            label={item.label}
            icon={item.icon}
            selected={route.name === item.route}
            onPress={() => {
              // Replace rather than push so section switches don't pile up a back stack.
              if (route.name !== item.route) navigation.replace(item.route);
            }}
          />
        ))}
      </ScrollView>
    </View>
  );
}

export const ACADEMIC_NAV: SubNavItem[] = [
  { route: 'Timetable', label: 'Timetable', icon: '🗓️' },
  { route: 'Attendance', label: 'Attendance', icon: '📋' },
  { route: 'Syllabus', label: 'Syllabus', icon: '📖' },
  { route: 'Tests', label: 'Tests', icon: '📝' },
  { route: 'Marksheets', label: 'Marksheets', icon: '🧾' },
];

export const LEARN_NAV: SubNavItem[] = [
  { route: 'Labs', label: 'STEM Labs', icon: '🧪' },
  { route: 'Videos', label: 'Lessons', icon: '📺' },
  { route: 'Focus', label: 'Focus Room', icon: '🎯' },
  { route: 'Practice', label: 'Practice', icon: '❓' },
];
