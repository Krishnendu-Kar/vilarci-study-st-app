import React from 'react';
import { View } from 'react-native';
import { useRoute } from '@react-navigation/native';
import { useTheme } from '../../theme/ThemeProvider';
import { spacing } from '../../theme/tokens';
import { useSeenWhileOpen, useStudentNotices } from '../../lib/api/notices';
import { useRefresh } from '../../lib/sync/useRefresh';
import { useActiveStudent } from '../../lib/store/useActiveStudent';
import { AppText, EmptyState } from '../../components/ui/base';
import { Screen } from '../../components/ui/Screen';
import { RealTopBar } from '../../components/real/RealTopBar';
import { SyncBanner } from '../../components/real/SyncBanner';
import { NoticeCard } from '../../components/real/NoticeCard';

/** Teachers' notices for the active student: every batch, or one (from its page). */
export function StudentNoticesScreen() {
  const { colors } = useTheme();
  const params = useRoute<any>().params as { batchId?: string; batchName?: string } | undefined;
  const { active } = useActiveStudent();
  const { items, markSeen } = useStudentNotices(params?.batchId);
  const fresh = useSeenWhileOpen(items, markSeen);
  const { refreshing, refresh } = useRefresh();
  const severalBatches = new Set(items.map((n) => n.batch_id)).size > 1;

  return (
    <View style={{ flex: 1, backgroundColor: colors.bgApp }}>
      <RealTopBar
        title="Notices"
        subtitle={params?.batchName ?? (active ? `${active.first_name}'s batches` : undefined)}
      />
      <Screen refreshing={refreshing} onRefresh={refresh}>
        <SyncBanner />
        {!active ? (
          <EmptyState icon="people-outline" title="Add a student first" message="Notices come from the teachers of a student's batches." />
        ) : items.length ? (
          <>
            <View style={{ gap: spacing.md }}>
              {items.map((n) => (
                <NoticeCard key={`${n.batch_id}:${n.id}`} notice={n} isNew={n.isNew || fresh.has(n.id)} showBatch={severalBatches} />
              ))}
            </View>
            <AppText variant="caption" tone="muted" center style={{ marginTop: spacing.lg }}>
              Pull down to check for new notices.
            </AppText>
          </>
        ) : (
          <EmptyState
            icon="megaphone-outline"
            title="No notices yet"
            message="Holidays, test dates and reminders from the teacher show up here."
          />
        )}
      </Screen>
    </View>
  );
}
