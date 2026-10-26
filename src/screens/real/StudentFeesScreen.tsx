import React from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useTheme } from '../../theme/ThemeProvider';
import { spacing } from '../../theme/tokens';
import { Membership, useMyMemberships } from '../../lib/api/batches';
import { buildLedger, FeeRow, MODE_LABEL, useFeesForMemberships } from '../../lib/api/batchFees';
import { useActiveStudent } from '../../lib/store/useActiveStudent';
import { courseLabel, monthLabel } from '../../lib/utils/months';
import { formatDate, rupees } from '../../lib/utils/format';
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
  const memberships = useMyMemberships();
  // Opened from a batch card → show just that batch's ledger.
  const onlyId: string | undefined = useRoute<any>().params?.membershipId;

  const joined = (memberships.data ?? []).filter(
    (m) => m.student_id === active?.id && m.status === 'approved' && (!onlyId || m.id === onlyId),
  );
  const fees = useFeesForMemberships(joined.map((m) => m.id));
  const rows = fees.data ?? [];

  const ledgers = joined.map((m) => ({
    m,
    ledger: m.course_start && m.course_end ? buildLedger(m.course_start, m.course_end, rows.filter((r) => r.membership_id === m.id), m.monthly_fee) : null,
  }));
  const dueTotal = ledgers.reduce((s, l) => s + (l.ledger?.dueAmount ?? 0), 0);
  const paidTotal = ledgers.reduce((s, l) => s + (l.ledger?.paid ?? 0), 0);

  return (
    <View style={{ flex: 1, backgroundColor: colors.bgApp }}>
      <RealTopBar title="Fees" subtitle={active ? `${active.first_name}'s batches` : undefined} />
      <Screen
        refreshing={memberships.isRefetching || fees.isRefetching}
        onRefresh={() => {
          memberships.refetch();
          fees.refetch();
        }}
      >
        {!active ? (
          <EmptyState icon="people-outline" title="Add a student first" message="Fees are kept per student profile." />
        ) : memberships.isLoading || fees.isLoading ? (
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
                    {rupees(dueTotal)}
                  </AppText>
                  <AppText variant="overline" style={{ color: colors.goldBright }}>
                    DUE NOW
                  </AppText>
                </View>
                <View>
                  <AppText variant="metricSm" style={{ color: '#FDFBF9' }}>
                    {rupees(paidTotal)}
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
                  subtitle={`${m.teacher_name} · ${rupees(m.monthly_fee)}/month`}
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
          <Total label="Paid" value={rupees(ledger.paid)} />
          <Total label="Due" value={rupees(ledger.dueAmount)} tone={ledger.dueMonths ? colors.error : undefined} />
          <Total label="Course" value={rupees(ledger.totalCourse)} />
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
            {lm.row ? <AppText variant="caption" tone="muted">{describeRow(lm.row)}</AppText> : null}
          </View>
          <Pill label={STATE_LABEL[lm.state]} tone={STATE_TONE[lm.state]} />
        </Row>
      ))}
    </Card>
  );
}

function describeRow(r: FeeRow): string {
  if (r.status === 'waived') return r.note ? `Waived · ${r.note}` : 'Waived by teacher';
  return [rupees(r.amount), r.mode ? MODE_LABEL[r.mode] : null, r.paid_on ? formatDate(r.paid_on) : null, r.note || null]
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
