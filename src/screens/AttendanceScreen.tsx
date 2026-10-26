import React, { useMemo, useState } from 'react';
import { View } from 'react-native';
import { useTheme } from '../theme/ThemeProvider';
import { radius, spacing } from '../theme/tokens';
import { useAttendance, useStudentContext } from '../lib/api/hooks';
import { attendanceStats } from '../lib/api/selectors';
import {
  AppText,
  Card,
  Chip,
  Divider,
  EmptyState,
  Pill,
  ProgressBar,
  Row,
  SectionHeader,
} from '../components/ui/base';
import { Screen } from '../components/ui/Screen';
import { ContextHeader } from '../components/ContextHeader';
import { ACADEMIC_NAV, SubNav } from '../components/SubNav';
import { AttendanceGauge } from '../components/charts/AttendanceGauge';
import { formatDate, monthLabel, WEEKDAYS } from '../lib/utils/format';
import type { AttendanceRecord } from '../lib/data/types';

export function AttendanceScreen() {
  const { colors } = useTheme();
  const ctx = useStudentContext();
  const { records, stats } = useAttendance();
  const [month, setMonth] = useState<string | null>(null);

  const months = useMemo(
    () => [...new Set(records.map((r) => r.date.slice(0, 7)))].sort().reverse(),
    [records],
  );
  const activeMonth = month ?? months[0] ?? null;
  const monthRecords = useMemo(
    () => records.filter((r) => r.date.slice(0, 7) === activeMonth),
    [records, activeMonth],
  );
  const monthStats = useMemo(() => attendanceStats(monthRecords), [monthRecords]);

  if (!records.length) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.bgApp }}>
        <ContextHeader />
        <SubNav items={ACADEMIC_NAV} />
        <Screen>
          <EmptyState
            icon="📋"
            title="No attendance records"
            message="Your teachers' QR check-ins and registers will appear here once classes begin."
          />
        </Screen>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.bgApp }}>
      <ContextHeader />
      <SubNav items={ACADEMIC_NAV} />
      <Screen>
        <AppText variant="title">Attendance Register</AppText>
        <AppText variant="caption" tone="muted">
          {ctx.isAllCenters ? `${ctx.enrolledCenters.length} centres combined` : ctx.activeCenter?.name} ·{' '}
          {records.length} sessions on record
        </AppText>

        {/* Overall gauge */}
        <Card style={{ marginTop: spacing.lg }}>
          <Row gap={spacing.lg} align="center">
            <AttendanceGauge value={stats.rate} size={120} label="Overall" />
            <View style={{ flex: 1, gap: spacing.sm }}>
              <StatusLine label="Present" count={stats.present} total={stats.total} color={colors.success} />
              <StatusLine label="Late" count={stats.late} total={stats.total} color={colors.accent} />
              <StatusLine label="Absent" count={stats.absent} total={stats.total} color={colors.error} />
            </View>
          </Row>
          <Divider style={{ marginVertical: spacing.md }} />
          <AppText variant="caption" tone="muted">
            Late arrivals count as attended, matching the coaching register policy. Absences below 75% are
            flagged to parents.
          </AppText>
        </Card>

        {/* Monthly trend */}
        <View style={{ marginTop: spacing.xl }}>
          <SectionHeader icon="📈" title="Month by month" />
          <Card>
            {stats.byMonth.map((m, idx) => (
              <View key={m.month}>
                {idx > 0 ? <Divider style={{ marginVertical: spacing.sm }} /> : null}
                <Row justify="space-between" style={{ marginBottom: 5 }}>
                  <AppText variant="captionStrong">{monthLabel(`${m.month}-01`)}</AppText>
                  <AppText variant="caption" tone="muted">
                    {m.present}/{m.total} · {m.rate.toFixed(0)}%
                  </AppText>
                </Row>
                <ProgressBar
                  value={m.rate}
                  color={m.rate >= 85 ? colors.success : m.rate >= 70 ? colors.accent : colors.error}
                  height={7}
                />
              </View>
            ))}
          </Card>
        </View>

        {/* Per-centre split */}
        {ctx.enrolledCenters.length > 1 && ctx.isAllCenters ? (
          <View style={{ marginTop: spacing.xl }}>
            <SectionHeader icon="🏛️" title="By coaching centre" />
            <Row gap={spacing.sm} wrap>
              {ctx.enrolledCenters.map((c) => {
                const centerStats = attendanceStats(records.filter((r) => r.center_id === c.id));
                if (!centerStats.total) return null;
                return (
                  <Card key={c.id} style={{ flexGrow: 1, minWidth: '46%' }} rail={c.color}>
                    <AppText variant="captionStrong" numberOfLines={1}>
                      {c.name}
                    </AppText>
                    <AppText variant="metric" style={{ color: c.color, marginTop: 4 }}>
                      {centerStats.rate.toFixed(0)}%
                    </AppText>
                    <AppText variant="caption" tone="muted">
                      {centerStats.present + centerStats.late}/{centerStats.total} attended
                    </AppText>
                  </Card>
                );
              })}
            </Row>
          </View>
        ) : null}

        {/* Date-by-date register */}
        <View style={{ marginTop: spacing.xl }}>
          <SectionHeader
            icon="🗂️"
            title="Date-by-date register"
            subtitle={activeMonth ? `${monthLabel(`${activeMonth}-01`)} · ${monthStats.rate.toFixed(0)}% attended` : undefined}
          />
          <Row gap={spacing.sm} wrap style={{ marginBottom: spacing.md }}>
            {months.map((m) => (
              <Chip
                key={m}
                label={monthLabel(`${m}-01`)}
                selected={m === activeMonth}
                onPress={() => setMonth(m)}
              />
            ))}
          </Row>
          <MonthGrid records={monthRecords} month={activeMonth} />
        </View>

        {/* Recent sessions */}
        <View style={{ marginTop: spacing.xl }}>
          <SectionHeader icon="🕑" title="Recent sessions" />
          <Card>
            {records.slice(0, 12).map((r, idx) => (
              <View key={r.id}>
                {idx > 0 ? <Divider style={{ marginVertical: spacing.sm }} /> : null}
                <Row justify="space-between">
                  <View style={{ flex: 1 }}>
                    <AppText variant="captionStrong">{formatDate(r.date)}</AppText>
                    <AppText variant="caption" tone="muted" numberOfLines={1}>
                      {r.subject}
                    </AppText>
                  </View>
                  <Pill
                    label={r.status === 'present' ? 'Present' : r.status === 'late' ? 'Late' : 'Absent'}
                    tone={r.status === 'present' ? 'success' : r.status === 'late' ? 'warning' : 'error'}
                  />
                </Row>
              </View>
            ))}
          </Card>
        </View>
      </Screen>
    </View>
  );
}

