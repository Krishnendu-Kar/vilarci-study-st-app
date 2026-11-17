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
    (m) => m.student_id === active?.id && m.status === 'approved' && (!onlyId || m.id === onlyId),
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

  return (
    <View style={{ flex: 1, backgroundColor: colors.bgApp }}>
      <RealTopBar title="Fees" subtitle={active ? `${active.first_name}'s batches` : undefined} />
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
              <AppText variant="overline" style={{ color: colors.goldBright }}>
                {active.first_name.toUpperCase()} · ALL BATCHES
              </AppText>
              <Row style={{ marginTop: spacing.md }} gap={spacing.xl}>
                <View>
                  <AppText variant="metricSm" style={{ color: dueTotal ? '#FFD7D2' : '#FDFBF9' }}>
                    {money(dueTotal)}
                  </AppText>
                  <AppText variant="overline" style={{ color: colors.goldBright }}>
                    DUE NOW
                  </AppText>
                </View>
                <View>
                  <AppText variant="metricSm" style={{ color: '#FDFBF9' }}>
                    {money(paidTotal)}
                  </AppText>
                  <AppText variant="overline" style={{ color: colors.goldBright }}>
                    PAID
                  </AppText>
                </View>
              </Row>
              <AppText variant="caption" style={{ color: 'rgba(253,251,249,0.7)', marginTop: spacing.sm }}>
                Payments are recorded by the teacher.
              </AppText>
            </HeroCard>

            {ledgers.map(({ m, ledger }) => (
              <View key={m.id} style={{ marginTop: spacing.xxl }}>
                <SectionHeader
                  title={m.batch_name}
                  subtitle={`${m.teacher_name} · ${money(m.monthly_fee ?? 0)}/month`}
                />
                {ledger ? (
                  <BatchLedger m={m} ledger={ledger} />
                ) : (
                  <Card muted>
                    <AppText variant="caption" tone="muted">
                      The teacher hasn't set this course's start and end months yet.
                    </AppText>
                  </Card>
                )}
              </View>
            ))}
          </>
        )}
      </Screen>
    </View>
  );
}

function BatchLedger({ m, ledger }: { m: Membership; ledger: ReturnType<typeof buildLedger> }) {
  const { colors } = useTheme();
  return (
    <Card padded={false}>
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
