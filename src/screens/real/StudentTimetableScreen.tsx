import React from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useTheme } from '../../theme/ThemeProvider';
import { radius, spacing } from '../../theme/tokens';
import { useMemberships } from '../../lib/api/batches';
import { useRefresh } from '../../lib/sync/useRefresh';
import { useActiveStudent } from '../../lib/store/useActiveStudent';
import { ClassSlot, DAY_KEYS, DAY_NAMES, todayKey, weekClasses } from '../../lib/utils/timetable';
import { AppText, Card, EmptyState, Pill, Row, SectionHeader } from '../../components/ui/base';
import { Button } from '../../components/ui/Button';
import { Screen } from '../../components/ui/Screen';
import { RealTopBar } from '../../components/real/RealTopBar';

/** The active student's week, from the private batches they've joined. */
export function StudentTimetableScreen() {
  const { colors } = useTheme();
  const navigation = useNavigation<any>();
  const { active } = useActiveStudent();
  const { memberships, isLoading } = useMemberships();
  const { refreshing, refresh } = useRefresh();

  const mine = memberships.filter((m) => m.student_id === active?.id);
  const week = weekClasses(mine);
  const today = todayKey();
  const total = DAY_KEYS.reduce((n, d) => n + week[d].length, 0);

  return (
    <View style={{ flex: 1, backgroundColor: colors.bgApp }}>
      <RealTopBar title="Timetable" subtitle={active ? `${active.first_name}'s week` : undefined} />
      <Screen refreshing={refreshing} onRefresh={refresh}>
        {!active ? (
          <EmptyState icon="people-outline" title="Add a student first" message="Timetables are kept per student profile." />
        ) : isLoading ? (
          <ActivityIndicator color={colors.primary} style={{ marginTop: spacing.xxl }} />
        ) : total === 0 ? (
          <View>
            <EmptyState
              icon="calendar-outline"
              title={`No classes for ${active.first_name} yet`}
              message="Classes appear here once a teacher accepts a batch request and sets the class days."
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
            {/* Today first */}
            <SectionHeader title={`Today · ${DAY_NAMES[today]}`} subtitle={week[today].length ? `${week[today].length} class${week[today].length === 1 ? '' : 'es'}` : 'No classes today'} />
            {week[today].length ? (
              <View style={{ gap: spacing.sm }}>
                {week[today].map((c, i) => (
                  <SlotCard key={`${c.membership.id}-${i}`} slot={c} highlight />
                ))}
              </View>
            ) : (
              <Card muted>
                <AppText variant="caption" tone="muted">
                  A free day for {active.first_name}.
                </AppText>
              </Card>
            )}

            {/* Whole week */}
            <View style={{ marginTop: spacing.xxl }}>
              <SectionHeader title="This week" subtitle={`${total} class${total === 1 ? '' : 'es'} across ${DAY_KEYS.filter((d) => week[d].length).length} days`} />
              <View style={{ gap: spacing.lg }}>
                {DAY_KEYS.map((d) => (
                  <View key={d}>
                    <Row gap={spacing.sm} style={{ marginBottom: spacing.sm }}>
                      <AppText variant="subheading" style={{ color: d === today ? colors.primary : colors.textMain }}>
                        {DAY_NAMES[d]}
                      </AppText>
                      {d === today ? <Pill label="Today" tone="primary" /> : null}
                    </Row>
                    {week[d].length ? (
                      <View style={{ gap: spacing.sm }}>
                        {week[d].map((c, i) => (
                          <SlotCard key={`${c.membership.id}-${i}`} slot={c} />
                        ))}
                      </View>
                    ) : (
                      <AppText variant="caption" tone="muted">
                        No class
                      </AppText>
                    )}
                  </View>
                ))}
              </View>
            </View>
          </>
        )}
      </Screen>
    </View>
  );
}

function SlotCard({ slot, highlight }: { slot: ClassSlot; highlight?: boolean }) {
  const { colors } = useTheme();
  const m = slot.membership;
  return (
    <Card accentColor={highlight ? colors.primary : undefined}>
      <Row gap={spacing.md} align="flex-start">
        <View style={[styles.time, { backgroundColor: highlight ? colors.primarySubtle : colors.surfaceMuted }]}>
          <AppText variant="captionStrong" style={{ color: highlight ? colors.primary : colors.textMain }}>
            {slot.start}
          </AppText>
          <AppText variant="caption" tone="muted" style={{ fontSize: 11 }}>
            {slot.end}
          </AppText>
        </View>
        <View style={{ flex: 1 }}>
          <AppText variant="subheading" numberOfLines={1}>
            {m.batch_name}
          </AppText>
          <AppText variant="caption" tone="secondary" numberOfLines={1}>
            {[m.subject, m.grade, m.board].filter(Boolean).join(' · ')}
          </AppText>
          <Row gap={6} style={{ marginTop: 4 }}>
            <Ionicons name="person-circle-outline" size={13} color={colors.textMuted} />
            <AppText variant="caption" tone="muted" style={{ flex: 1 }} numberOfLines={1}>
              {m.teacher_name}
              {m.room ? ` · ${m.room}` : ''}
            </AppText>
          </Row>
        </View>
      </Row>
    </Card>
  );
}

const styles = StyleSheet.create({
  time: { minWidth: 76, paddingVertical: 8, paddingHorizontal: 10, borderRadius: radius.md, alignItems: 'center' },
});
