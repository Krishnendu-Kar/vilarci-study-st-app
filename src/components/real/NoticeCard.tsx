import React from 'react';
import { View } from 'react-native';
import { useTheme } from '../../theme/ThemeProvider';
import { spacing } from '../../theme/tokens';
import type { NoticeItem } from '../../lib/api/notices';
import { noticeTime } from '../../lib/utils/notices';
import { AppText, Card, Pill, Row } from '../ui/base';

/** One teacher notice: batch (when several), pinned / new, when, and the text. */
export function NoticeCard({
  notice,
  isNew,
  showBatch,
  lines,
}: {
  notice: NoticeItem;
  isNew: boolean;
  showBatch?: boolean;
  lines?: number;
}) {
  const { colors } = useTheme();
  return (
    <Card accentColor={isNew ? colors.primary : notice.pinned ? colors.gold : undefined}>
      {showBatch ? (
        <AppText variant="overline" tone="primary" numberOfLines={1}>
          {notice.batchName.toUpperCase()}
        </AppText>
      ) : null}
      <Row gap={spacing.sm} wrap style={showBatch ? { marginTop: 4 } : undefined}>
        {isNew ? <Pill label="New" tone="primary" solid /> : null}
        {notice.pinned ? <Pill label="Pinned" tone="gold" icon="pin-outline" /> : null}
        <AppText variant="caption" tone="muted">
          {noticeTime(notice.created_at)}
        </AppText>
      </Row>
      <View style={{ marginTop: spacing.sm }}>
        <AppText variant="body" numberOfLines={lines} selectable={!lines}>
          {notice.body}
        </AppText>
      </View>
    </Card>
  );
}
