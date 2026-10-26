import React from 'react';
import { Platform } from 'react-native';
import { DarkTheme, DefaultTheme, NavigationContainer, Theme } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator, NativeStackNavigationOptions } from '@react-navigation/native-stack';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useTheme } from '../theme/ThemeProvider';
import { fonts } from '../theme/tokens';

import { DashboardScreen } from '../screens/DashboardScreen';
import { TimetableScreen } from '../screens/TimetableScreen';
import { AttendanceScreen } from '../screens/AttendanceScreen';
import { SyllabusScreen } from '../screens/SyllabusScreen';
import { TestsScreen } from '../screens/TestsScreen';
import { MarksheetsScreen } from '../screens/MarksheetsScreen';
import { LabsScreen } from '../screens/LabsScreen';
import { VideosScreen } from '../screens/VideosScreen';
import { FocusScreen } from '../screens/FocusScreen';
import { PracticeScreen } from '../screens/PracticeScreen';
import { HonorsScreen } from '../screens/HonorsScreen';
import { MoreScreen } from '../screens/MoreScreen';
import { FeesScreen } from '../screens/FeesScreen';
import { ParentScreen } from '../screens/ParentScreen';
import { VerifyScreen } from '../screens/VerifyScreen';
import { SettingsScreen } from '../screens/SettingsScreen';
import { HelpScreen } from '../screens/HelpScreen';

type IconName = React.ComponentProps<typeof Ionicons>['name'];

const Tabs = createBottomTabNavigator();
const AcademicsStack = createNativeStackNavigator();
const LearnStack = createNativeStackNavigator();
const MoreStack = createNativeStackNavigator();

/** Sections switched by the in-screen chip bar: cross-fade, no back gesture. */
const sectionOptions: NativeStackNavigationOptions = {
  headerShown: false,
  animation: 'fade',
  animationDuration: 160,
  gestureEnabled: false,
};

/** Drill-in screens pushed from the More hub. */
const pushOptions: NativeStackNavigationOptions = {
  headerShown: false,
  animation: 'slide_from_right',
};

function AcademicsNavigator() {
  return (
    <AcademicsStack.Navigator screenOptions={sectionOptions}>
      <AcademicsStack.Screen name="Timetable" component={TimetableScreen} />
      <AcademicsStack.Screen name="Attendance" component={AttendanceScreen} />
      <AcademicsStack.Screen name="Syllabus" component={SyllabusScreen} />
      <AcademicsStack.Screen name="Tests" component={TestsScreen} />
      <AcademicsStack.Screen name="Marksheets" component={MarksheetsScreen} />
    </AcademicsStack.Navigator>
  );
}

function LearnNavigator() {
  return (
    <LearnStack.Navigator screenOptions={sectionOptions}>
      <LearnStack.Screen name="Labs" component={LabsScreen} />
      <LearnStack.Screen name="Videos" component={VideosScreen} />
      <LearnStack.Screen name="Focus" component={FocusScreen} />
      <LearnStack.Screen name="Practice" component={PracticeScreen} />
    </LearnStack.Navigator>
  );
}

function MoreNavigator() {
  return (
    <MoreStack.Navigator screenOptions={pushOptions}>
      <MoreStack.Screen name="MoreHub" component={MoreScreen} />
      <MoreStack.Screen name="Fees" component={FeesScreen} />
      <MoreStack.Screen name="Parent" component={ParentScreen} />
      <MoreStack.Screen name="Verify" component={VerifyScreen} />
      <MoreStack.Screen name="Settings" component={SettingsScreen} />
      <MoreStack.Screen name="Help" component={HelpScreen} />
    </MoreStack.Navigator>
  );
}

const TAB_ICONS: Record<string, [IconName, IconName]> = {
  Home: ['home', 'home-outline'],
  Academics: ['book', 'book-outline'],
  Learn: ['flask', 'flask-outline'],
  Honours: ['trophy', 'trophy-outline'],
  More: ['grid', 'grid-outline'],
};

function navTheme(isDark: boolean, colors: ReturnType<typeof useTheme>['colors']): Theme {
  const base = isDark ? DarkTheme : DefaultTheme;
  return {
    ...base,
    colors: {
      ...base.colors,
      primary: colors.primary,
      background: colors.bgApp,
      card: colors.surface,
      text: colors.textMain,
      border: colors.border,
      notification: colors.accent,
    },
  };
}

export function RootNavigator() {
  const { colors, isDark } = useTheme();

  return (
    <NavigationContainer theme={navTheme(isDark, colors)}>
      <Tabs.Navigator
        screenOptions={({ route }) => ({
          headerShown: false,
          tabBarActiveTintColor: colors.primary,
          tabBarInactiveTintColor: colors.textMuted,
          tabBarStyle: {
            backgroundColor: colors.surface,
            borderTopColor: colors.border,
            height: Platform.OS === 'ios' ? 84 : 62,
            paddingTop: 6,
            paddingBottom: Platform.OS === 'ios' ? 26 : 8,
          },
          tabBarLabelStyle: { fontFamily: fonts.sansSemibold, fontSize: 10.5 },
          tabBarIcon: ({ color, size, focused }) => {
            const [active, idle] = TAB_ICONS[route.name] ?? ['ellipse', 'ellipse-outline'];
            return <Ionicons name={focused ? active : idle} size={size - 2} color={color} />;
          },
        })}
      >
        <Tabs.Screen name="Home" component={DashboardScreen} />
        <Tabs.Screen name="Academics" component={AcademicsNavigator} />
        <Tabs.Screen name="Learn" component={LearnNavigator} />
        <Tabs.Screen name="Honours" component={HonorsScreen} />
        <Tabs.Screen name="More" component={MoreNavigator} />
      </Tabs.Navigator>
    </NavigationContainer>
  );
}
