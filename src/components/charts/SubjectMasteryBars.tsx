import React from 'react';
import { View } from 'react-native';
import { useTheme } from '../../theme/ThemeProvider';
import { spacing } from '../../theme/tokens';
import type { SubjectMastery } from '../../lib/api/selectors';
import { AppText, EmptyState, ProgressBar, Row } from '../ui/base';

/** Normalised subject mastery bars, coloured by the subject taxonomy. */
export function SubjectMasteryBars({ data }: { data: SubjectMastery[] }) {
  const { subject } = useTheme();

  if (!data.length) {
    return <EmptyState icon="📊" title="No marks recorded yet" message="Subject mastery appears once your teachers publish test marks." />;
  }

  return (
    <View style={{ gap: spacing.md }}>
      {data.map((d) => {
        const tone = subject(d.subject);
        return (
          <View key={d.subject}>
            <Row justify="space-between" style={{ marginBottom: 5 }}>
              <AppText variant="captionStrong" style={{ color: tone.text, flex: 1 }} numberOfLines={1}>
                {d.subject}
              </AppText>
              <AppText variant="caption" tone="muted">
                {d.obtained}/{d.max} · {d.percent.toFixed(0)}%
              </AppText>
            </Row>
            <ProgressBar value={d.percent} color={tone.base} height={7} />
          </View>
        );
      })}
    </View>
  );
}
