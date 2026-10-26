import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
  Easing,
  Modal,
  PanResponder,
  Pressable,
  ScrollView,
  StyleSheet,
  useWindowDimensions,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Ionicons from '@expo/vector-icons/Ionicons';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../theme/ThemeProvider';
import { elevation, fonts, radius, spacing } from '../theme/tokens';
import { useAppStore } from '../lib/store/useAppStore';
import { useFees, useHousehold, usePoints, useStudentContext } from '../lib/api/hooks';
import { navigationRef } from '../navigation/navigationRef';
import { accountName, useAuth } from '../lib/AuthProvider';
import { signOut } from '../lib/auth';
import { rupees } from '../lib/utils/format';
import { AppText, Avatar, Pill, Row } from './ui/base';

type IconName = React.ComponentProps<typeof Ionicons>['name'];

interface MenuItem {
  /** Leaf route name, used for the active highlight. */
  route: string;
  /** Tab that owns the route; omitted when the route is itself a tab. */
  tab?: string;
  label: string;
  icon: IconName;
}

const SECTIONS: { title: string; items: MenuItem[] }[] = [
  {
    title: 'OVERVIEW',
    items: [
      { route: 'Home', label: 'Dashboard', icon: 'home-outline' },
      { route: 'Honours', label: 'Honours', icon: 'trophy-outline' },
    ],
  },
  {
    title: 'ACADEMICS',
    items: [
      { route: 'Timetable', tab: 'Academics', label: 'Timetable', icon: 'calendar-outline' },
      { route: 'Attendance', tab: 'Academics', label: 'Attendance', icon: 'checkmark-done-outline' },
      { route: 'Syllabus', tab: 'Academics', label: 'Syllabus', icon: 'book-outline' },
      { route: 'Tests', tab: 'Academics', label: 'Tests & Results', icon: 'document-text-outline' },
      { route: 'Marksheets', tab: 'Academics', label: 'Marksheets', icon: 'ribbon-outline' },
    ],
  },
  {
    title: 'LEARN',
    items: [
      { route: 'Labs', tab: 'Learn', label: 'STEM Labs', icon: 'flask-outline' },
      { route: 'Videos', tab: 'Learn', label: 'Lessons', icon: 'play-circle-outline' },
      { route: 'Focus', tab: 'Learn', label: 'Focus Room', icon: 'timer-outline' },
      { route: 'Practice', tab: 'Learn', label: 'Practice', icon: 'help-circle-outline' },
    ],
  },
  {
    title: 'FAMILY & ACCOUNT',
    items: [
      { route: 'Fees', tab: 'More', label: 'Fees', icon: 'wallet-outline' },
      { route: 'Parent', tab: 'More', label: 'Household', icon: 'people-outline' },
      { route: 'Verify', tab: 'More', label: 'Verify Documents', icon: 'shield-checkmark-outline' },
      { route: 'Settings', tab: 'More', label: 'Settings', icon: 'settings-outline' },
      { route: 'Help', tab: 'More', label: 'Help & Support', icon: 'help-buoy-outline' },
    ],
  },
];

const SideMenuContext = createContext<{ open: () => void } | null>(null);

export function useSideMenu() {
  const ctx = useContext(SideMenuContext);
  if (!ctx) throw new Error('useSideMenu must be used inside <SideMenuProvider>');
  return ctx;
}

/**
 * Website-style sidebar for the app: slides in from the left over every tab and
 * reaches every section in one tap. Drag left or tap the scrim to dismiss.
 */
export function SideMenuProvider({ children }: { children: React.ReactNode }) {
  const [visible, setVisible] = useState(false);
  const [activeRoute, setActiveRoute] = useState<string | undefined>();

  const open = useCallback(() => {
    Haptics.selectionAsync().catch(() => {});
    setActiveRoute(navigationRef.isReady() ? navigationRef.getCurrentRoute()?.name : undefined);
    setVisible(true);
  }, []);

  const value = useMemo(() => ({ open }), [open]);

  return (
    <SideMenuContext.Provider value={value}>
      {children}
      <Drawer visible={visible} activeRoute={activeRoute} onClosed={() => setVisible(false)} />
    </SideMenuContext.Provider>
  );
}

