import React, { useState } from 'react';
import { View } from 'react-native';
import { useTheme } from '../theme/ThemeProvider';
import { spacing } from '../theme/tokens';
import { useStudentContext, useTimetable } from '../lib/api/hooks';
import { useAppStore } from '../lib/store/useAppStore';
import { AppText, Card, Chip, Divider, EmptyState, Pill, Row, SectionHeader } from '../components/ui/base';
import { Button } from '../components/ui/Button';
import { Screen } from '../components/ui/Screen';
import { useToast } from '../components/ui/Toast';
import { ContextHeader } from '../components/ContextHeader';
import { ACADEMIC_NAV, SubNav } from '../components/SubNav';
import { formatTime, minutesBetween, todayIso, WEEKDAYS, WEEKDAYS_LONG } from '../lib/utils/format';

export function TimetableScreen() {
  const { colors, subject } = useTheme();
  const ctx = useStudentContext();
  const { entries, byDay } = useTimetable();
  const [day, setDay] = useState(new Date().getDay());
  const recordCheckIn = useAppStore((s) => s.recordCheckIn);
  const checkIns = useAppStore((s) => s.checkIns);
  const { toast, points } = useToast();

  const today = todayIso();
  const isToday = day === new Date().getDay();
  const classes = byDay(day);
  const weekLoad = WEEKDAYS.map((_, i) => byDay(i).length);
  const totalMinutes = classes.reduce((s, c) => s + minutesBetween(c.start_time, c.end_time), 0);

  const checkIn = (centerId: string, centerName: string) => {
    const res = recordCheckIn(centerId, today);
    if (res.ok) points(res.points, `Checked in at ${centerName}`);
    else toast(res.message, 'warning');
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.bgApp }}>
      <ContextHeader />
      <SubNav items={ACADEMIC_NAV} />
      <Screen>
        <AppText variant="title">Weekly Timetable</AppText>
        <AppText variant="caption" tone="muted">
          {entries.length} weekly sessions ·{' '}
          {ctx.isAllCenters ? `${ctx.enrolledCenters.length} centres combined` : ctx.activeCenter?.name}
        </AppText>

        {/* Day switcher with per-day class counts */}
        <Row gap={6} style={{ marginTop: spacing.lg }} justify="space-between">
          {WEEKDAYS.map((d, i) => (
            <View key={d} style={{ flex: 1, alignItems: 'center' }}>
              <Chip label={d} selected={i === day} onPress={() => setDay(i)} />
              <AppText variant="caption" tone={weekLoad[i] ? 'secondary' : 'muted'} style={{ marginTop: 4 }}>
                {weekLoad[i] || '—'}
              </AppText>
            </View>
          ))}
        </Row>

        <Card style={{ marginTop: spacing.lg }} muted>
          <Row justify="space-between">
            <View>
              <AppText variant="subheading">
                {WEEKDAYS_LONG[day]}
                {isToday ? ' · Today' : ''}
              </AppText>
              <AppText variant="caption" tone="muted">
                {classes.length} session{classes.length === 1 ? '' : 's'} ·{' '}
                {Math.floor(totalMinutes / 60)}h {totalMinutes % 60}m of class time
              </AppText>
            </View>
            {isToday ? <Pill label="Live day" tone="success" icon="●" /> : null}
          </Row>
        </Card>

        <View style={{ marginTop: spacing.lg, gap: spacing.sm }}>
          {classes.length ? (
            classes.map((c) => {
              const tone = subject(c.subject);
              const done = Boolean(checkIns[`${ctx.student.id}:${c.center_id}:${today}`]);
              return (
                <Card key={c.id} rail={c.centerColor}>
                  <Row align="flex-start" gap={spacing.md}>
                    <View style={{ width: 62 }}>
                      <AppText variant="captionStrong">{formatTime(c.start_time)}</AppText>
                      <AppText variant="caption" tone="muted">
                        {formatTime(c.end_time)}
                      </AppText>
                      <Pill
                        label={`${minutesBetween(c.start_time, c.end_time)}m`}
                        tone="neutral"
                        style={{ marginTop: 5 }}
                      />
                    </View>
                    <View style={{ flex: 1 }}>
                      <AppText variant="subheading" style={{ color: tone.text }}>
                        {c.subject}
                      </AppText>
                      <AppText variant="caption" tone="secondary">
                        {c.teacher}
                      </AppText>
                      <AppText variant="caption" tone="muted">
                        📍 {c.room}
                      </AppText>
                      <Row gap={5} wrap style={{ marginTop: 6 }}>
                        <Pill label={c.centerName} tone="primary" />
                        {done ? <Pill label="Attended" tone="success" icon="✓" /> : null}
                      </Row>
                    </View>
                    {isToday && !done ? (
                      <Button label="+10" size="sm" onPress={() => checkIn(c.center_id, c.centerName)} />
                    ) : null}
                  </Row>
                </Card>
              );
            })
          ) : (
            <EmptyState
              icon="🌤️"
              title={`No classes on ${WEEKDAYS_LONG[day]}`}
              message="A free slot — a good moment for the Focus Room or a revision pass."
            />
          )}
        </View>

        {/* Per-centre weekly load */}
        {ctx.enrolledCenters.length > 1 ? (
          <View style={{ marginTop: spacing.xl }}>
            <SectionHeader icon="🏛️" title="Weekly load by centre" />
            <Card>
              {ctx.enrolledCenters.map((c, idx) => {
                const centerEntries = entries.filter((e) => e.center_id === c.id);
                const mins = centerEntries.reduce((s, e) => s + minutesBetween(e.start_time, e.end_time), 0);
                return (
                  <View key={c.id}>
                    {idx > 0 ? <Divider style={{ marginVertical: spacing.sm }} /> : null}
                    <Row justify="space-between">
                      <View style={{ flex: 1 }}>
                        <AppText variant="captionStrong" numberOfLines={1}>
                          {c.name}
                        </AppText>
                        <AppText variant="caption" tone="muted">
                          {c.active_batch}
                        </AppText>
                      </View>
                      <AppText variant="bodyStrong" tone="primary">
                        {centerEntries.length} cls · {Math.floor(mins / 60)}h
                      </AppText>
                    </Row>
                  </View>
                );
              })}
            </Card>
          </View>
        ) : null}
      </Screen>
    </View>
  );
}
