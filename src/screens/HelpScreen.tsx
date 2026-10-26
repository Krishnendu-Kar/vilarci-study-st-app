import React, { useState } from 'react';
import { LayoutAnimation, Linking, Pressable, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useTheme } from '../theme/ThemeProvider';
import { radius, spacing } from '../theme/tokens';
import { AppText, Card, Divider, IconBubble, ListRow, Row, SectionHeader } from '../components/ui/base';
import { Screen } from '../components/ui/Screen';
import { useToast } from '../components/ui/Toast';
import { ScreenTitle } from '../components/ScreenTitle';

const SUPPORT_EMAIL = 'support@vilarci.study';
const SUPPORT_PHONE = '+91 80 4567 1200';

const POINT_RULES: { emoji: string; label: string; points: string }[] = [
  { emoji: '📍', label: 'On-time QR check-in', points: '+10' },
  { emoji: '📖', label: 'Topic self-revision confirmed', points: '+15' },
  { emoji: '🎯', label: 'Focus Room session completed', points: '+25' },
  { emoji: '❓', label: 'Practice set cleared at 80%+', points: '+30' },
  { emoji: '🏅', label: 'Teacher awards', points: 'varies' },
];

const FAQ: { q: string; a: string }[] = [
  {
    q: 'How do I join a new coaching centre?',
    a: 'Ask your teacher for their 6-character coaching code, then go to More → Settings → Enrolled faculties → Join. The centre appears instantly in the faculty switcher.',
  },
  {
    q: 'What does "All centres" mean?',
    a: 'It combines timetable, attendance, fees and results from every centre you are enrolled in. Tap the faculty pill at the top right of any screen to focus on just one.',
  },
  {
    q: 'Can one parent account manage several children?',
    a: 'Yes — a household can hold up to five student profiles. Tap the student name at the top left to switch or add a profile; More → Household shows everyone at a glance.',
  },
  {
    q: 'Why is my attendance flagged?',
    a: 'Most boards require 75% attendance. Below that threshold the app highlights the subject and notifies the guardian contacts on file.',
  },
  {
    q: 'How can a school check my marksheet is genuine?',
    a: 'Every marksheet and certificate carries a verification code. Anyone can enter it under More → Verify to see the issuing centre, date and result.',
  },
  {
    q: 'Is my progress saved if I close the app?',
    a: 'Yes. Points, check-ins, revisions and preferences are stored on this device and restored the next time you open the app.',
  },
];

export function HelpScreen() {
  const { colors } = useTheme();
  const toast = useToast();
  const [open, setOpen] = useState<number | null>(0);

  const toggle = (i: number) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setOpen((cur) => (cur === i ? null : i));
  };

  const openLink = (url: string, fallback: string) => {
    Linking.openURL(url).catch(() => toast.toast(fallback, 'info'));
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.bgApp }}>
      <Screen topInset>
        <ScreenTitle title="Help" subtitle="Answers, the points system, and a human when you need one." />

        {/* ── How points work ─────────────────────────────────────────────── */}
        <View style={{ marginTop: spacing.xl }}>
          <SectionHeader title="How Honours points work" subtitle="Every habit that builds results earns points" />
          <Card>
            {POINT_RULES.map((r, i) => (
              <View key={r.label}>
                {i > 0 ? <Divider /> : null}
                <Row gap={spacing.md} style={{ paddingVertical: spacing.sm + 2 }}>
                  <IconBubble emoji={r.emoji} size={32} />
                  <AppText variant="bodyStrong" style={{ flex: 1 }}>
                    {r.label}
                  </AppText>
                  <AppText variant="captionStrong" tone="gold">
                    {r.points}
                  </AppText>
                </Row>
              </View>
            ))}
          </Card>
        </View>

        {/* ── FAQ ─────────────────────────────────────────────────────────── */}
        <View style={{ marginTop: spacing.xxl }}>
          <SectionHeader title="Frequently asked" />
          <View style={{ gap: spacing.sm }}>
            {FAQ.map((item, i) => {
              const expanded = open === i;
              return (
                <Pressable
                  key={item.q}
                  onPress={() => toggle(i)}
                  accessibilityRole="button"
                  accessibilityState={{ expanded }}
                  style={({ pressed }) => [{ opacity: pressed ? 0.85 : 1 }]}
                >
                  <Card level={expanded ? 2 : 1} accentColor={expanded ? colors.primarySoft : undefined}>
                    <Row gap={spacing.md} align="flex-start">
                      <AppText variant="subheading" style={{ flex: 1 }}>
                        {item.q}
                      </AppText>
                      <View
                        style={{
                          width: 24,
                          height: 24,
                          borderRadius: radius.pill,
                          alignItems: 'center',
                          justifyContent: 'center',
                          backgroundColor: expanded ? colors.primarySubtle : colors.surfaceMuted,
                        }}
                      >
                        <Ionicons
                          name={expanded ? 'remove' : 'add'}
                          size={15}
                          color={expanded ? colors.primary : colors.textMuted}
                        />
                      </View>
                    </Row>
                    {expanded ? (
                      <AppText variant="body" tone="secondary" style={{ marginTop: spacing.sm }}>
                        {item.a}
                      </AppText>
                    ) : null}
                  </Card>
                </Pressable>
              );
            })}
          </View>
        </View>

        {/* ── Contact ─────────────────────────────────────────────────────── */}
        <View style={{ marginTop: spacing.xxl }}>
          <SectionHeader title="Still stuck?" subtitle="Mon–Sat, 9 am – 7 pm IST" />
          <Card padded={false}>
            <View style={{ paddingHorizontal: spacing.lg }}>
              <ListRow
                title="Email support"
                subtitle={SUPPORT_EMAIL}
                iconName="mail-outline"
                onPress={() => openLink(`mailto:${SUPPORT_EMAIL}`, `Write to ${SUPPORT_EMAIL}`)}
              />
              <Divider />
              <ListRow
                title="Call the helpdesk"
                subtitle={SUPPORT_PHONE}
                iconName="call-outline"
                tint={colors.success}
                onPress={() => openLink(`tel:${SUPPORT_PHONE.replace(/\s/g, '')}`, `Call ${SUPPORT_PHONE}`)}
              />
            </View>
          </Card>
        </View>
      </Screen>
    </View>
  );
}
