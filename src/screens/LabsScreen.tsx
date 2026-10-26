import React, { useMemo, useState } from 'react';
import { ActivityIndicator, Modal, Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { WebView } from 'react-native-webview';
import { useTheme } from '../theme/ThemeProvider';
import { radius, spacing } from '../theme/tokens';
import { useSimulations } from '../lib/api/hooks';
import { useAppStore } from '../lib/store/useAppStore';
import { AppText, Card, Chip, Pill, PressableCard, Row, SectionHeader } from '../components/ui/base';
import { Screen } from '../components/ui/Screen';
import { ContextHeader } from '../components/ContextHeader';
import { LEARN_NAV, SubNav } from '../components/SubNav';
import type { Simulation } from '../lib/data/types';

export function LabsScreen() {
  const { colors, subject } = useTheme();
  const simulations = useSimulations();
  const opened = useAppStore((s) => s.simulationsOpened);
  const recordSimulationOpened = useAppStore((s) => s.recordSimulationOpened);
  const [filter, setFilter] = useState('all');
  const [running, setRunning] = useState<Simulation | null>(null);

  const subjects = useMemo(() => [...new Set(simulations.map((s) => s.subject))], [simulations]);
  const visible = filter === 'all' ? simulations : simulations.filter((s) => s.subject === filter);
  const openedCount = Object.keys(opened).length;

  const launch = (sim: Simulation) => {
    recordSimulationOpened(sim.id);
    setRunning(sim);
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.bgApp }}>
      <ContextHeader />
      <SubNav items={LEARN_NAV} />
      <Screen>
        {/* Regal maroon lab banner, ported from the website hero */}
        <Card rail={colors.primary} style={{ backgroundColor: colors.primarySubtle }}>
          <Row gap={spacing.md} align="center">
            <View
              style={{
                width: 48,
                height: 48,
                borderRadius: radius.md,
                backgroundColor: colors.primary,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <AppText style={{ fontSize: 24 }}>⚗️</AppText>
            </View>
            <View style={{ flex: 1 }}>
              <AppText variant="title">Interactive STEM Labs</AppText>
              <AppText variant="caption" tone="secondary">
                Virtual experiments by PhET, University of Colorado Boulder. Open to every Vilarci student,
                whatever your coaching centre.
              </AppText>
            </View>
          </Row>
        </Card>

        <Row gap={spacing.sm} wrap style={{ marginTop: spacing.lg }}>
          <Chip label="All subjects" selected={filter === 'all'} onPress={() => setFilter('all')} />
          {subjects.map((s) => (
            <Chip key={s} label={s} selected={filter === s} onPress={() => setFilter(s)} />
          ))}
        </Row>

        <View style={{ marginTop: spacing.lg, gap: spacing.sm }}>
          {visible.map((sim) => {
            const tone = subject(sim.subject);
            const seen = Boolean(opened[sim.id]);
            return (
              <PressableCard key={sim.id} rail={tone.base} onPress={() => launch(sim)}>
                <Row gap={spacing.md} align="flex-start">
                  <View
                    style={{
                      width: 52,
                      height: 52,
                      borderRadius: radius.md,
                      backgroundColor: tone.bg,
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <AppText style={{ fontSize: 26 }}>{sim.thumbnail_emoji}</AppText>
                  </View>
                  <View style={{ flex: 1 }}>
                    <AppText variant="subheading">{sim.title}</AppText>
                    <AppText variant="caption" tone="muted" style={{ marginTop: 2 }} numberOfLines={2}>
                      {sim.description}
                    </AppText>
                    <Row gap={5} wrap style={{ marginTop: 7 }}>
                      <Pill label={sim.subject} tone="primary" />
                      <Pill label={`Class ${sim.class}`} tone="neutral" />
                      {seen ? <Pill label="Explored" tone="success" icon="✓" /> : null}
                    </Row>
                  </View>
                </Row>
              </PressableCard>
            );
          })}
        </View>

        <View style={{ marginTop: spacing.xl }}>
          <SectionHeader icon="🧪" title="STEM Explorer badge" />
          <Card muted>
            <Row justify="space-between">
              <AppText variant="captionStrong">{Math.min(openedCount, 5)} of 5 labs explored</AppText>
              <Pill
                label={openedCount >= 5 ? 'Unlocked' : `${5 - openedCount} to go`}
                tone={openedCount >= 5 ? 'success' : 'accent'}
              />
            </Row>
            <AppText variant="caption" tone="muted" style={{ marginTop: 6 }}>
              Simulations load live from phet.colorado.edu and need an internet connection.
            </AppText>
          </Card>
        </View>
      </Screen>

      <SimulationRunner simulation={running} onClose={() => setRunning(null)} />
    </View>
  );
}

/** Full-screen modal WebView runner — keeps the student inside the app. */
function SimulationRunner({
  simulation,
  onClose,
}: {
  simulation: Simulation | null;
  onClose: () => void;
}) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const [loading, setLoading] = useState(true);

  if (!simulation) return null;

  return (
    <Modal visible animationType="slide" onRequestClose={onClose} statusBarTranslucent>
      <View style={{ flex: 1, backgroundColor: colors.bgApp, paddingTop: insets.top }}>
        <Row
          justify="space-between"
          style={{
            paddingHorizontal: spacing.lg,
            paddingVertical: spacing.sm,
            borderBottomWidth: StyleSheet.hairlineWidth,
            borderBottomColor: colors.border,
            backgroundColor: colors.surface,
          }}
        >
          <View style={{ flex: 1 }}>
            <AppText variant="subheading" numberOfLines={1}>
              {simulation.thumbnail_emoji} {simulation.title}
            </AppText>
            <AppText variant="caption" tone="muted">
              {simulation.subject} · PhET Interactive Simulations
            </AppText>
          </View>
          <Pressable
            onPress={onClose}
            hitSlop={10}
            style={{
              paddingHorizontal: spacing.md,
              paddingVertical: 7,
              borderRadius: radius.pill,
              backgroundColor: colors.surfaceMuted,
            }}
          >
            <AppText variant="captionStrong" tone="primary">
              Close
            </AppText>
          </Pressable>
        </Row>

        <View style={{ flex: 1 }}>
          <WebView
            source={{ uri: simulation.phet_url }}
            onLoadEnd={() => setLoading(false)}
            allowsFullscreenVideo
            javaScriptEnabled
            domStorageEnabled
            mediaPlaybackRequiresUserAction={false}
            style={{ flex: 1, backgroundColor: colors.bgApp }}
          />
          {loading ? (
            <View
              style={[
                StyleSheet.absoluteFill,
                { alignItems: 'center', justifyContent: 'center', backgroundColor: colors.bgApp },
              ]}
            >
              <ActivityIndicator color={colors.primary} />
              <AppText variant="caption" tone="muted" style={{ marginTop: spacing.sm }}>
                Loading simulation…
              </AppText>
            </View>
          ) : null}
        </View>

        <View style={{ paddingBottom: insets.bottom }} />
      </View>
    </Modal>
  );
}
