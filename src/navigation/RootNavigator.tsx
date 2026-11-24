import React, { useEffect, useState } from 'react';
import * as Linking from 'expo-linking';
import { ActivityIndicator, Platform, Pressable, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { DarkTheme, DefaultTheme, NavigationContainer, Theme } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator, NativeStackNavigationOptions } from '@react-navigation/native-stack';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useTheme } from '../theme/ThemeProvider';
import { elevation, fonts } from '../theme/tokens';
import { navigationRef } from './navigationRef';
import { SideMenuProvider } from '../components/SideMenu';

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
import { LoginScreen } from '../screens/auth/LoginScreen';
import { SignupScreen } from '../screens/auth/SignupScreen';
import { ForgotPasswordScreen } from '../screens/auth/ForgotPasswordScreen';
import { useAuth } from '../lib/AuthProvider';
import { RealHomeScreen } from '../screens/real/RealHomeScreen';
import { StudentFormScreen } from '../screens/real/StudentFormScreen';
import { StudentProfileScreen } from '../screens/real/StudentProfileScreen';
import { BatchDetailScreen } from '../screens/real/BatchDetailScreen';
import { StudentBatchInviteScreen } from '../screens/real/StudentBatchInviteScreen';
import { StudentBatchInfoScreen } from '../screens/real/StudentBatchInfoScreen';
import { StudentAttendanceScreen } from '../screens/real/StudentAttendanceScreen';
import { StudentTestsScreen } from '../screens/real/StudentTestsScreen';
import { StudentNoticesScreen } from '../screens/real/StudentNoticesScreen';
import { AccountScreen } from '../screens/real/AccountScreen';
import { ComingSoonScreen } from '../screens/real/ComingSoonScreen';
import { ComingSoonListScreen } from '../screens/real/ComingSoonListScreen';
import { JoinBatchScreen } from '../screens/real/JoinBatchScreen';
import { StudentTimetableScreen } from '../screens/real/StudentTimetableScreen';
import { StudentFeesScreen } from '../screens/real/StudentFeesScreen';
import { BatchesScreen } from '../screens/real/BatchesScreen';
import { HonoursScreen } from '../screens/real/HonoursScreen';
import { joinCodeFromUrl } from '../lib/api/batches';
import { RealSideMenuProvider } from '../components/real/RealSideMenu';
import { realNavigationRef } from './realNavigationRef';

type IconName = React.ComponentProps<typeof Ionicons>['name'];

const Tabs = createBottomTabNavigator();
const AcademicsStack = createNativeStackNavigator();
const LearnStack = createNativeStackNavigator();
const MoreStack = createNativeStackNavigator();
const AuthStack = createNativeStackNavigator();
const RealStack = createNativeStackNavigator();
const RealTabs = createBottomTabNavigator();

function AuthNavigator() {
  return (
    <AuthStack.Navigator screenOptions={pushOptions}>
      <AuthStack.Screen name="Login" component={LoginScreen} />
      <AuthStack.Screen name="Signup" component={SignupScreen} />
      <AuthStack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
    </AuthStack.Navigator>
  );
}

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

const REAL_TABS: { name: string; label: string; icons: [IconName, IconName]; component: React.ComponentType }[] = [
  { name: 'RealHome', label: 'Home', icons: ['home', 'home-outline'], component: RealHomeScreen },
  { name: 'Batches', label: 'Batches', icons: ['people', 'people-outline'], component: BatchesScreen },
  { name: 'StudentTimetable', label: 'Timetable', icons: ['calendar', 'calendar-outline'], component: StudentTimetableScreen },
  { name: 'Honours', label: 'Honours', icons: ['trophy', 'trophy-outline'], component: HonoursScreen },
];

