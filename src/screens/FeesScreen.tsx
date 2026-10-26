import React, { useMemo, useState } from 'react';
import { View } from 'react-native';
import { useTheme } from '../theme/ThemeProvider';
import { spacing } from '../theme/tokens';
import { useFees, useStudentContext } from '../lib/api/hooks';
import { centerById } from '../lib/api/selectors';
import {
  AppText,
  Card,
  Chip,
  Divider,
  EmptyState,
  KeyValue,
  Pill,
  PressableCard,
  Row,
  SectionHeader,
  StatTile,
} from '../components/ui/base';
import { Screen } from '../components/ui/Screen';
import { Sheet } from '../components/ui/Sheet';
import { ContextHeader } from '../components/ContextHeader';
import { formatDate, relativeDay, rupees, todayIso } from '../lib/utils/format';
import type { FeeInvoice } from '../lib/data/types';

type Filter = 'all' | 'pending' | 'paid';

export function FeesScreen() {
  const { colors } = useTheme();
  const ctx = useStudentContext();
  const { invoices, summary } = useFees();
  const [filter, setFilter] = useState<Filter>('all');
  const [open, setOpen] = useState<FeeInvoice | null>(null);

  const today = todayIso();
  const visible = useMemo(
    () => (filter === 'all' ? invoices : invoices.filter((f) => f.status === filter)),
    [invoices, filter],
  );

  const byCenter = useMemo(() => {
    const map = new Map<string, { paid: number; pending: number; count: number }>();
    for (const f of invoices) {
      const b = map.get(f.center_id) ?? { paid: 0, pending: 0, count: 0 };
      if (f.status === 'paid') b.paid += f.amount;
      else b.pending += f.amount;
      b.count += 1;
      map.set(f.center_id, b);
    }
    return [...map.entries()];
  }, [invoices]);

  return (
    <View style={{ flex: 1, backgroundColor: colors.bgApp }}>
      <ContextHeader />
      <Screen>
        <AppText variant="title">Tuition Fee Ledger</AppText>
        <AppText variant="caption" tone="muted">
          {invoices.length} month{invoices.length === 1 ? '' : 's'} tracked ·{' '}
          {ctx.isAllCenters ? `${ctx.enrolledCenters.length} centres` : ctx.activeCenter?.name}
        </AppText>

        <Row gap={spacing.sm} wrap style={{ marginTop: spacing.lg }}>
          <StatTile
            label="Outstanding"
            value={rupees(summary.pendingTotal)}
            sub={`${summary.pendingCount} month${summary.pendingCount === 1 ? '' : 's'} pending`}
            tone={summary.overdue.length ? 'error' : summary.pendingTotal ? 'warning' : 'success'}
            icon="⏳"
          />
          <StatTile
            label="Cleared"
            value={rupees(summary.paidTotal)}
            sub="Recorded by your centres"
            tone="success"
            icon="✓"
          />
        </Row>

        {summary.nextDue ? (
          <Card style={{ marginTop: spacing.lg }} rail={summary.overdue.length ? colors.error : colors.accent}>
            <Row justify="space-between" align="flex-start">
              <View style={{ flex: 1 }}>
                <AppText variant="overline" tone="muted">
                  {summary.overdue.length ? 'OVERDUE' : 'NEXT PAYMENT DUE'}
                </AppText>
                <AppText variant="subheading" style={{ marginTop: 3 }}>
                  {summary.nextDue.month} · {centerById(summary.nextDue.center_id)?.name}
                </AppText>
                <AppText variant="caption" tone="muted">
                  Due {formatDate(summary.nextDue.due_date)} ({relativeDay(summary.nextDue.due_date)})
                </AppText>
              </View>
              <AppText variant="metric" style={{ color: summary.overdue.length ? colors.error : colors.accent }}>
                {rupees(summary.nextDue.amount)}
              </AppText>
            </Row>
            <Divider style={{ marginVertical: spacing.md }} />
            <AppText variant="caption" tone="muted">
              Pay your teacher or centre directly. Once they record the payment it is reflected here —
              Vilarci tracks the academic ledger and does not collect fees or issue legal receipts.
            </AppText>
          </Card>
        ) : null}

        {/* Per-centre rollup */}
        {byCenter.length > 1 ? (
          <View style={{ marginTop: spacing.xl }}>
            <SectionHeader icon="🏛️" title="By coaching centre" />
            <Card>
              {byCenter.map(([centerId, b], idx) => {
                const c = centerById(centerId);
                return (
                  <View key={centerId}>
                    {idx > 0 ? <Divider style={{ marginVertical: spacing.sm }} /> : null}
                    <Row justify="space-between" align="flex-start">
                      <View style={{ flex: 1 }}>
                        <AppText variant="captionStrong" numberOfLines={1}>
                          {c?.name}
                        </AppText>
                        <AppText variant="caption" tone="muted">
                          {rupees(c?.monthly_fee ?? 0)}/month · {b.count} invoices
                        </AppText>
                      </View>
                      <View style={{ alignItems: 'flex-end' }}>
                        {b.pending ? (
                          <AppText variant="bodyStrong" style={{ color: colors.error }}>
                            {rupees(b.pending)} due
                          </AppText>
                        ) : (
                          <AppText variant="bodyStrong" style={{ color: colors.success }}>
                            Cleared
                          </AppText>
                        )}
                        <AppText variant="caption" tone="muted">
                          {rupees(b.paid)} paid
                        </AppText>
                      </View>
                    </Row>
                  </View>
                );
              })}
            </Card>
          </View>
        ) : null}

        {/* Ledger */}
        <View style={{ marginTop: spacing.xl }}>
          <SectionHeader icon="📒" title="Month-by-month ledger" subtitle="Tap a row for payment details" />
          <Row gap={spacing.sm} style={{ marginBottom: spacing.md }}>
            <Chip label="All" selected={filter === 'all'} onPress={() => setFilter('all')} />
            <Chip label="Pending" icon="⏳" selected={filter === 'pending'} onPress={() => setFilter('pending')} />
            <Chip label="Paid" icon="✓" selected={filter === 'paid'} onPress={() => setFilter('paid')} />
          </Row>

          {visible.length ? (
            <View style={{ gap: spacing.sm }}>
              {visible.map((f) => {
                const c = centerById(f.center_id);
                const overdue = f.status === 'pending' && f.due_date < today;
                return (
                  <PressableCard
                    key={f.id}
                    rail={f.status === 'paid' ? colors.success : overdue ? colors.error : colors.accent}
                    onPress={() => setOpen(f)}
                  >
                    <Row justify="space-between" align="flex-start" gap={spacing.md}>
                      <View style={{ flex: 1 }}>
                        <AppText variant="subheading">{f.month}</AppText>
                        <AppText variant="caption" tone="muted" numberOfLines={1}>
                          {c?.name}
                        </AppText>
                        <Row gap={5} wrap style={{ marginTop: 6 }}>
                          <Pill
                            label={f.status === 'paid' ? 'Paid' : overdue ? 'Overdue' : 'Pending'}
                            tone={f.status === 'paid' ? 'success' : overdue ? 'error' : 'warning'}
                          />
                          {f.mode ? <Pill label={f.mode} tone="info" /> : null}
                        </Row>
                      </View>
                      <View style={{ alignItems: 'flex-end' }}>
                        <AppText variant="bodyStrong">{rupees(f.amount)}</AppText>
                        <AppText variant="caption" tone="muted">
                          {f.status === 'paid' ? `paid ${formatDate(f.paid_date)}` : `due ${formatDate(f.due_date)}`}
                        </AppText>
                      </View>
                    </Row>
                  </PressableCard>
                );
              })}
            </View>
          ) : (
            <EmptyState icon="📭" title="Nothing in this filter" />
          )}
        </View>
      </Screen>

      <InvoiceSheet invoice={open} onClose={() => setOpen(null)} />
    </View>
  );
}