function StatusLine({
  label,
  count,
  total,
  color,
}: {
  label: string;
  count: number;
  total: number;
  color: string;
}) {
  const pct = total ? (count / total) * 100 : 0;
  return (
    <View>
      <Row justify="space-between" style={{ marginBottom: 4 }}>
        <AppText variant="caption" tone="secondary">
          {label}
        </AppText>
        <AppText variant="captionStrong" style={{ color }}>
          {count}
        </AppText>
      </Row>
      <ProgressBar value={pct} color={color} height={6} />
    </View>
  );
}

/** Calendar grid of the selected month, colour-coded P / L / A per the register. */
function MonthGrid({ records, month }: { records: AttendanceRecord[]; month: string | null }) {
  const { colors } = useTheme();
  if (!month) return null;

  const [year, mon] = month.split('-').map(Number);
  const daysInMonth = new Date(year, mon, 0).getDate();
  const firstWeekday = new Date(year, mon - 1, 1).getDay();

  // One cell per calendar day; a day can hold sessions at several centres.
  const byDate = new Map<string, AttendanceRecord[]>();
  for (const r of records) {
    const list = byDate.get(r.date) ?? [];
    list.push(r);
    byDate.set(r.date, list);
  }

  const cells: (number | null)[] = [
    ...Array.from({ length: firstWeekday }, () => null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];

  const toneFor = (list: AttendanceRecord[] | undefined) => {
    if (!list?.length) return { bg: colors.surfaceMuted, fg: colors.textMuted, mark: '' };
    if (list.some((r) => r.status === 'absent')) return { bg: colors.errorBg, fg: colors.errorText, mark: 'A' };
    if (list.some((r) => r.status === 'late')) return { bg: colors.warningBg, fg: colors.warningText, mark: 'L' };
    return { bg: colors.successBg, fg: colors.successText, mark: 'P' };
  };

  return (
    <Card>
      <Row justify="space-between" style={{ marginBottom: spacing.sm }}>
        {WEEKDAYS.map((d) => (
          <AppText key={d} variant="overline" tone="muted" style={{ width: `${100 / 7}%`, textAlign: 'center' }}>
            {d[0]}
          </AppText>
        ))}
      </Row>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
        {cells.map((day, i) => {
          if (day === null) return <View key={`pad-${i}`} style={{ width: `${100 / 7}%`, aspectRatio: 1 }} />;
          const iso = `${year}-${String(mon).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
          const list = byDate.get(iso);
          const tone = toneFor(list);
          return (
            <View key={iso} style={{ width: `${100 / 7}%`, aspectRatio: 1, padding: 2.5 }}>
              <View
                style={{
                  flex: 1,
                  borderRadius: radius.xs,
                  backgroundColor: tone.bg,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <AppText variant="caption" style={{ color: tone.fg, fontSize: 11 }}>
                  {day}
                </AppText>
                {tone.mark ? (
                  <AppText variant="overline" style={{ color: tone.fg, fontSize: 8 }}>
                    {tone.mark}
                    {list && list.length > 1 ? list.length : ''}
                  </AppText>
                ) : null}
              </View>
            </View>
          );
        })}
      </View>
      <Divider style={{ marginVertical: spacing.sm }} />
      <Row gap={spacing.sm} wrap>
        <Pill label="P Present" tone="success" />
        <Pill label="L Late" tone="warning" />
        <Pill label="A Absent" tone="error" />
        <Pill label="No class" tone="neutral" />
      </Row>
    </Card>
  );
}
