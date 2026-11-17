import React from 'react';
import { Pressable } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useTheme } from '../../theme/ThemeProvider';
import { radius, spacing } from '../../theme/tokens';
import { useLocalStore } from '../../lib/local/store';
import { requestSync } from '../../lib/sync/engine';
import { useConnection } from '../../lib/network';
import { AppText } from '../ui/base';

/** Shown when the last sync failed while online: what the screen shows is from the phone. Tap to retry. */
export function SyncBanner() {
  const { colors } = useTheme();
  const error = useLocalStore((s) => s.syncError);
  const syncing = useLocalStore((s) => s.syncing);
  const lastSyncedAt = useLocalStore((s) => s.lastSyncedAt);
  // With no internet the yellow bar at the bottom already says so.
  const offline = useConnection() === 'offline';
  if (!error || offline) return null;
  return (
    <Pressable
      onPress={() => requestSync()}
      accessibilityRole="button"
      accessibilityLabel="Try to refresh again"
      style={({ pressed }) => ({
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.sm,
        padding: spacing.md,
        marginBottom: spacing.lg,
        borderRadius: radius.md,
        backgroundColor: colors.warningBg,
        opacity: pressed ? 0.8 : 1,
      })}
    >
      <Ionicons name="cloud-offline-outline" size={18} color={colors.warningText} />
      <AppText variant="caption" style={{ flex: 1, color: colors.warningText }}>
        {error}
        {lastSyncedAt ? ` Last updated ${lastUpdated(lastSyncedAt)}.` : ''}
      </AppText>
      <AppText variant="captionStrong" style={{ color: colors.warningText }}>
        {syncing ? '…' : 'Retry'}
      </AppText>
    </Pressable>
  );
}

function lastUpdated(ms: number): string {
  const d = new Date(ms);
  const time = d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
  return d.toDateString() === new Date().toDateString() ? `at ${time}` : `on ${d.toLocaleDateString()} ${time}`;
}
