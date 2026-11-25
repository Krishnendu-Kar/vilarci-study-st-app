import React, { useState } from 'react';
import { ActivityIndicator, Pressable, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useTheme } from '../../theme/ThemeProvider';
import { spacing } from '../../theme/tokens';
import {
  describeLeaveError,
  Membership,
  MembershipStatus,
  STATUS_LABEL,
  useLeaveBatch,
  useMemberships,
} from '../../lib/api/batches';
import { useRefresh } from '../../lib/sync/useRefresh';
import { useActiveStudent } from '../../lib/store/useActiveStudent';
import { money } from '../../lib/utils/format';
import { AppText, Card, CenterMark, EmptyState, Pill, Row, SectionHeader } from '../../components/ui/base';
import { Button } from '../../components/ui/Button';
import { Screen } from '../../components/ui/Screen';
import { ConfirmSheet } from '../../components/ui/ConfirmSheet';
import { useToast } from '../../components/ui/Toast';
import { RealTopBar } from '../../components/real/RealTopBar';

const GROUPS: { key: string; statuses: MembershipStatus[]; title: string; subtitle: string }[] = [
  { key: 'joined', statuses: ['approved'], title: 'Joined', subtitle: 'Tap a batch to open it' },
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

  const toast = useToast();
  const leave = useLeaveBatch();
  const [cancelling, setCancelling] = useState<Membership | null>(null);

  // Subjects show inside their section, not as batches of their own.
  const mine = memberships.filter((m) => m.student_id === active?.id && m.kind !== 'subject');
  const subjectCount = (m: Membership) =>
    memberships.filter((x) => x.kind === 'subject' && x.parent_id === m.batch_id && x.student_id === m.student_id && x.status === 'approved').length;
  const join = () => navigation.navigate('JoinBatch', active ? { studentId: active.id } : undefined);

  const cancelRequest = async (m: Membership) => {
    try {
      await leave.mutateAsync(m.id);
      toast.toast(`Request to ${m.batch_name} cancelled`, 'info');
    } catch (err) {
      toast.toast(describeLeaveError(err), 'error');
    }
  };

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
              message="Got a join link or code from a teacher or a coaching institute — tuition, music, art, yoga or anything else? Open the link, or enter the code."
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
                        subjects={subjectCount(m)}
                        onPress={m.status === 'approved' ? () => navigation.navigate('BatchDetail', { membershipId: m.id }) : undefined}
                        onCancel={m.status === 'pending' ? () => setCancelling(m) : undefined}
                      />
                    ))}
                  </View>
                </View>
              );
            })}
          </>
        )}
      </Screen>

      <ConfirmSheet
        visible={cancelling != null}
        title="Cancel this request?"
        message={
          cancelling
            ? `${cancelling.batch_name} won’t see the request any more. You can ask again later with the same code. Needs the internet.`
            : ''
        }
        confirmLabel="Cancel request"
        confirmIcon="close-circle-outline"
        onClose={() => setCancelling(null)}
        onConfirm={() => cancelling && cancelRequest(cancelling)}
      />
    </View>
  );
}

function MembershipCard({ m, subjects, onPress, onCancel }: { m: Membership; subjects: number; onPress?: () => void; onCancel?: () => void }) {
  const { colors } = useTheme();
  const section = m.kind === 'section';
  const tone = m.status === 'approved' ? 'success' : m.status === 'pending' ? 'gold' : m.status === 'declined' ? 'error' : 'neutral';
  return (
    <Pressable onPress={onPress} disabled={!onPress} accessibilityRole={onPress ? 'button' : undefined} style={({ pressed }) => ({ opacity: pressed ? 0.85 : 1 })}>
      <Card>
        <Row justify="space-between" align="flex-start" gap={spacing.md}>
          {section && m.institute ? <CenterMark text={m.institute.logo_text} color={m.institute.theme_color} size={40} /> : null}
          <View style={{ flex: 1 }}>
            <AppText variant="subheading" numberOfLines={1}>
              {m.batch_name}
            </AppText>
            <AppText variant="caption" tone="muted" numberOfLines={1}>
              {(section ? [m.institute?.name, m.grade, m.board] : [m.subject, m.grade, m.board]).filter(Boolean).join(' · ')}
            </AppText>
          </View>
          <Pill label={STATUS_LABEL[m.status]} tone={tone} />
        </Row>
        <Row gap={6} style={{ marginTop: spacing.sm }}>
          <Ionicons name={section ? 'library-outline' : 'person-circle-outline'} size={14} color={colors.textMuted} />
          <AppText variant="caption" tone="secondary" style={{ flex: 1 }} numberOfLines={1}>
            {[
              section ? (subjects ? `${subjects} subject${subjects === 1 ? '' : 's'}` : 'Coaching institute') : m.teacher_name,
              m.monthly_fee != null ? `${money(m.monthly_fee)}/month` : null,
            ]
              .filter(Boolean)
              .join(' · ')}
          </AppText>
          {onPress ? (
            <Row gap={2}>
              <AppText variant="captionStrong" tone="primary">
                Open
              </AppText>
              <Ionicons name="chevron-forward" size={13} color={colors.primary} />
            </Row>
          ) : null}
          {onCancel ? (
            <Pressable onPress={onCancel} hitSlop={10} accessibilityRole="button" accessibilityLabel={`Cancel the request to ${m.batch_name}`}>
              <AppText variant="captionStrong" tone="error">
                Cancel request
              </AppText>
            </Pressable>
          ) : null}
        </Row>
      </Card>
    </Pressable>
  );
}
