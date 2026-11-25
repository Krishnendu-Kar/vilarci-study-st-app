import React from 'react';
import { StyleSheet, View } from 'react-native';
import { useRoute } from '@react-navigation/native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useTheme } from '../../theme/ThemeProvider';
import { spacing } from '../../theme/tokens';
import { useMemberships } from '../../lib/api/batches';
import { useLocalStore } from '../../lib/local/store';
import { attendanceStart, classDateLabel } from '../../lib/utils/attendance';
import { courseLabel, monthLabel } from '../../lib/utils/months';
import { money } from '../../lib/utils/format';
import { DAY_KEYS, DAY_NAMES, todayKey } from '../../lib/utils/timetable';
import { AppText, Card, Divider, EmptyState, KeyValue, Pill, Row, SectionHeader } from '../../components/ui/base';
import { Screen } from '../../components/ui/Screen';
import { RealTopBar } from '../../components/real/RealTopBar';

/** Everything about one of the student's batches, in one place. */
export function StudentBatchInfoScreen() {
  const { colors } = useTheme();
  const membershipId: string | undefined = useRoute<any>().params?.membershipId;
  const { memberships } = useMemberships();
  const m = memberships.find((x) => x.id === membershipId);
  const batch = useLocalStore((s) => (m ? s.batches[m.batch_id] : undefined));

  if (!m) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.bgApp }}>
        <RealTopBar title="Batch info" />
        <Screen>
          <EmptyState icon="school-outline" title="Batch not found" message="This batch is no longer on this phone." />
        </Screen>
      </View>
    );
  }

  const level = [m.grade, m.board].filter(Boolean).join(' · ');
  const start = attendanceStart(m.joined_month, m.decided_at);
  const teacher = batch?.teacher_card;
  const today = todayKey();

  return (
    <View style={{ flex: 1, backgroundColor: colors.bgApp }}>
      <RealTopBar title={m.kind === 'section' ? 'Section info' : m.kind === 'subject' ? 'Subject info' : 'Batch info'} subtitle={m.batch_name} />
      <Screen>
        <AppText variant="title">{m.batch_name}</AppText>
        <Row gap={5} wrap style={{ marginTop: spacing.sm }}>
          {m.kind === 'section' ? null : <Pill label={m.subject} tone="primary" />}
          {m.institute ? <Pill label={m.institute.name} tone="gold" /> : null}
          {level ? <Pill label={level} /> : null}
        </Row>

        <Card style={{ marginTop: spacing.lg }}>
          {m.kind === 'section' ? null : <KeyValue label="Teacher" value={m.teacher_name || '—'} />}
          {m.kind === 'subject' ? null : (
            <KeyValue label="Monthly fee" value={m.monthly_fee != null ? `${money(m.monthly_fee)} / month` : '—'} />
          )}
          <KeyValue label="Course" value={courseLabel(m.course_start, m.course_end) ?? 'Not set yet'} />
          <KeyValue label="Room / venue" value={m.room || '—'} />
          {m.kind === 'subject' ? null : <KeyValue label="Join code" value={m.join_code ?? '—'} />}
          <Divider style={{ marginVertical: spacing.sm }} />
          <KeyValue label="Student" value={m.student_name} />
          <KeyValue label="Joined" value={m.joined_month ? monthLabel(m.joined_month) : '—'} />
          <KeyValue label="Attendance counts from" value={start ? classDateLabel(start, true) : '—'} />
        </Card>

        <View style={{ marginTop: spacing.xxl, display: m.kind === 'section' ? 'none' : 'flex' }}>
          <SectionHeader title="Weekly timetable" />
          <Card padded={false}>
            {DAY_KEYS.map((d, i) => {
              const v = m.weekly_schedule?.[d]?.trim();
              const closed = !v || v.toLowerCase() === 'closed';
              return (
                <Row
                  key={d}
                  justify="space-between"
                  style={{
                    paddingVertical: 10,
                    paddingHorizontal: spacing.lg,
                    borderTopWidth: i ? StyleSheet.hairlineWidth : 0,
                    borderTopColor: colors.border,
                    backgroundColor: d === today ? colors.primarySubtle : 'transparent',
                  }}
                >
                  <AppText variant={d === today ? 'bodyStrong' : 'body'} style={{ color: d === today ? colors.primary : colors.textMain }}>
                    {DAY_NAMES[d]}
                  </AppText>
                  <AppText variant={closed ? 'caption' : 'bodyStrong'} tone={closed ? 'muted' : undefined}>
                    {closed ? 'No class' : v.replace(/\s*-\s*/, ' – ')}
                  </AppText>
                </Row>
              );
            })}
          </Card>
        </View>

        {teacher?.name ? (
          <View style={{ marginTop: spacing.xxl }}>
            <SectionHeader title="Teacher" />
            <Card>
              <AppText variant="subheading">{teacher.name}</AppText>
              <AppText variant="caption" tone="muted">
                {[teacher.qualification, teacher.subject, teacher.experience_years != null ? `${teacher.experience_years} yrs experience` : null]
                  .filter(Boolean)
                  .join(' · ')}
              </AppText>
              {teacher.achievements?.length ? (
                <View style={{ marginTop: spacing.sm, gap: 4 }}>
                  {teacher.achievements.map((a, i) => (
                    <Row key={i} gap={6} align="flex-start">
                      <Ionicons name="ribbon-outline" size={13} color={colors.gold} style={{ marginTop: 3 }} />
                      <AppText variant="caption" tone="secondary" style={{ flex: 1 }}>
                        {a}
                      </AppText>
                    </Row>
                  ))}
                </View>
              ) : null}
            </Card>
          </View>
        ) : null}
      </Screen>
    </View>
  );
}