/** Bottom tabs of the real app; every tab is live, database-connected data. */
function RealTabsNavigator() {
  const { colors } = useTheme();
  return (
    <RealTabs.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
        // Height is left to the library so it adds the Android/iOS safe-area inset itself.
        tabBarStyle: { backgroundColor: colors.surface, borderTopColor: colors.border, paddingTop: 4 },
        tabBarLabelStyle: { fontFamily: fonts.sansSemibold, fontSize: 10.5 },
      }}
    >
      {REAL_TABS.map((t) => (
        <RealTabs.Screen
          key={t.name}
          name={t.name}
          component={t.component}
          options={{
            tabBarLabel: t.label,
            tabBarIcon: ({ color, size, focused }) => <Ionicons name={focused ? t.icons[0] : t.icons[1]} size={size - 2} color={color} />,
          }}
        />
      ))}
    </RealTabs.Navigator>
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
  const { session, loading, recovering, demo } = useAuth();

  // A join link (https://vilarci.in/join/…, vilarcistudy://join/…, or Expo Go's
  // exp://…/--/join/…) is remembered until the real app is open, so it also
  // works when the person still has to log in first.
  const url = Linking.useURL();
  const [pendingJoin, setPendingJoin] = useState<string | null>(null);
  useEffect(() => {
    const code = joinCodeFromUrl(url);
    if (code) setPendingJoin(code);
  }, [url]);

  const openPendingJoin = () => {
    if (!pendingJoin || !realNavigationRef.isReady()) return;
    realNavigationRef.navigate('JoinBatch', { code: pendingJoin });
    setPendingJoin(null);
  };
  useEffect(openPendingJoin, [pendingJoin, session, demo]);

  if (loading) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.bgApp }}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  // Signed-out (or mid password reset) users only see the auth screens.
  if ((!session && !demo) || recovering) {
    return (
      <NavigationContainer theme={navTheme(isDark, colors)}>
        <AuthNavigator />
      </NavigationContainer>
    );
  }

  // Signed in → the real, database-connected app. The demo screens below are
  // reached from its "Demo" button and keep tracking the original plan.
  if (session && !demo) {
    return (
      <RealSideMenuProvider>
        <NavigationContainer ref={realNavigationRef} theme={navTheme(isDark, colors)} onReady={openPendingJoin}>
          <RealStack.Navigator screenOptions={pushOptions}>
            <RealStack.Screen name="Tabs" component={RealTabsNavigator} />
            <RealStack.Screen name="StudentProfile" component={StudentProfileScreen} />
            <RealStack.Screen name="StudentForm" component={StudentFormScreen} />
            <RealStack.Screen name="Account" component={AccountScreen} />
            <RealStack.Screen name="ComingSoon" component={ComingSoonScreen} />
            <RealStack.Screen name="ComingSoonList" component={ComingSoonListScreen} />
            <RealStack.Screen name="JoinBatch" component={JoinBatchScreen} />
            <RealStack.Screen name="BatchDetail" component={BatchDetailScreen} />
            <RealStack.Screen name="BatchInvite" component={StudentBatchInviteScreen} />
            <RealStack.Screen name="BatchInfo" component={StudentBatchInfoScreen} />
            {/* Attendance: every batch (from the menu) or one batch (from the batch page). */}
            <RealStack.Screen name="StudentAttendance" component={StudentAttendanceScreen} />
            <RealStack.Screen name="StudentTests" component={StudentTestsScreen} />
            {/* Notices: every batch (bell, menu, Home) or one batch (its page). */}
            <RealStack.Screen name="StudentNotices" component={StudentNoticesScreen} />
            {/* Fees: every batch (from the menu) or one batch's ledger (from the batch page). */}
            <RealStack.Screen name="StudentFees" component={StudentFeesScreen} />
            <RealStack.Screen name="BatchFees" component={StudentFeesScreen} />
          </RealStack.Navigator>
        </NavigationContainer>
      </RealSideMenuProvider>
    );
  }

  return (
    <SideMenuProvider>
      <NavigationContainer ref={navigationRef} theme={navTheme(isDark, colors)}>
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
      {session ? <BackToAccountPill /> : null}
    </SideMenuProvider>
  );
}

/** Floating way back from the demo screens to the signed-in real app. */
function BackToAccountPill() {
  const { colors } = useTheme();
  const { exitDemo } = useAuth();
  const insets = useSafeAreaInsets();
  return (
    <View pointerEvents="box-none" style={{ position: 'absolute', left: 0, right: 0, bottom: (Platform.OS === 'ios' ? 84 : 62) + insets.bottom + 10, alignItems: 'center' }}>
      <Pressable
        onPress={exitDemo}
        accessibilityRole="button"
        accessibilityLabel="Back to my account"
        style={({ pressed }) => ({
          flexDirection: 'row',
          alignItems: 'center',
          gap: 6,
          paddingHorizontal: 14,
          paddingVertical: 9,
          borderRadius: 999,
          backgroundColor: colors.primary,
          opacity: pressed ? 0.85 : 1,
          ...elevation(2, colors.shadowColor, colors.shadowOpacity + 0.1),
        })}
      >
        <Ionicons name="arrow-undo-outline" size={15} color="#fff" />
        <Text style={{ color: '#fff', fontFamily: fonts.sansSemibold, fontSize: 12.5 }}>Demo · Back to my account</Text>
      </Pressable>
    </View>
  );
}
