import React from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useTheme } from '../../theme/ThemeProvider';
import { spacing } from '../../theme/tokens';
import { Membership, useMemberships } from '../../lib/api/batches';
import { buildLedger, MODE_LABEL, useEnrolmentMonths } from '../../lib/api/batchFees';
import type { MonthFee } from '../../lib/local/types';
import { useRefresh } from '../../lib/sync/useRefresh';
import { useActiveStudent } from '../../lib/store/useActiveStudent';
import { courseLabel, monthLabel } from '../../lib/utils/months';
import { formatDate, money } from '../../lib/utils/format';
import { AppText, Card, Divider, EmptyState, HeroCard, Pill, Row, SectionHeader } from '../../components/ui/base';
import { Button } from '../../components/ui/Button';
import { Screen } from '../../components/ui/Screen';
import { RealTopBar } from '../../components/real/RealTopBar';

const STATE_TONE = { paid: 'success', waived: 'neutral', due: 'error', upcoming: 'neutral' } as const;
const STATE_LABEL = { paid: 'Paid', waived: 'Waived', due: 'Due', upcoming: 'Upcoming' } as const;

/** The active student's fee ledger for every batch they've joined (read-only). */
export function StudentFeesScreen() {
  const { colors } = useTheme();
  const navigation = useNavigation<any>();
  const { active } = useActiveStudent();
  const { memberships, isLoading } = useMemberships();
  const monthsByEnrolment = useEnrolmentMonths();
  const { refreshing, refresh } = useRefresh();
  // Opened from a batch card → show just that batch's ledger.
  const onlyId: string | undefined = useRoute<any>().params?.membershipId;

  const joined = memberships.filter(
    // Fees are paid on batches and institute sections (not on a section's subjects).
    (m) => m.student_id === active?.id && m.status === 'approved' && m.kind !== 'subject' && (!onlyId || m.id === onlyId),
  );
  const ledgers = joined.map((m) => ({
    m,
    ledger:
      m.course_start && m.course_end
        ? buildLedger(m.course_start, m.course_end, monthsByEnrolment[m.id], m.monthly_fee ?? 0)
        : null,
  }));
  const dueTotal = ledgers.reduce((s, l) => s + (l.ledger?.dueAmount ?? 0), 0);
  const paidTotal = ledgers.reduce((s, l) => s + (l.ledger?.paid ?? 0), 0);
  // One batch on the page (opened from a batch, or only one joined): its name
  // and totals go in the top card once, not again below.
  const single = ledgers.length === 1 ? ledgers[0] : null;

  return (
    <View style={{ flex: 1, backgroundColor: colors.bgApp }}>
      <RealTopBar
        title="Fees"
        subtitle={single ? single.m.batch_name : active ? `${active.first_name}'s batches` : undefined}
      />
      <Screen refreshing={refreshing} onRefresh={refresh}>
        {!active ? (
          <EmptyState icon="people-outline" title="Add a student first" message="Fees are kept per student profile." />
        ) : isLoading ? (
          <ActivityIndicator color={colors.primary} style={{ marginTop: spacing.xxl }} />
        ) : !joined.length ? (
          <View>
            <EmptyState
              icon="wallet-outline"
              title={`No fees for ${active.first_name} yet`}
              message="Each batch's monthly fee ledger shows here once the teacher accepts the join request."
            />
            <Button
              label="Join a batch"
              iconName="enter-outline"
              fullWidth
              onPress={() => navigation.navigate('JoinBatch', { studentId: active.id })}
              style={{ marginTop: spacing.md }}
            />
          </View>
        ) : (
          <>
            <HeroCard>
              <AppText variant="overline" numberOfLines={1} style={{ color: colors.goldBright }}>
                {single ? single.m.batch_name.toUpperCase() : `${active.first_name.toUpperCase()} · ALL BATCHES`}
              </AppText>
              {single ? (
                <AppText variant="caption" numberOfLines={2} style={{ color: 'rgba(253,251,249,0.8)', marginTop: 2 }}>
                  {[
                    courseLabel(single.m.course_start, single.m.course_end),
                    `${money(single.m.monthly_fee ?? 0)}/month`,
                    single.m.teacher_name,
                  ]
                    .filter(Boolean)
                    .join(' · ')}
                </AppText>
              ) : null}
              <Row style={{ marginTop: spacing.md }} gap={spacing.xl}>
                <HeroMetric value={money(dueTotal)} label="DUE NOW" alert={dueTotal > 0} />
                <HeroMetric value={money(paidTotal)} label="PAID" />
                {single?.ledger ? <HeroMetric value={money(single.ledger.totalCourse)} label="COURSE" /> : null}
              </Row>
              <AppText variant="caption" style={{ color: 'rgba(253,251,249,0.7)', marginTop: spacing.sm }}>
                Payments are recorded by the teacher.
              </AppText>
            </HeroCard>

            {single ? (
              /* One batch: the card above already has its name and totals — just the months. */
              <View style={{ marginTop: spacing.xl }}>
                {single.ledger ? (
                  <BatchLedger m={single.m} ledger={single.ledger} totals={false} />
                ) : (
                  <NoCourseMonths />
                )}
              </View>
            ) : null}

            {single ? null : ledgers.map(({ m, ledger }) => (
              <View key={m.id} style={{ marginTop: spacing.xxl }}>
                <SectionHeader
                  title={m.batch_name}
                  subtitle={`${m.teacher_name} · ${money(m.monthly_fee ?? 0)}/month`}
                />
                {ledger ? <BatchLedger m={m} ledger={ledger} totals /> : <NoCourseMonths />}
              </View>
            ))}
          </>
        )}
      </Screen>
    </View>
  );
}

