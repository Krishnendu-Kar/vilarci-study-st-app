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
import { MAX_STUDENT_PROFILES, useStudentProfiles } from '../../lib/api/studentProfiles';
import { realNavigationRef } from '../../navigation/realNavigationRef';
import { AppText, Avatar, IconName, Pill, Row } from '../ui/base';

interface MenuItem {
  label: string;
  icon: IconName;
  /** Real screen to open; absent = not built yet → "Coming soon". */
  route?: 'RealHome' | 'Account';
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
      { label: 'Student profiles', icon: 'people-outline', route: 'RealHome' },
      { label: 'Honours', icon: 'trophy-outline' },
    ],
  },
  {
    title: 'ACADEMICS',
    items: [
      { label: 'Timetable', icon: 'calendar-outline' },
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
      { label: 'Fees', icon: 'wallet-outline' },
      { label: 'Verify Documents', icon: 'shield-checkmark-outline' },
      { label: 'My account', icon: 'person-circle-outline', route: 'Account' },
      { label: 'Help & Support', icon: 'help-buoy-outline' },
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
  const { data: profiles = [] } = useStudentProfiles();

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
      if (item.route) realNavigationRef.navigate(item.route);
      else realNavigationRef.navigate('ComingSoon', { title: item.label, icon: item.icon });
    });

  const isActive = (item: MenuItem) =>
    item.route
      ? item.route === active.route && item.label !== 'Student profiles'
      : active.route === 'ComingSoon' && active.title === item.label;

  const translateX = Animated.add(progress.interpolate({ inputRange: [0, 1], outputRange: [-width, 0] }), drag);
  const name = accountName(profile, session);
  const initials = `${profile?.first_name?.[0] ?? name[0] ?? 'V'}${profile?.last_name?.[0] ?? ''}`.toUpperCase();

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
        {/* ── Account card ─────────────────────────────────────────────── */}
        <LinearGradient
          colors={colors.heroGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{ paddingTop: insets.top + spacing.lg, paddingHorizontal: spacing.lg, paddingBottom: spacing.lg }}
        >
          <Row justify="space-between" align="flex-start">
            <Avatar initials={initials} gradient={['#5a0812', '#8E1437']} size={52} ring />
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
          <AppText variant="title" numberOfLines={1} style={{ color: '#FDFBF9', marginTop: spacing.md }}>
            {name}
          </AppText>
          <AppText variant="caption" numberOfLines={1} style={{ color: 'rgba(253,251,249,0.66)' }}>
            {profile?.email ?? profile?.whatsapp_number ?? 'Vilarci Study account'}
          </AppText>
          <Row gap={6} style={{ marginTop: spacing.sm }}>
            <Ionicons name="people-outline" size={13} color={colors.goldBright} />
            <AppText variant="captionStrong" style={{ color: colors.goldBright }}>
              {profiles.length}/{MAX_STUDENT_PROFILES} student profiles
            </AppText>
          </Row>
        </LinearGradient>

        {/* ── Navigation ──────────────────────────────────────────────── */}
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: spacing.lg }}>
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
                    {ready ? null : <Pill label="Soon" tone="neutral" />}
                  </Pressable>
                );
              })}
            </View>
          ))}
        </ScrollView>

        {/* ── Footer ──────────────────────────────────────────────────── */}
        <View
          style={{
            paddingHorizontal: spacing.lg,
            paddingTop: spacing.md,
            paddingBottom: insets.bottom + spacing.md,
            borderTopWidth: StyleSheet.hairlineWidth,
            borderTopColor: colors.border,
            gap: spacing.sm,
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
          <FooterButton icon="log-out-outline" label="Log out" danger onPress={() => close(() => signOut().catch(() => {}))} />
        </View>
      </Animated.View>
    </Modal>
  );
}

function FooterButton({
  icon,
  label,
  onPress,
  danger,
}: {
  icon: IconName;
  label: string;
  onPress: () => void;
  danger?: boolean;
}) {
  const { colors } = useTheme();
  const fg = danger ? colors.errorText : colors.textSecondary;
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
        backgroundColor: danger ? colors.errorBg : colors.surfaceMuted,
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

const styles = StyleSheet.create({
  activeBar: { position: 'absolute', left: 0, top: 10, bottom: 10, width: 3, borderRadius: 2 },
});
