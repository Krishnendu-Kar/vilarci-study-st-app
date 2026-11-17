import React from 'react';
import { ActivityIndicator, Pressable, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useTheme } from '../../theme/ThemeProvider';
import { spacing } from '../../theme/tokens';
import { Membership, MembershipStatus, STATUS_LABEL, useMemberships } from '../../lib/api/batches';
import { useRefresh } from '../../lib/sync/useRefresh';
import { useActiveStudent } from '../../lib/store/useActiveStudent';
import { money } from '../../lib/utils/format';
import { AppText, Card, EmptyState, Pill, Row, SectionHeader } from '../../components/ui/base';
import { Button } from '../../components/ui/Button';
import { Screen } from '../../components/ui/Screen';
import { RealTopBar } from '../../components/real/RealTopBar';

const GROUPS: { key: string; statuses: MembershipStatus[]; title: string; subtitle: string }[] = [
  { key: 'joined', statuses: ['approved'], title: 'Joined', subtitle: 'Tap a batch to see its fees' },
  { key: 'waiting', statuses: ['pending'], title: 'Waiting for teacher', subtitle: 'The teacher approves every request' },
  { key: 'declined', statuses: ['declined'], title: 'Declined', subtitle: 'Ask the teacher if this was a mistake' },
  { key: 'past', statuses: ['left', 'removed'], title: 'Past batches', subtitle: 'No longer in these batches' },
];

/** The active student's private batches, grouped by status. */
export function BatchesScreen() {
  const { colors } = useTheme();
  const navigation = useNavigation<any>();
  const { active } = useActiveStudent();
  const { memberships, isLoading } = useMemberships();
  const { refreshing, refresh } = useRefresh();

  const mine = memberships.filter((m) => m.student_id === active?.id);
  const join = () => navigation.navigate('JoinBatch', active ? { studentId: active.id } : undefined);

  return (
    <View style={{ flex: 1, backgroundColor: colors.bgApp }}>
      <RealTopBar title="Batches" subtitle={active ? `${active.first_name}'s batches` : undefined} />
      <Screen refreshing={refreshing} onRefresh={refresh}>
        {!active ? (
          <EmptyState icon="people-outline" title="Add a student first" message="Batches are joined for a student profile." />
        ) : isLoading ? (
          <ActivityIndicator color={colors.primary} style={{ marginTop: spacing.xxl }} />
        ) : !mine.length ? (
          <View>
            <EmptyState
              icon="people-outline"
              title={`${active.first_name} hasn’t joined a batch yet`}
              message="Got a join link or code from a teacher — tuition, music, art, yoga or anything else? Open the link, or enter the code."
            />
            <Button label={`Join a batch for ${active.first_name}`} iconName="enter-outline" fullWidth onPress={join} />
          </View>
        ) : (
          <>
            <Button label="Join another batch" iconName="add" variant="secondary" fullWidth onPress={join} />
            {GROUPS.map((g) => {
              const list = mine.filter((m) => g.statuses.includes(m.status));
              if (!list.length) return null;
              return (
                <View key={g.key} style={{ marginTop: spacing.xxl }}>
                  <SectionHeader title={`${g.title} · ${list.length}`} subtitle={g.subtitle} />
                  <View style={{ gap: spacing.md }}>
                    {list.map((m) => (
                      <MembershipCard
                        key={m.id}
                        m={m}
                        onPress={m.status === 'approved' ? () => navigation.navigate('BatchFees', { membershipId: m.id }) : undefined}
                      />
                    ))}
                  </View>
                </View>
              );
            })}
          </>
        )}
      </Screen>
    </View>
  );
}

function MembershipCard({ m, onPress }: { m: Membership; onPress?: () => void }) {
  const { colors } = useTheme();
  const tone = m.status === 'approved' ? 'success' : m.status === 'pending' ? 'gold' : m.status === 'declined' ? 'error' : 'neutral';
  return (
    <Pressable onPress={onPress} disabled={!onPress} accessibilityRole={onPress ? 'button' : undefined} style={({ pressed }) => ({ opacity: pressed ? 0.85 : 1 })}>
      <Card>
        <Row justify="space-between" align="flex-start" gap={spacing.md}>
          <View style={{ flex: 1 }}>
            <AppText variant="subheading" numberOfLines={1}>
              {m.batch_name}
            </AppText>
            <AppText variant="caption" tone="muted" numberOfLines={1}>
              {[m.subject, m.grade, m.board].filter(Boolean).join(' · ')}
            </AppText>
          </View>
          <Pill label={STATUS_LABEL[m.status]} tone={tone} />
        </Row>
        <Row gap={6} style={{ marginTop: spacing.sm }}>
          <Ionicons name="person-circle-outline" size={14} color={colors.textMuted} />
          <AppText variant="caption" tone="secondary" style={{ flex: 1 }} numberOfLines={1}>
            {[m.teacher_name, m.monthly_fee != null ? `${money(m.monthly_fee)}/month` : null].filter(Boolean).join(' · ')}
          </AppText>
          {onPress ? (
            <Row gap={3}>
              <Ionicons name="wallet-outline" size={13} color={colors.primary} />
              <AppText variant="captionStrong" tone="primary">
                Fees
              </AppText>
            </Row>
          ) : null}
        </Row>
      </Card>
    </Pressable>
  );
}
