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
import { useTheme } from '../../theme/ThemeProvider';
import { elevation, radius, spacing } from '../../theme/tokens';
import { accountName, useAuth } from '../../lib/AuthProvider';
import { signOut } from '../../lib/auth';
import { fullName, initialsOf, MAX_STUDENT_PROFILES, relationLabel, StudentProfile } from '../../lib/api/studentProfiles';
import { useActiveStudent } from '../../lib/store/useActiveStudent';
import { COMING_SOON_COUNT } from '../../lib/comingSoon';
import { gradientFor } from '../../lib/utils/profileColors';
import { navigateToTab, REAL_TAB_ROUTES, RealTabRoute, realNavigationRef } from '../../navigation/realNavigationRef';
import { AppText, Avatar, IconName, Pill, Row } from '../ui/base';

interface MenuItem {
  label: string;
  icon: IconName;
  /** Real screen to open; absent = not built yet → "Coming soon". */
  route?: 'RealHome' | 'Account' | 'JoinBatch' | 'StudentTimetable' | 'StudentFees' | 'Honours' | 'ComingSoonList';
  badge?: string;
}

/**
 * Same sections as the original plan (the demo). Items with a route are live
 * and database-connected; the rest open the Coming soon screen.
 */
const SECTIONS: { title: string; items: MenuItem[] }[] = [
  {
    title: 'OVERVIEW',
    items: [
      { label: 'Home', icon: 'home-outline', route: 'RealHome' },
      { label: 'Join a batch', icon: 'enter-outline', route: 'JoinBatch' },
      { label: 'Honours', icon: 'trophy-outline', route: 'Honours', badge: 'Soon' },
    ],
  },
  {
    title: 'ACADEMICS',
    items: [
      { label: 'Timetable', icon: 'calendar-outline', route: 'StudentTimetable' },
      { label: 'Attendance', icon: 'checkmark-done-outline' },
      { label: 'Syllabus', icon: 'book-outline' },
      { label: 'Tests & Results', icon: 'document-text-outline' },
      { label: 'Marksheets', icon: 'ribbon-outline' },
    ],
  },
  {
    title: 'LEARN',
    items: [
      { label: 'STEM Labs', icon: 'flask-outline' },
      { label: 'Lessons', icon: 'play-circle-outline' },
      { label: 'Focus Room', icon: 'timer-outline' },
      { label: 'Practice', icon: 'help-circle-outline' },
    ],
  },
  {
    title: 'CENTRES & ACCOUNT',
    items: [
      { label: 'Coaching centres', icon: 'business-outline' },
      { label: 'Fees', icon: 'wallet-outline', route: 'StudentFees' },
      { label: 'Verify Documents', icon: 'shield-checkmark-outline' },
      { label: 'My account', icon: 'person-circle-outline', route: 'Account' },
      { label: 'Help & Support', icon: 'help-buoy-outline' },
      { label: 'All coming soon', icon: 'hourglass-outline', route: 'ComingSoonList', badge: String(COMING_SOON_COUNT) },
    ],
  },
];

const RealSideMenuContext = createContext<{ open: () => void } | null>(null);

export function useRealSideMenu() {
  const ctx = useContext(RealSideMenuContext);
  if (!ctx) throw new Error('useRealSideMenu must be used inside <RealSideMenuProvider>');
  return ctx;
}

export function RealSideMenuProvider({ children }: { children: React.ReactNode }) {
  const [visible, setVisible] = useState(false);
  const [active, setActive] = useState<{ route?: string; title?: string }>({});

  const open = useCallback(() => {
    Haptics.selectionAsync().catch(() => {});
    const current = realNavigationRef.isReady() ? realNavigationRef.getCurrentRoute() : undefined;
    setActive({ route: current?.name, title: (current?.params as { title?: string } | undefined)?.title });
    setVisible(true);
  }, []);

  const value = useMemo(() => ({ open }), [open]);

  return (
    <RealSideMenuContext.Provider value={value}>
      {children}
      <Drawer visible={visible} active={active} onClosed={() => setVisible(false)} />
    </RealSideMenuContext.Provider>
  );
}