/** A batch's months; `totals` adds its course line and Paid/Due/Course (when several batches share the page). */
function BatchLedger({ m, ledger, totals }: { m: Membership; ledger: ReturnType<typeof buildLedger>; totals: boolean }) {
  const { colors } = useTheme();
  return (
    <Card padded={false}>
      {totals ? (
        <>
          <View style={{ paddingHorizontal: spacing.lg, paddingTop: spacing.md }}>
            <AppText variant="caption" tone="muted">
              {courseLabel(m.course_start, m.course_end)}
            </AppText>
            <Row gap={spacing.lg} style={{ marginTop: spacing.sm, marginBottom: spacing.md }}>
              <Total label="Paid" value={money(ledger.paid)} />
              <Total label="Due" value={money(ledger.dueAmount)} tone={ledger.dueMonths ? colors.error : undefined} />
              <Total label="Course" value={money(ledger.totalCourse)} />
            </Row>
          </View>
          <Divider />
        </>
      ) : null}
      {ledger.months.map((lm, i) => (
        <Row
          key={lm.month}
          gap={spacing.sm}
          style={[styles.row, { borderTopWidth: i ? StyleSheet.hairlineWidth : 0, borderTopColor: colors.border }]}
        >
          <View style={{ flex: 1 }}>
            <AppText variant="bodyStrong">{monthLabel(lm.month)}</AppText>
            {lm.fee ? <AppText variant="caption" tone="muted">{describeFee(lm.fee)}</AppText> : null}
          </View>
          <Pill label={STATE_LABEL[lm.state]} tone={STATE_TONE[lm.state]} />
        </Row>
      ))}
    </Card>
  );
}

function describeFee(f: MonthFee): string {
  if (f.status === 'waived') return f.note ? `Waived · ${f.note}` : 'Waived by teacher';
  return [money(f.amount), f.mode ? MODE_LABEL[f.mode] : null, f.paid_on ? formatDate(f.paid_on) : null, f.note || null]
    .filter(Boolean)
    .join(' · ');
}

function HeroMetric({ value, label, alert }: { value: string; label: string; alert?: boolean }) {
  const { colors } = useTheme();
  return (
    <View>
      <AppText variant="metricSm" style={{ color: alert ? '#FFD7D2' : '#FDFBF9' }}>
        {value}
      </AppText>
      <AppText variant="overline" style={{ color: colors.goldBright }}>
        {label}
      </AppText>
    </View>
  );
}

function NoCourseMonths() {
  return (
    <Card muted>
      <AppText variant="caption" tone="muted">
        The teacher hasn’t set this course’s start and end months yet.
      </AppText>
    </Card>
  );
}

function Total({ label, value, tone }: { label: string; value: string; tone?: string }) {
  return (
    <View>
      <AppText variant="subheading" style={tone ? { color: tone } : undefined}>
        {value}
      </AppText>
      <AppText variant="overline" tone="muted">
        {label.toUpperCase()}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { paddingHorizontal: spacing.lg, paddingVertical: spacing.md, alignItems: 'center' },
});
