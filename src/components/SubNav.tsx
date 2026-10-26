import React from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useTheme } from '../theme/ThemeProvider';
import { spacing } from '../theme/tokens';
import { Chip, IconName } from './ui/base';

export interface SubNavItem {
  route: string;
  label: string;
  icon: IconName;
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
  { route: 'Timetable', label: 'Timetable', icon: 'calendar-outline' },
  { route: 'Attendance', label: 'Attendance', icon: 'clipboard-outline' },
  { route: 'Syllabus', label: 'Syllabus', icon: 'book-outline' },
  { route: 'Tests', label: 'Tests', icon: 'create-outline' },
  { route: 'Marksheets', label: 'Marksheets', icon: 'receipt-outline' },
];

export const LEARN_NAV: SubNavItem[] = [
  { route: 'Labs', label: 'STEM Labs', icon: 'flask-outline' },
  { route: 'Videos', label: 'Lessons', icon: 'play-circle-outline' },
  { route: 'Focus', label: 'Focus Room', icon: 'locate-outline' },
  { route: 'Practice', label: 'Practice', icon: 'help-circle-outline' },
];
