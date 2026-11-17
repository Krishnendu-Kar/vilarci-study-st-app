import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Linking, Modal, Pressable, StyleSheet, View } from 'react-native';
import { BarcodeScanningResult, CameraView, useCameraPermissions } from 'expo-camera';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Ionicons from '@expo/vector-icons/Ionicons';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../../theme/ThemeProvider';
import { radius, spacing } from '../../theme/tokens';
import { isJoinCode, joinCodeFromUrl, normalizeJoinCode } from '../../lib/api/batches';
import { AppText } from '../ui/base';
import { Button } from '../ui/Button';

const FRAME = 248;

/** A scanned QR's text → join code: a join link or the bare code. */
function codeFromScan(data: string): string | null {
  const fromLink = joinCodeFromUrl(data);
  if (fromLink) return fromLink;
  const bare = normalizeJoinCode(data);
  return isJoinCode(bare) ? bare : null;
}

/**
 * Full-screen camera that reads a teacher's batch QR (join link or code) and
 * hands back the join code. Anything else is ignored with a hint, and the
 * camera keeps scanning.
 */
export function JoinQrScanner({ visible, onClose, onCode }: { visible: boolean; onClose: () => void; onCode: (code: string) => void }) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const [permission, requestPermission] = useCameraPermissions();
  const [wrongQr, setWrongQr] = useState(false);
  // The camera reports the same QR many times a second; handle one at a time.
  const busy = useRef(false);

  useEffect(() => {
    if (!visible) return;
    busy.current = false;
    setWrongQr(false);
    if (permission && !permission.granted && permission.canAskAgain) requestPermission();
  }, [visible, permission, requestPermission]);

  const onScanned = ({ data }: BarcodeScanningResult) => {
    if (busy.current) return;
    busy.current = true;
    const code = codeFromScan(data);
    if (code) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
      onCode(code);
      return;
    }
    setWrongQr(true);
    setTimeout(() => {
      busy.current = false;
    }, 1500);
  };

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose} statusBarTranslucent navigationBarTranslucent>
      <View style={{ flex: 1, backgroundColor: '#000' }}>
        {permission?.granted ? (
          <>
            <CameraView
              style={StyleSheet.absoluteFill}
              facing="back"
              barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
              onBarcodeScanned={visible ? onScanned : undefined}
            />
            {/* Dimmed surround with a clear square in the middle */}
            <View style={StyleSheet.absoluteFill} pointerEvents="none">
              <View style={styles.shade} />
              <View style={{ flexDirection: 'row', height: FRAME }}>
                <View style={styles.shade} />
                <View style={{ width: FRAME, height: FRAME }}>
                  <Corner style={{ top: 0, left: 0, borderTopWidth: 4, borderLeftWidth: 4, borderTopLeftRadius: radius.lg }} color={colors.goldBright} />
                  <Corner style={{ top: 0, right: 0, borderTopWidth: 4, borderRightWidth: 4, borderTopRightRadius: radius.lg }} color={colors.goldBright} />
                  <Corner style={{ bottom: 0, left: 0, borderBottomWidth: 4, borderLeftWidth: 4, borderBottomLeftRadius: radius.lg }} color={colors.goldBright} />
                  <Corner style={{ bottom: 0, right: 0, borderBottomWidth: 4, borderRightWidth: 4, borderBottomRightRadius: radius.lg }} color={colors.goldBright} />
                </View>
                <View style={styles.shade} />
              </View>
              <View style={[styles.shade, { alignItems: 'center', paddingTop: spacing.xl, paddingHorizontal: spacing.xl }]}>
                <AppText variant="subheading" center style={{ color: '#FDFBF9' }}>
                  Point at the teacher’s batch QR
                </AppText>
                <AppText variant="caption" center style={{ color: 'rgba(253,251,249,0.75)', marginTop: 4 }}>
                  The batch opens as soon as the code is read.
                </AppText>
                {wrongQr ? (
                  <View style={[styles.hint, { backgroundColor: colors.errorBg }]}>
                    <Ionicons name="alert-circle-outline" size={15} color={colors.errorText} />
                    <AppText variant="captionStrong" style={{ color: colors.errorText }}>
                      That QR isn’t a Vilarci batch code
                    </AppText>
                  </View>
                ) : null}
              </View>
            </View>
          </>
        ) : (
          <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.xl }}>
            {!permission ? (
              <ActivityIndicator color="#FDFBF9" />
            ) : (
              <>
                <Ionicons name="camera-outline" size={44} color="#FDFBF9" />
                <AppText variant="subheading" center style={{ color: '#FDFBF9', marginTop: spacing.md }}>
                  Camera access is needed to scan
                </AppText>
                <AppText variant="caption" center style={{ color: 'rgba(253,251,249,0.75)', marginTop: 4, maxWidth: 280 }}>
                  It’s only used to read the batch QR. You can also type the code instead.
                </AppText>
                <Button
                  label={permission.canAskAgain ? 'Allow camera' : 'Open settings'}
                  iconName="camera-outline"
                  onPress={() => (permission.canAskAgain ? requestPermission() : Linking.openSettings())}
                  style={{ marginTop: spacing.lg }}
                />
              </>
            )}
          </View>
        )}

        <Pressable
          onPress={onClose}
          hitSlop={10}
          accessibilityRole="button"
          accessibilityLabel="Close scanner"
          style={({ pressed }) => [styles.close, { top: insets.top + spacing.sm, opacity: pressed ? 0.7 : 1 }]}
        >
          <Ionicons name="close" size={22} color="#FDFBF9" />
        </Pressable>
      </View>
    </Modal>
  );
}

function Corner({ style, color }: { style: object; color: string }) {
  return <View style={[{ position: 'absolute', width: 34, height: 34, borderColor: color }, style]} />;
}

const styles = StyleSheet.create({
  shade: { flex: 1, backgroundColor: 'rgba(0,0,0,0.55)' },
  close: {
    position: 'absolute',
    left: spacing.lg,
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
  hint: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: spacing.lg,
    paddingHorizontal: spacing.md,
    paddingVertical: 8,
    borderRadius: radius.pill,
  },
});