/** ☰ trigger for real-app screens. */
export function RealMenuButton() {
  const { colors } = useTheme();
  const { open } = useRealSideMenu();
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

function Drawer({
  visible,
  active,
  onClosed,
}: {
  visible: boolean;
  active: { route?: string; title?: string };
  onClosed: () => void;
}) {
  const { colors, isDark, setMode } = useTheme();
  const insets = useSafeAreaInsets();
  const { width: screenWidth } = useWindowDimensions();
  const width = Math.min(320, screenWidth * 0.84);
  const { session, profile, enterDemo } = useAuth();
  const { active: student, activeIndex, profiles, setActive } = useActiveStudent();

  const progress = useRef(new Animated.Value(0)).current;
  const drag = useRef(new Animated.Value(0)).current;
  const after = useRef<(() => void) | null>(null);

  useEffect(() => {
    if (!visible) return;
    drag.setValue(0);
    Animated.timing(progress, { toValue: 1, duration: 260, easing: Easing.out(Easing.cubic), useNativeDriver: true }).start();
  }, [visible, progress, drag]);

  const close = useCallback(
    (then?: () => void) => {
      after.current = then ?? null;
      Animated.timing(progress, { toValue: 0, duration: 200, easing: Easing.in(Easing.cubic), useNativeDriver: true }).start(() => {
        onClosed();
        after.current?.();
        after.current = null;
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
          if (g.dx < -width * 0.3 || g.vx < -0.5) close();
          else Animated.spring(drag, { toValue: 0, useNativeDriver: true, bounciness: 0 }).start();
        },
      }),
    [drag, width, close],
  );

  const go = (item: MenuItem) =>
    close(() => {
      if (!realNavigationRef.isReady()) return;
      if (item.route && (REAL_TAB_ROUTES as readonly string[]).includes(item.route)) navigateToTab(realNavigationRef, item.route as RealTabRoute);
      else if (item.route) realNavigationRef.navigate(item.route);
      else realNavigationRef.navigate('ComingSoon', { title: item.label, icon: item.icon });
    });

  const isActive = (item: MenuItem) =>
    item.route
      ? item.route === active.route
      : active.route === 'ComingSoon' && active.title === item.label;

  const translateX = Animated.add(progress.interpolate({ inputRange: [0, 1], outputRange: [-width, 0] }), drag);
  const name = accountName(profile, session);
  const initials = `${profile?.first_name?.[0] ?? name[0] ?? 'V'}${profile?.last_name?.[0] ?? ''}`.toUpperCase();

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={() => close()}
      statusBarTranslucent
      // Draw under the Android navigation bar too, so the safe-area bottom
      // padding below lines the footer up above it instead of being clipped.
      navigationBarTranslucent
    >
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
        {/* ── Active student: whose things the app is showing ─────────── */}
        <LinearGradient
          colors={colors.heroGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{ paddingTop: insets.top + spacing.md, paddingHorizontal: spacing.lg, paddingBottom: spacing.lg }}
        >
          <Row justify="space-between">
            <Pressable
              onPress={() => go({ label: 'My account', icon: 'person-circle-outline', route: 'Account' })}
              accessibilityRole="button"
              accessibilityLabel="My account"
              style={({ pressed }) => ({ flexDirection: 'row', alignItems: 'center', gap: spacing.sm, flex: 1, opacity: pressed ? 0.7 : 1 })}
            >
              <Avatar initials={initials} gradient={['#5a0812', '#8E1437']} size={28} />
              <View style={{ flex: 1 }}>
                <AppText variant="captionStrong" numberOfLines={1} style={{ color: '#FDFBF9' }}>
                  {name}
                </AppText>
                <AppText variant="caption" numberOfLines={1} style={{ color: 'rgba(253,251,249,0.6)', fontSize: 11 }}>
                  Account · {profile?.email ?? profile?.whatsapp_number ?? 'Vilarci Study'}
                </AppText>
              </View>
            </Pressable>
            <Pressable
              onPress={() => close()}
              hitSlop={10}
              accessibilityRole="button"
              accessibilityLabel="Close menu"
              style={{ width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(253,251,249,0.14)' }}
            >
              <Ionicons name="close" size={18} color="#FDFBF9" />
            </Pressable>
          </Row>

          <View style={{ height: StyleSheet.hairlineWidth, backgroundColor: 'rgba(253,251,249,0.2)', marginVertical: spacing.md }} />

          {student ? (
            <Row gap={spacing.md}>
              <Avatar initials={initialsOf(student)} gradient={gradientFor(activeIndex)} size={52} ring />
              <View style={{ flex: 1 }}>
                <Row gap={5}>
                  <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: colors.goldBright }} />
                  <AppText variant="overline" style={{ color: colors.goldBright }}>
                    ACTIVE STUDENT
                  </AppText>
                </Row>
                <AppText variant="title" numberOfLines={1} style={{ color: '#FDFBF9' }}>
                  {fullName(student)}
                </AppText>
                <AppText variant="caption" numberOfLines={1} style={{ color: 'rgba(253,251,249,0.7)' }}>
                  {describeStudent(student)}
                </AppText>
              </View>
            </Row>
          ) : (
            <AppText variant="caption" style={{ color: 'rgba(253,251,249,0.75)' }}>
              No student yet — add yourself or someone you study for.
            </AppText>
          )}
        </LinearGradient>

        {/* ── Navigation ──────────────────────────────────────────────── */}
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: spacing.lg }}>
          {/* ── Switch student ─────────────────────────────────────────── */}
          <View style={{ marginTop: spacing.lg, paddingHorizontal: spacing.md }}>
            <AppText variant="overline" tone="muted" style={{ paddingHorizontal: spacing.sm, marginBottom: 6 }}>
              SWITCH STUDENT · {profiles.length}/{MAX_STUDENT_PROFILES}
            </AppText>
            <View style={{ gap: 4 }}>
              {profiles.map((p, i) => {
                const on = p.id === student?.id;
                return (
                  <Row
                    key={p.id}
                    gap={spacing.sm}
                    style={{ padding: spacing.sm, borderRadius: radius.md, backgroundColor: on ? colors.primarySubtle : 'transparent' }}
                  >
                    <Pressable
                      onPress={() => {
                        if (!on) {
                          Haptics.selectionAsync().catch(() => {});
                          setActive(p.id);
                        }
                        close(() => realNavigationRef.isReady() && navigateToTab(realNavigationRef, 'RealHome'));
                      }}
                      accessibilityRole="radio"
                      accessibilityState={{ checked: on }}
                      accessibilityLabel={`Switch to ${fullName(p)}`}
                      style={({ pressed }) => ({ flex: 1, flexDirection: 'row', alignItems: 'center', gap: spacing.md, opacity: pressed ? 0.7 : 1 })}
                    >
                      <Avatar initials={initialsOf(p)} gradient={gradientFor(i)} size={36} ring={on} />
                      <View style={{ flex: 1 }}>
                        <AppText variant="captionStrong" numberOfLines={1} style={{ fontSize: 13.5, color: on ? colors.primary : colors.textMain }}>
                          {fullName(p)}
                        </AppText>
                        <AppText variant="caption" tone="muted" numberOfLines={1}>
                          {describeStudent(p)}
                        </AppText>
                      </View>
                      <Ionicons name={on ? 'checkmark-circle' : 'ellipse-outline'} size={20} color={on ? colors.primary : colors.borderStrong} />
                    </Pressable>
                    <Pressable
                      onPress={() => close(() => realNavigationRef.isReady() && realNavigationRef.navigate('StudentForm', { id: p.id }))}
                      hitSlop={8}
                      accessibilityRole="button"
                      accessibilityLabel={`Edit ${fullName(p)}`}
                      style={({ pressed }) => ({ padding: 4, opacity: pressed ? 0.5 : 1 })}
                    >
                      <Ionicons name="create-outline" size={17} color={colors.textMuted} />
                    </Pressable>
                  </Row>
                );
              })}
              {profiles.length < MAX_STUDENT_PROFILES ? (
                <Pressable
                  onPress={() => close(() => realNavigationRef.isReady() && realNavigationRef.navigate('StudentForm'))}
                  accessibilityRole="button"
                  style={({ pressed }) => ({
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: spacing.md,
                    padding: spacing.sm,
                    borderRadius: radius.md,
                    borderWidth: 1.5,
                    borderStyle: 'dashed',
                    borderColor: colors.borderStrong,
                    opacity: pressed ? 0.7 : 1,
                  })}
                >
                  <View style={{ width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.primarySubtle }}>
                    <Ionicons name="add" size={20} color={colors.primary} />
                  </View>
                  <AppText variant="captionStrong" tone="primary" style={{ fontSize: 13.5 }}>
                    Add student
                  </AppText>
                </Pressable>
              ) : null}
            </View>
          </View>

          {SECTIONS.map((section) => (
            <View key={section.title} style={{ marginTop: spacing.lg, paddingHorizontal: spacing.md }}>
              <AppText variant="overline" tone="muted" style={{ paddingHorizontal: spacing.sm, marginBottom: 4 }}>
                {section.title}
              </AppText>
              {section.items.map((item) => {
                const on = isActive(item);
                const ready = Boolean(item.route);
                return (
                  <Pressable
                    key={item.label}
                    onPress={() => go(item)}
                    accessibilityRole="button"
                    accessibilityState={{ selected: on }}
                    style={({ pressed }) => ({
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: spacing.md,
                      paddingVertical: 10,
                      paddingHorizontal: spacing.sm,
                      borderRadius: radius.md,
                      backgroundColor: on ? colors.primarySubtle : pressed ? colors.surfaceMuted : 'transparent',
                    })}
                  >
                    {on ? <View style={[styles.activeBar, { backgroundColor: colors.primary }]} /> : null}
                    <Ionicons
                      name={on ? (item.icon.replace('-outline', '') as IconName) : item.icon}
                      size={19}
                      color={on ? colors.primary : ready ? colors.textSecondary : colors.textMuted}
                    />
                    <AppText
                      variant={on ? 'captionStrong' : 'bodyStrong'}
                      style={{ flex: 1, fontSize: 14, color: on ? colors.primary : ready ? colors.textMain : colors.textSecondary }}
                    >
                      {item.label}
                    </AppText>
                    {item.badge ? <Pill label={item.badge} tone="gold" /> : ready ? null : <Pill label="Soon" tone="neutral" />}
                  </Pressable>
                );
              })}
            </View>
          ))}

          {/* Inside the scroll area so it can always be reached, however
              small the screen or tall the student list. */}
          <View style={{ marginTop: spacing.lg, paddingHorizontal: spacing.md }}>
            <Pressable
              onPress={() => close(() => signOut().catch(() => {}))}
              accessibilityRole="button"
              style={({ pressed }) => ({
                flexDirection: 'row',
                alignItems: 'center',
                gap: spacing.md,
                paddingVertical: 12,
                paddingHorizontal: spacing.md,
                borderRadius: radius.md,
                backgroundColor: colors.errorBg,
                opacity: pressed ? 0.75 : 1,
              })}
            >
              <Ionicons name="log-out-outline" size={19} color={colors.errorText} />
              <AppText variant="bodyStrong" style={{ flex: 1, fontSize: 14, color: colors.errorText }}>
                Log out
              </AppText>
            </Pressable>
          </View>
        </ScrollView>

        {/* ── Footer ──────────────────────────────────────────────────── */}
        <View
          style={{
            paddingHorizontal: spacing.lg,
            paddingTop: spacing.md,
            paddingBottom: insets.bottom + spacing.md,
            borderTopWidth: StyleSheet.hairlineWidth,
            borderTopColor: colors.border,
          }}
        >
          <Row gap={spacing.sm}>
            <FooterButton icon="play-circle-outline" label="Open demo" onPress={() => close(enterDemo)} />
            <FooterButton
              icon={isDark ? 'sunny-outline' : 'moon-outline'}
              label={isDark ? 'Light' : 'Dark'}
              onPress={() => setMode(isDark ? 'light' : 'dark')}
            />
          </Row>
        </View>
      </Animated.View>
    </Modal>
  );
}

function FooterButton({
  icon,
  label,
  onPress,
}: {
  icon: IconName;
  label: string;
  onPress: () => void;
}) {
  const { colors } = useTheme();
  const fg = colors.textSecondary;
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      style={({ pressed }) => ({
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
        paddingVertical: 10,
        borderRadius: radius.md,
        backgroundColor: colors.surfaceMuted,
        opacity: pressed ? 0.7 : 1,
      })}
    >
      <Ionicons name={icon} size={15} color={fg} />
      <AppText variant="captionStrong" style={{ color: fg }}>
        {label}
      </AppText>
    </Pressable>
  );
}

/** "Class 8 · Self", "Class 4 · Mother", … */
function describeStudent(p: StudentProfile): string {
  return [p.class_name, p.relation === 'self' ? 'Self' : `Added as ${relationLabel(p)}`].filter(Boolean).join(' · ');
}

const styles = StyleSheet.create({
  activeBar: { position: 'absolute', left: 0, top: 10, bottom: 10, width: 3, borderRadius: 2 },
});
