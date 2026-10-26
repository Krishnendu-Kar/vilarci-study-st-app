import React, { useEffect, useRef, useState } from 'react';
import { AppState, View } from 'react-native';
import Svg, { Circle, G } from 'react-native-svg';
import Ionicons from '@expo/vector-icons/Ionicons';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../theme/ThemeProvider';
import { fonts, spacing } from '../theme/tokens';
import { useAppStore } from '../lib/store/useAppStore';
import { usePoints, useStudentContext, useTests } from '../lib/api/hooks';
import { AppText, Card, Chip, Divider, HeroCard, Pill, ProgressBar, Row, SectionHeader } from '../components/ui/base';
import { Button } from '../components/ui/Button';
import { Screen } from '../components/ui/Screen';
import { useToast } from '../components/ui/Toast';
import { ContextHeader } from '../components/ContextHeader';
import { LEARN_NAV, SubNav } from '../components/SubNav';

const PRESETS = [
  { minutes: 15, label: '15 min', hint: 'Quick drill' },
  { minutes: 25, label: '25 min', hint: 'Classic pomodoro' },
  { minutes: 45, label: '45 min', hint: 'Deep work' },
];

export function FocusScreen() {
  const { colors } = useTheme();
  const ctx = useStudentContext();
  const { weakTopics } = useTests();
  const points = usePoints();
  const completeFocusSession = useAppStore((s) => s.completeFocusSession);
  const sessionsDone = useAppStore((s) => s.focusSessions);
  const { points: pointsToast, toast } = useToast();

  const [preset, setPreset] = useState(PRESETS[1]);
  const [remaining, setRemaining] = useState(PRESETS[1].minutes * 60);
  const [running, setRunning] = useState(false);
  const interval = useRef<ReturnType<typeof setInterval> | null>(null);

  const total = preset.minutes * 60;
  const elapsed = total - remaining;
  const progress = total ? (elapsed / total) * 100 : 0;

  // Reset the clock whenever a different duration is chosen while idle.
  useEffect(() => {
    if (!running) setRemaining(preset.minutes * 60);
  }, [preset, running]);

  useEffect(() => {
    if (!running) {
      if (interval.current) clearInterval(interval.current);
      return;
    }
    interval.current = setInterval(() => {
      setRemaining((r) => {
        if (r <= 1) {
          clearInterval(interval.current!);
          setRunning(false);
          const awarded = completeFocusSession(preset.minutes);
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
          pointsToast(awarded, `${preset.minutes}-minute focus session complete`);
          return 0;
        }
        return r - 1;
      });
    }, 1000);
    return () => {
      if (interval.current) clearInterval(interval.current);
    };
  }, [running, preset.minutes, completeFocusSession, pointsToast]);

  // Honest timer: leaving the app abandons the session rather than crediting it.
  useEffect(() => {
    const sub = AppState.addEventListener('change', (state) => {
      if (state !== 'active' && running) {
        setRunning(false);
        setRemaining(preset.minutes * 60);
        toast('Session cancelled — the focus timer only counts uninterrupted study.', 'warning');
      }
    });
    return () => sub.remove();
  }, [running, preset.minutes, toast]);

  const mm = String(Math.floor(remaining / 60)).padStart(2, '0');
  const ss = String(remaining % 60).padStart(2, '0');

  const badge = points.badges.find((b) => b.id === 'badge-4');

  return (
    <View style={{ flex: 1, backgroundColor: colors.bgApp }}>
      <ContextHeader />
      <SubNav items={LEARN_NAV} />
      <Screen>
        <HeroCard style={{ alignItems: 'center', paddingVertical: spacing.xxl }}>
          <AppText variant="overline" style={{ color: colors.goldBright }}>
            FOCUS ROOM
          </AppText>

          <View style={{ marginTop: spacing.lg, alignItems: 'center', justifyContent: 'center' }}>
            <FocusDial progress={progress} color={colors.goldBright} />
            <View style={{ position: 'absolute', alignItems: 'center' }}>
              <AppText
                style={{
                  fontFamily: fonts.sansBold,
                  fontSize: 52,
                  letterSpacing: -2.5,
                  color: '#FDFBF9',
                }}
              >
                {mm}:{ss}
              </AppText>
              <AppText variant="caption" style={{ color: 'rgba(253,251,249,0.6)' }}>
                {running ? 'Stay with it' : `${preset.hint}`}
              </AppText>
            </View>
          </View>

          <Row gap={spacing.sm} style={{ marginTop: spacing.xl }}>
            <Button
              label={running ? 'Give up' : remaining === 0 ? 'Start again' : 'Begin session'}
              iconName={running ? 'stop-circle-outline' : 'play'}
              variant={running ? 'secondary' : 'gold'}
              onPress={() => {
                if (running) {
                  setRunning(false);
                  setRemaining(total);
                } else {
                  setRemaining(remaining === 0 ? total : remaining);
                  setRunning(true);
                }
              }}
            />
          </Row>

          <AppText variant="caption" style={{ color: 'rgba(253,251,249,0.55)', marginTop: spacing.md }} center>
            Completing a session earns 25 honours points.
          </AppText>
        </HeroCard>

        <Row gap={spacing.sm} style={{ marginTop: spacing.lg }}>
          {PRESETS.map((p) => (
            <Chip
              key={p.minutes}
              label={p.label}
              selected={p.minutes === preset.minutes}
              onPress={() => {
                if (running) {
                  toast('Finish or cancel the running session first.', 'info');
                  return;
                }
                setPreset(p);
              }}
            />
          ))}
        </Row>

        <Card style={{ marginTop: spacing.xl }}>
          <Row justify="space-between">
            <View style={{ flex: 1 }}>
              <AppText variant="subheading">Deep Focus Pro</AppText>
              <AppText variant="caption" tone="muted">
                {Math.min(sessionsDone, 10)} of 10 verified sessions
              </AppText>
            </View>
            <Pill
              label={sessionsDone >= 10 ? 'Unlocked' : `${10 - sessionsDone} to go`}
              tone={sessionsDone >= 10 ? 'success' : 'gold'}
            />
          </Row>
          <View style={{ marginTop: spacing.md }}>
            <ProgressBar value={(Math.min(sessionsDone, 10) / 10) * 100} gradient={colors.goldGradient} height={7} />
          </View>
          {badge ? (
            <AppText variant="caption" tone="muted" style={{ marginTop: spacing.md }}>
              {badge.description}
            </AppText>
          ) : null}
        </Card>

        {weakTopics.length ? (
          <View style={{ marginTop: spacing.xxl }}>
            <SectionHeader
              title="Suggested for this session"
              subtitle="Weak topics flagged by your teachers"
            />
            <Card>
              <Row gap={6} wrap>
                {weakTopics.slice(0, 6).map((w) => (
                  <Pill key={w} label={w} tone="warning" />
                ))}
              </Row>
              <Divider style={{ marginVertical: spacing.md }} />
              <AppText variant="caption" tone="muted">
                Pick one, silence your phone and start the timer. {ctx.student.name.split(' ')[0]}, short
                focused blocks beat long distracted ones.
              </AppText>
            </Card>
          </View>
        ) : null}

        <Card style={{ marginTop: spacing.lg }} muted>
          <Row gap={spacing.md} align="flex-start">
            <Ionicons name="information-circle-outline" size={19} color={colors.textMuted} />
            <AppText variant="caption" tone="muted" style={{ flex: 1 }}>
              The timer pauses and resets if you leave the app, so the points reflect real uninterrupted
              study. Teachers can also award focus honours directly in class.
            </AppText>
          </Row>
        </Card>
      </Screen>
    </View>
  );
}

/** Large dial for the countdown — thin ring on the wine gradient. */
function FocusDial({ progress, color }: { progress: number; color: string }) {
  const size = 236;
  const stroke = 6;
  const r = (size - stroke) / 2;
  const circumference = 2 * Math.PI * r;
  const dash = (Math.max(0, Math.min(100, progress)) / 100) * circumference;

  return (
    <Svg width={size} height={size}>
      <G rotation={-90} origin={`${size / 2}, ${size / 2}`}>
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke="rgba(253,251,249,0.16)"
          strokeWidth={stroke}
          fill="none"
        />
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke={color}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={`${dash} ${circumference - dash}`}
          fill="none"
        />
      </G>
    </Svg>
  );
}