/** ☰ trigger shown at the top-left of every screen. */
export function MenuButton() {
  const { colors } = useTheme();
  const { open } = useSideMenu();
  return (
    <Pressable
      onPress={open}
      accessibilityRole="button"
      accessibilityLabel="Open menu"
      hitSlop={8}
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
          ...elevation(1, colors.shadowColor, colors.shadowOpacity),
        },
      ]}
    >
      <Ionicons name="menu" size={20} color={colors.textMain} />
    </Pressable>
  );
}

// ─── Drawer panel ─────────────────────────────────────────────────────────────

function Drawer({
  visible,
  activeRoute,
  onClosed,
}: {
  visible: boolean;
  activeRoute?: string;
  onClosed: () => void;
}) {
  const { colors, isDark, setMode } = useTheme();
  const insets = useSafeAreaInsets();
  const { width: screenWidth } = useWindowDimensions();
  const width = Math.min(320, screenWidth * 0.84);

  const progress = useRef(new Animated.Value(0)).current;
  const drag = useRef(new Animated.Value(0)).current;
  const pendingNav = useRef<(() => void) | null>(null);

  const { summary } = useFees();
  const points = usePoints();
  const { session, profile, demo, exitDemo } = useAuth();

  useEffect(() => {
    if (!visible) return;
    drag.setValue(0);
    Animated.timing(progress, {
      toValue: 1,
      duration: 260,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [visible, progress, drag]);

  const close = useCallback(
    (after?: () => void) => {
      pendingNav.current = after ?? null;
      Animated.timing(progress, {
        toValue: 0,
        duration: 200,
        easing: Easing.in(Easing.cubic),
        useNativeDriver: true,
      }).start(() => {
        onClosed();
        pendingNav.current?.();
        pendingNav.current = null;
      });
    },
    [progress, onClosed],
  );

  const pan = useMemo(
    () =>
      PanResponder.create({
        onMoveShouldSetPanResponder: (_, g) => g.dx < -8 && Math.abs(g.dx) > Math.abs(g.dy),
        onPanResponderMove: (_, g) => drag.setValue(Math.min(0, g.dx)),
        onPanResponderRelease: (_, g) => {
          if (g.dx < -width * 0.3 || g.vx < -0.5) {
            close();
          } else {
            Animated.spring(drag, { toValue: 0, useNativeDriver: true, bounciness: 0 }).start();
          }
        },
      }),
    [drag, width, close],
  );

  const go = (item: MenuItem) => {
    close(() => {
      if (!navigationRef.isReady()) return;
      if (item.tab) navigationRef.navigate(item.tab, { screen: item.route });
      else navigationRef.navigate(item.route);
    });
  };

  const translateX = Animated.add(
    progress.interpolate({ inputRange: [0, 1], outputRange: [-width, 0] }),
    drag,
  );

  const badgeFor = (route: string): React.ReactNode => {
    if (route === 'Fees' && summary.pendingTotal) {
      return <Pill label={rupees(summary.pendingTotal)} tone={summary.overdue.length ? 'error' : 'warning'} />;
    }
    if (route === 'Honours') {
      return (
        <AppText variant="captionStrong" tone="gold">
          {points.total.toLocaleString('en-IN')}
        </AppText>
      );
    }
    return null;
  };

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={() => close()} statusBarTranslucent>
      <Animated.View style={[StyleSheet.absoluteFill, { backgroundColor: colors.scrim, opacity: progress }]}>
        <Pressable style={StyleSheet.absoluteFill} onPress={() => close()} accessibilityLabel="Close menu" />
      </Animated.View>

      <Animated.View
        {...pan.panHandlers}
        style={{
          position: 'absolute',
          top: 0,
          bottom: 0,
          left: 0,
          width,
          backgroundColor: colors.bgApp,
          borderTopRightRadius: radius.xl,
          borderBottomRightRadius: radius.xl,
          overflow: 'hidden',
          transform: [{ translateX }],
          ...elevation(3, colors.shadowColor, colors.shadowOpacity + 0.1),
        }}
      >
        {/* ── Brand ───────────────────────────────────────────────────────── */}
        <Row
          justify="space-between"
          style={{ paddingTop: insets.top + spacing.md, paddingHorizontal: spacing.lg, paddingBottom: spacing.md }}
        >
          <Row gap={spacing.sm}>
            <LinearGradient
              colors={colors.primaryGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={{ width: 36, height: 36, borderRadius: 11, alignItems: 'center', justifyContent: 'center' }}
            >
              <AppText style={{ fontFamily: fonts.displayBold, fontSize: 19, color: '#FDFBF9' }}>V</AppText>
            </LinearGradient>
            <View>
              <AppText variant="heading">Vilarci Study</AppText>
              <AppText variant="overline" tone="muted">
                STUDENT & PARENT
              </AppText>
            </View>
          </Row>
          <Pressable
            onPress={() => close()}
            hitSlop={10}
            accessibilityRole="button"
            accessibilityLabel="Close menu"
            style={({ pressed }) => ({
              width: 32,
              height: 32,
              borderRadius: 16,
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: colors.surfaceMuted,
              opacity: pressed ? 0.6 : 1,
            })}
          >
            <Ionicons name="close" size={18} color={colors.textSecondary} />
          </Pressable>
        </Row>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: spacing.lg }}>
          <ProfilePanel
            onManage={() =>
              close(() => navigationRef.isReady() && navigationRef.navigate('More', { screen: 'Parent' }))
            }
          />

          {/* ── Navigation ──────────────────────────────────────────────────── */}
          {SECTIONS.map((section) => (
            <View key={section.title} style={{ marginTop: spacing.lg, paddingHorizontal: spacing.md }}>
              <AppText variant="overline" tone="muted" style={{ paddingHorizontal: spacing.sm, marginBottom: 4 }}>
                {section.title}
              </AppText>
              {section.items.map((item) => {
                const active =
                  item.route === activeRoute || (item.route === 'Home' && activeRoute === undefined);
                return (
                  <Pressable
                    key={item.route}
                    onPress={() => go(item)}
                    accessibilityRole="button"
                    accessibilityState={{ selected: active }}
                    style={({ pressed }) => ({
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: spacing.md,
                      paddingVertical: 10,
                      paddingHorizontal: spacing.sm,
                      borderRadius: radius.md,
                      backgroundColor: active ? colors.primarySubtle : pressed ? colors.surfaceMuted : 'transparent',
                    })}
                  >
                    {active ? (
                      <View
                        style={{
                          position: 'absolute',
                          left: 0,
                          top: 10,
                          bottom: 10,
                          width: 3,
                          borderRadius: 2,
                          backgroundColor: colors.primary,
                        }}
                      />
                    ) : null}
                    <Ionicons
                      name={active ? (item.icon.replace('-outline', '') as IconName) : item.icon}
                      size={19}
                      color={active ? colors.primary : colors.textSecondary}
                    />
                    <AppText
                      variant={active ? 'captionStrong' : 'bodyStrong'}
                      style={{ flex: 1, fontSize: 14, color: active ? colors.primary : colors.textMain }}
                    >
                      {item.label}
                    </AppText>
                    {badgeFor(item.route)}
                  </Pressable>
                );
              })}
            </View>
          ))}
        </ScrollView>

        {/* ── Footer ──────────────────────────────────────────────────────── */}
        <Row
          justify="space-between"
          style={{
            paddingHorizontal: spacing.lg,
            paddingTop: spacing.md,
            paddingBottom: insets.bottom + spacing.md,
            borderTopWidth: StyleSheet.hairlineWidth,
            borderTopColor: colors.border,
          }}
        >
          <Pressable
            onPress={() => close(demo ? exitDemo : () => signOut().catch(() => {}))}
            accessibilityRole="button"
            accessibilityLabel={demo ? 'Exit demo and log in' : 'Log out'}
            style={({ pressed }) => ({ flex: 1, flexDirection: 'row', alignItems: 'center', gap: spacing.sm, opacity: pressed ? 0.6 : 1 })}
          >
            <View
              style={{
                width: 32,
                height: 32,
                borderRadius: 16,
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: colors.errorBg,
              }}
            >
              <Ionicons name={demo ? 'log-in-outline' : 'log-out-outline'} size={16} color={colors.errorText} />
            </View>
            <View style={{ flex: 1 }}>
              <AppText variant="captionStrong" numberOfLines={1}>
                {demo ? 'Demo mode' : accountName(profile, session)}
              </AppText>
              <AppText variant="caption" tone="muted">
                {demo ? 'Exit & log in' : 'Log out'}
              </AppText>
            </View>
          </Pressable>
          <Pressable
            onPress={() => setMode(isDark ? 'light' : 'dark')}
            accessibilityRole="button"
            accessibilityLabel={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
            style={({ pressed }) => ({
              flexDirection: 'row',
              alignItems: 'center',
              gap: 6,
              paddingHorizontal: spacing.md,
              paddingVertical: 7,
              borderRadius: radius.pill,
              backgroundColor: colors.surfaceMuted,
              opacity: pressed ? 0.6 : 1,
            })}
          >
            <Ionicons name={isDark ? 'sunny-outline' : 'moon-outline'} size={14} color={colors.textSecondary} />
            <AppText variant="captionStrong" tone="secondary">
              {isDark ? 'Light' : 'Dark'}
            </AppText>
          </Pressable>
        </Row>
      </Animated.View>
    </Modal>
  );
}

// ─── Current student + switcher ───────────────────────────────────────────────

const ON_DARK = '#FDFBF9';
const ON_DARK_SOFT = 'rgba(253,251,249,0.66)';
const ON_DARK_LINE = 'rgba(253,251,249,0.18)';

function attendanceTint(rate: number, colors: ReturnType<typeof useTheme>['colors']) {
  return rate >= 85 ? colors.success : rate >= 75 ? colors.warning : colors.error;
}

function ProfilePanel({ onManage }: { onManage: () => void }) {
  const { colors } = useTheme();
  const ctx = useStudentContext();
  const points = usePoints();
  const { rows, household } = useHousehold();
  const setCurrentStudent = useAppStore((s) => s.setCurrentStudent);

  const current = rows.find((r) => r.student.id === ctx.student.id);
  const centre = ctx.isAllCenters ? null : ctx.activeCenter;

  return (
    <View style={{ marginHorizontal: spacing.lg }}>
      {/* Viewing card */}
      <LinearGradient
        colors={colors.heroGradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{ borderRadius: radius.lg, padding: spacing.lg, overflow: 'hidden' }}
      >
        <Row justify="space-between" align="flex-start">
          <Avatar initials={ctx.student.photo_initials} gradient={ctx.student.avatar_gradient} size={54} ring />
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 5,
              paddingHorizontal: 9,
              paddingVertical: 4,
              borderRadius: radius.pill,
              backgroundColor: 'rgba(253,251,249,0.12)',
            }}
          >
            <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: colors.goldBright }} />
            <AppText variant="overline" style={{ color: ON_DARK, letterSpacing: 1 }}>
              VIEWING
            </AppText>
          </View>
        </Row>

        <AppText variant="title" numberOfLines={1} style={{ color: ON_DARK, marginTop: spacing.md }}>
          {ctx.student.name}
        </AppText>
        <AppText variant="caption" numberOfLines={1} style={{ color: ON_DARK_SOFT }}>
          {ctx.student.class} · {ctx.student.board} · Roll {ctx.student.roll}
        </AppText>

        <Row gap={6} style={{ marginTop: spacing.sm }}>
          <Ionicons name={centre ? 'business-outline' : 'layers-outline'} size={13} color={colors.goldBright} />
          <AppText variant="captionStrong" numberOfLines={1} style={{ color: colors.goldBright, flex: 1 }}>
            {centre ? centre.name : `All ${ctx.enrolledCenters.length} centres`}
          </AppText>
        </Row>

        <View style={{ height: StyleSheet.hairlineWidth, backgroundColor: ON_DARK_LINE, marginVertical: spacing.md }} />

        <Row>
          <PanelStat value={points.total.toLocaleString('en-IN')} label="POINTS" />
          <View style={{ width: StyleSheet.hairlineWidth, alignSelf: 'stretch', backgroundColor: ON_DARK_LINE }} />
          <PanelStat value={`${points.streak}d`} label="STREAK" />
          <View style={{ width: StyleSheet.hairlineWidth, alignSelf: 'stretch', backgroundColor: ON_DARK_LINE }} />
          <PanelStat value={current ? `${current.attendanceRate.toFixed(0)}%` : '—'} label="ATTEND." />
        </Row>
      </LinearGradient>

      {/* Switcher */}
      <Row justify="space-between" style={{ marginTop: spacing.lg, marginBottom: spacing.sm, paddingHorizontal: 2 }}>
        <AppText variant="overline" tone="muted">
          SWITCH STUDENT · {rows.length}/{household.max_profiles}
        </AppText>
        <Pressable onPress={onManage} hitSlop={8} accessibilityRole="button">
          <AppText variant="captionStrong" tone="primary">
            Manage
          </AppText>
        </Pressable>
      </Row>

      <View
        style={{
          borderRadius: radius.lg,
          backgroundColor: colors.surface,
          borderWidth: StyleSheet.hairlineWidth,
          borderColor: colors.border,
          padding: 4,
        }}
      >
        {rows.map((r) => {
          const active = r.student.id === ctx.student.id;
          return (
            <Pressable
              key={r.student.id}
              onPress={() => {
                if (active) return;
                Haptics.selectionAsync().catch(() => {});
                setCurrentStudent(r.student.id);
              }}
              accessibilityRole="radio"
              accessibilityState={{ checked: active }}
              accessibilityLabel={`${r.student.name}, ${r.student.class}`}
              style={({ pressed }) => ({
                flexDirection: 'row',
                alignItems: 'center',
                gap: spacing.md,
                padding: spacing.sm,
                borderRadius: radius.md,
                backgroundColor: active ? colors.primarySubtle : pressed ? colors.surfaceMuted : 'transparent',
              })}
            >
              <Avatar initials={r.student.photo_initials} gradient={r.student.avatar_gradient} size={36} ring={active} />
              <View style={{ flex: 1 }}>
                <AppText
                  variant="captionStrong"
                  numberOfLines={1}
                  style={{ fontSize: 13.5, color: active ? colors.primary : colors.textMain }}
                >
                  {r.student.name}
                </AppText>
                <Row gap={6}>
                  <AppText variant="caption" tone="muted" numberOfLines={1} style={{ flexShrink: 1 }}>
                    {r.student.class}
                  </AppText>
                  <View
                    style={{ width: 5, height: 5, borderRadius: 3, backgroundColor: attendanceTint(r.attendanceRate, colors) }}
                  />
                  <AppText variant="caption" tone="muted">
                    {r.attendanceRate.toFixed(0)}%
                  </AppText>
                  {r.pendingFees ? (
                    <AppText variant="caption" tone="error">
                      · {rupees(r.pendingFees)} due
                    </AppText>
                  ) : null}
                </Row>
              </View>
              <View
                style={{
                  width: 20,
                  height: 20,
                  borderRadius: 10,
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderWidth: active ? 0 : 1.5,
                  borderColor: colors.borderStrong,
                  backgroundColor: active ? colors.primary : 'transparent',
                }}
              >
                {active ? <Ionicons name="checkmark" size={13} color="#fff" /> : null}
              </View>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

function PanelStat({ value, label }: { value: string; label: string }) {
  return (
    <View style={{ flex: 1, alignItems: 'center' }}>
      <AppText variant="subheading" style={{ color: ON_DARK }}>
        {value}
      </AppText>
      <AppText variant="overline" style={{ color: ON_DARK_SOFT, fontSize: 9, marginTop: 1 }}>
        {label}
      </AppText>
    </View>
  );
}