function InvoiceSheet({ invoice, onClose }: { invoice: FeeInvoice | null; onClose: () => void }) {
  const { colors } = useTheme();
  if (!invoice) return null;
  const c = centerById(invoice.center_id);
  const paid = invoice.status === 'paid';

  return (
    <Sheet
      visible={Boolean(invoice)}
      onClose={onClose}
      title={`${invoice.month}`}
      subtitle={`${c?.name} · ${c?.teacher_name}`}
    >
      <Card rail={paid ? colors.success : colors.accent}>
        <Row justify="space-between" align="center">
          <AppText variant="overline" tone="muted">
            AMOUNT
          </AppText>
          <Pill label={paid ? 'Paid' : 'Pending'} tone={paid ? 'success' : 'warning'} />
        </Row>
        <AppText variant="display" tone="primary" style={{ marginTop: 4 }}>
          {rupees(invoice.amount)}
        </AppText>
        <Divider style={{ marginVertical: spacing.md }} />
        <KeyValue label="Billing month" value={invoice.month} />
        <KeyValue label="Due date" value={formatDate(invoice.due_date)} />
        <KeyValue
          label="Payment date"
          value={paid ? formatDate(invoice.paid_date) : 'Not recorded yet'}
          valueTone={paid ? 'success' : 'muted'}
        />
        <KeyValue label="Mode" value={invoice.mode ?? '—'} />
        <KeyValue label="Centre reference" value={invoice.receipt_no ?? '—'} />
      </Card>

      <Card style={{ marginTop: spacing.md }} muted>
        <AppText variant="captionStrong">How fees work on Vilarci</AppText>
        <AppText variant="caption" tone="muted" style={{ marginTop: 4 }}>
          Vilarci Study is an academic record keeper. Payments are made directly to your coaching centre or
          private tutor, who then records them against the month. The reference number above is the centre's
          own entry — Vilarci does not process payments or issue legal fee receipts.
        </AppText>
      </Card>

      {c ? (
        <Card style={{ marginTop: spacing.md }}>
          <AppText variant="captionStrong">Centre contact</AppText>
          <KeyValue label="Teacher" value={c.teacher_name} />
          <KeyValue label="Phone" value={c.phone} />
          <KeyValue label="Email" value={c.email} />
          <KeyValue label="Address" value={c.address} />
        </Card>
      ) : null}
    </Sheet>
  );
}
