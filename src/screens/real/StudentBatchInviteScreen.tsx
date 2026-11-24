import React from 'react';
import { Share, StyleSheet, useWindowDimensions, View } from 'react-native';
import { useRoute } from '@react-navigation/native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useTheme } from '../../theme/ThemeProvider';
import { radius, spacing } from '../../theme/tokens';
import { joinLinkFor, useMemberships } from '../../lib/api/batches';
import { useRefresh } from '../../lib/sync/useRefresh';
import { AppText, Card, EmptyState, IconName, Row, SectionHeader } from '../../components/ui/base';
import { Button } from '../../components/ui/Button';
import { Screen } from '../../components/ui/Screen';
import { RealTopBar } from '../../components/real/RealTopBar';
import { QrCode } from '../../components/real/QrCode';

/**
 * Invite a friend to the batch: the same QR, link and code the teacher shares.
 * The teacher still approves every request.
 */
export function StudentBatchInviteScreen() {
  const { colors } = useTheme();
  const membershipId: string | undefined = useRoute<any>().params?.membershipId;
  const { memberships } = useMemberships();
  const { refreshing, refresh } = useRefresh();
  const { width } = useWindowDimensions();
  const m = memberships.find((x) => x.id === membershipId);

  if (!m) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.bgApp }}>
        <RealTopBar title="Add students" />
        <Screen>
          <EmptyState icon="school-outline" title="Batch not found" message="This batch is no longer on this phone." />
        </Screen>
      </View>
    );
  }

  const code = m.join_code;
  const link = code ? joinLinkFor(code) : null;
  const qrSize = Math.min(240, width - spacing.lg * 2 - 96);

  const share = () => {
    if (!code || !link) return;
    Share.share({
      message:
        `Join ${m.batch_name} (${m.subject})${m.teacher_name ? ` with ${m.teacher_name}` : ''} on Vilarci Study.\n\n` +
        `Tap to join: ${link}\nJoin code: ${code}\n\nOr open Vilarci Study → Join a batch → Scan QR.`,
    }).catch(() => {});
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.bgApp }}>
      <RealTopBar title="Add students" subtitle={m.batch_name} />
      <Screen refreshing={refreshing} onRefresh={refresh}>
        {code && link ? (
          <>
            <Card style={{ alignItems: 'center' }}>
              <AppText variant="subheading" center>
                Scan to join
              </AppText>
              <AppText variant="caption" tone="muted" center style={{ marginTop: 2 }}>
                In Vilarci Study: Join a batch → Scan QR code
              </AppText>
              <View style={[styles.qrFrame, { borderColor: colors.border }]}>
                <QrCode value={link} size={qrSize} />
              </View>
              <AppText variant="overline" tone="muted">
                JOIN CODE
              </AppText>
              <AppText selectable style={[styles.code, { color: colors.textMain }]}>
                {code}
              </AppText>
              <AppText variant="caption" tone="muted" selectable numberOfLines={1} center>
                {link}
              </AppText>
              <Button label="Share with a friend" iconName="share-social-outline" fullWidth onPress={share} style={{ marginTop: spacing.lg }} />
            </Card>

            <View style={{ marginTop: spacing.xxl }}>
              <SectionHeader title="How your friend joins" />
              <Card>
                <Step n={1} icon="download-outline" text="They get Vilarci Study and add the student who'll join." />
                <Step n={2} icon="qr-code-outline" text="They scan this QR in Join a batch, open the link, or type the code." />
                <Step n={3} icon="checkmark-circle-outline" text={`${m.teacher_name || 'The teacher'} approves the request — then it's in their app.`} last />
              </Card>
              <AppText variant="caption" tone="muted" style={{ marginTop: spacing.sm }}>
                The teacher approves everyone who asks, and can change the code at any time.
              </AppText>
            </View>
          </>
        ) : (
          <>
            <EmptyState
              icon="qr-code-outline"
              title="Getting the batch’s invite code"
              message="This phone hasn’t got it yet. Pull down or tap Refresh while online."
            />
            <Button
              label="Refresh"
              iconName="refresh-outline"
              variant="secondary"
              fullWidth
              loading={refreshing}
              onPress={refresh}
              style={{ marginTop: spacing.md }}
            />
          </>
        )}
      </Screen>
    </View>
  );
}

function Step({ n, icon, text, last }: { n: number; icon: IconName; text: string; last?: boolean }) {
  const { colors } = useTheme();
  return (
    <Row gap={spacing.md} align="flex-start" style={{ marginBottom: last ? 0 : spacing.md }}>
      <View style={[styles.stepBadge, { backgroundColor: colors.primarySubtle }]}>
        <Ionicons name={icon} size={16} color={colors.primary} />
      </View>
      <View style={{ flex: 1 }}>
        <AppText variant="captionStrong" tone="muted">
          STEP {n}
        </AppText>
        <AppText variant="body" tone="secondary">
          {text}
        </AppText>
      </View>
    </Row>
  );
}

const styles = StyleSheet.create({
  qrFrame: {
    marginVertical: spacing.lg,
    padding: spacing.md,
    borderRadius: radius.lg,
    backgroundColor: '#FFFFFF',
    borderWidth: StyleSheet.hairlineWidth,
  },
  code: { fontSize: 28, lineHeight: 36, letterSpacing: 3, fontWeight: '800', marginTop: 2 },
  stepBadge: { width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center' },
});
