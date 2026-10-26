import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useTheme } from '../theme/ThemeProvider';
import { radius, spacing } from '../theme/tokens';
import { useAppStore } from '../lib/store/useAppStore';
import { useHousehold } from '../lib/api/hooks';
import {
  AppText,
  Avatar,
  Card,
  CenterMark,
  Divider,
  HeroCard,
  KeyValue,
  Pill,
  ProgressBar,
  Row,
  SectionHeader,
  VerifiedTick,
} from '../components/ui/base';
import { Screen } from '../components/ui/Screen';
import { ScreenTitle } from '../components/ScreenTitle';
import { MiniRing } from '../components/charts/MiniRing';
import { rupees } from '../lib/utils/format';

/**
 * Parent view: every child in the household on one screen, with the three
 * numbers parents actually ask about — attendance, dues and performance.
 */
export function ParentScreen() {
  const { colors } = useTheme();
  const navigation = useNavigation<any>();
  const { household, rows } = useHousehold();
  const currentStudentId = useAppStore((s) => s.currentStudentId);
  const setCurrentStudent = useAppStore((s) => s.setCurrentStudent);

  const totalDue = rows.reduce((s, r) => s + r.pendingFees, 0);
  const avgAttendance = rows.length ? rows.reduce((s, r) => s + r.attendanceRate, 0) / rows.length : 0;
  const flagged = rows.filter((r) => r.attendanceRate < 75);

  const openChild = (studentId: string) => {
    setCurrentStudent(studentId);
    navigation.navigate('Home');
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.bgApp }}>
      <Screen topInset>
        <ScreenTitle title="Household" subtitle={`${household.name} · ${household.city}`} />

        <HeroCard style={{ marginTop: spacing.lg }}>
          <Row justify="space-between" align="flex-start">
            <View style={{ flex: 1 }}>
              <AppText variant="overline" style={{ color: colors.goldBright }}>
                TOTAL OUTSTANDING
              </AppText>
              <AppText variant="metricXl" style={{ color: '#FDFBF9', marginTop: 4 }}>
                {rupees(totalDue)}
              </AppText>
              <AppText variant="caption" style={{ color: 'rgba(253,251,249,0.62)', marginTop: 2 }}>
                across {rows.length} child{rows.length === 1 ? '' : 'ren'} and every faculty
              </AppText>
            </View>
            <MiniRing
              value={avgAttendance}
              size={72}
              track="rgba(253,251,249,0.18)"
              color={colors.goldBright}
              caption="att"
            />
          </Row>

          {flagged.length ? (
            <View
              style={{
                marginTop: spacing.lg,
                padding: spacing.md,
                borderRadius: radius.sm,
                backgroundColor: 'rgba(253,251,249,0.1)',
              }}
            >
              <AppText variant="caption" style={{ color: '#FDFBF9' }}>
                ⚠ {flagged.map((f) => f.student.name.split(' ')[0]).join(', ')} below the 75% attendance
                threshold.
              </AppText>
            </View>
          ) : (
            <View
              style={{
                marginTop: spacing.lg,
                padding: spacing.md,
                borderRadius: radius.sm,
                backgroundColor: 'rgba(253,251,249,0.1)',
              }}
            >
              <AppText variant="caption" style={{ color: '#FDFBF9' }}>
                ✓ Every child is above the 75% attendance threshold.
              </AppText>
            </View>
          )}
        </HeroCard>

        {/* ── Child cards ─────────────────────────────────────────────────── */}
        <View style={{ marginTop: spacing.xxl }}>
          <SectionHeader title="Children" subtitle="Tap a card to open that profile" />
          <View style={{ gap: spacing.md }}>
            {rows.map((r) => {
              const active = r.student.id === currentStudentId;
              return (
                <Pressable
                  key={r.student.id}
                  onPress={() => openChild(r.student.id)}
                  style={({ pressed }) => [{ opacity: pressed ? 0.9 : 1 }]}
                >
                  <Card level={active ? 2 : 1} accentColor={active ? colors.primary : undefined}>
                    <Row gap={spacing.md} align="center">
                      <Avatar
                        initials={r.student.photo_initials}
                        gradient={r.student.avatar_gradient}
                        size={46}
                        ring={active}
                      />
                      <View style={{ flex: 1 }}>
                        <Row gap={6}>
                          <AppText variant="subheading" numberOfLines={1} style={{ flexShrink: 1 }}>
                            {r.student.name}
                          </AppText>
                          {active ? <Pill label="Viewing" tone="primary" /> : null}
                        </Row>
                        <AppText variant="caption" tone="muted">
                          {r.student.class} · {r.student.board} · Roll {r.student.roll}
                        </AppText>
                      </View>
                      <Ionicons name="chevron-forward" size={17} color={colors.textMuted} />
                    </Row>

                    <Row style={{ marginTop: spacing.lg }} gap={spacing.lg}>
                      <ChildStat
                        label="Attendance"
                        value={`${r.attendanceRate.toFixed(0)}%`}
                        tint={
                          r.attendanceRate >= 85
                            ? colors.success
                            : r.attendanceRate >= 75
                              ? colors.warning
                              : colors.error
                        }
                      />
                      <View style={{ width: StyleSheet.hairlineWidth, backgroundColor: colors.border }} />
                      <ChildStat
                        label="Average"
                        value={r.testCount ? `${r.averagePercent.toFixed(0)}%` : '—'}
                        tint={colors.primary}
                      />
                      <View style={{ width: StyleSheet.hairlineWidth, backgroundColor: colors.border }} />
                      <ChildStat
                        label="Dues"
                        value={r.pendingFees ? rupees(r.pendingFees) : 'Clear'}
                        tint={r.pendingFees ? colors.error : colors.success}
                      />
                    </Row>

                    <View style={{ marginTop: spacing.lg }}>
                      <Row justify="space-between" style={{ marginBottom: 6 }}>
                        <AppText variant="caption" tone="muted">
                          Honours · {r.points.toLocaleString('en-IN')} pts
                        </AppText>
                        <AppText variant="caption" tone="muted">
                          🔥 {r.streak}d streak
                        </AppText>
                      </Row>
                      <ProgressBar value={Math.min(100, (r.points / 2000) * 100)} gradient={colors.goldGradient} height={6} />
                    </View>

                    <Divider style={{ marginVertical: spacing.lg }} />
                    <AppText variant="overline" tone="muted">
                      ENROLLED FACULTIES
                    </AppText>
                    <Row gap={spacing.sm} wrap style={{ marginTop: spacing.sm }}>
                      {r.centers.length ? (
                        r.centers.map((c) => (
                          <Row key={c.id} gap={6}>
                            <CenterMark text={c.logo_text} color={c.color} size={28} />
                            <View>
                              <AppText variant="caption" numberOfLines={1}>
                                {c.name}
                              </AppText>
                              <AppText variant="caption" tone="muted" numberOfLines={1}>
                                {rupees(c.monthly_fee)}/mo
                              </AppText>
                            </View>
                          </Row>
                        ))
                      ) : (
                        <AppText variant="caption" tone="muted">
                          Not enrolled anywhere yet — join with a 6-character code.
                        </AppText>
                      )}
                    </Row>
                  </Card>
                </Pressable>
              );
            })}
          </View>
        </View>

        {/* ── Emergency contacts ──────────────────────────────────────────── */}
        <View style={{ marginTop: spacing.xxl }}>
          <SectionHeader title="Verified contacts" subtitle="Shared with every enrolled faculty" />
          <Card>
            <KeyValue
              label="Father"
              value={`${rows[0]?.student.father_name ?? '—'} · ${rows[0]?.student.father_phone ?? ''}`}
              icon={<VerifiedTick verified={Boolean(rows[0]?.student.father_phone_verified)} />}
            />
            <Divider />
            <KeyValue
              label="Mother"
              value={`${rows[0]?.student.mother_name ?? '—'} · ${rows[0]?.student.mother_phone ?? ''}`}
              icon={<VerifiedTick verified={Boolean(rows[0]?.student.mother_phone_verified)} />}
            />
            <Divider />
            <KeyValue
              label="Guardian"
              value={
                rows[0]?.student.guardian_name
                  ? `${rows[0].student.guardian_name} · ${rows[0].student.guardian_phone}`
                  : 'Not added'
              }
              icon={<VerifiedTick verified={Boolean(rows[0]?.student.guardian_phone_verified)} />}
            />
            <Divider style={{ marginVertical: spacing.sm }} />
            <AppText variant="caption" tone="muted">
              Teachers see these numbers for emergencies and fee reminders. Update them under More → Settings.
            </AppText>
          </Card>
        </View>

        <Card style={{ marginTop: spacing.lg }} muted>
          <AppText variant="captionStrong">Household account</AppText>
          <KeyValue label="Primary contact" value={household.primary_contact} />
          <KeyValue label="Phone" value={household.primary_phone} />
          <KeyValue label="Email" value={household.email} />
          <KeyValue label="Profiles" value={`${rows.length} of ${household.max_profiles}`} />
        </Card>
      </Screen>
    </View>
  );
}

function ChildStat({ label, value, tint }: { label: string; value: string; tint: string }) {
  return (
    <View style={{ flex: 1 }}>
      <AppText variant="metricSm" style={{ color: tint }}>
        {value}
      </AppText>
      <AppText variant="overline" tone="muted" style={{ marginTop: 1 }}>
        {label.toUpperCase()}
      </AppText>
    </View>
  );
}
