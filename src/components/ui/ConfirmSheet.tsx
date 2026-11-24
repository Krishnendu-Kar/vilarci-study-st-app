import React from 'react';
import Ionicons from '@expo/vector-icons/Ionicons';
import { spacing } from '../../theme/tokens';
import { AppText, Row } from './base';
import { Button } from './Button';
import { Sheet } from './Sheet';

/**
 * Cross-platform confirmation for actions that can't simply be undone.
 * Alert.alert has no buttons on web, so these go through this sheet instead.
 * The sheet closes itself after the confirm button runs `onConfirm`.
 */
export function ConfirmSheet({
  visible,
  title,
  message,
  confirmLabel = 'Remove',
  confirmIcon = 'trash-outline',
  onConfirm,
  onClose,
}: {
  visible: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  confirmIcon?: React.ComponentProps<typeof Ionicons>['name'];
  onConfirm: () => void;
  onClose: () => void;
}) {
  return (
    <Sheet visible={visible} onClose={onClose} title={title} scroll={false}>
      <AppText variant="body" tone="secondary">
        {message}
      </AppText>
      <Row gap={spacing.sm} style={{ marginTop: spacing.xl, paddingBottom: spacing.md }}>
        <Button label="Cancel" variant="secondary" onPress={onClose} style={{ flex: 1 }} fullWidth />
        <Button
          label={confirmLabel}
          variant="danger"
          iconName={confirmIcon}
          onPress={() => {
            onConfirm();
            onClose();
          }}
          style={{ flex: 1 }}
          fullWidth
        />
      </Row>
    </Sheet>
  );
}
