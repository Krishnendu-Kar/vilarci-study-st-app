import React, { useState } from 'react';
import { ActivityIndicator, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useTheme } from '../../theme/ThemeProvider';
import { radius, spacing } from '../../theme/tokens';
import {
  describeJoinError,
  isJoinCode,
  normalizeJoinCode,
  STATUS_LABEL,
  useBatchPreview,
  useMyMemberships,
  useRequestJoin,
} from '../../lib/api/batches';
import { fullName, initialsOf, useStudentProfiles } from '../../lib/api/studentProfiles';
import { rupees } from '../../lib/utils/format';
import { AppText, Avatar, Card, Divider, EmptyState, HeroCard, KeyValue, Pill, Row } from '../../components/ui/base';
import { Button } from '../../components/ui/Button';
import { useToast } from '../../components/ui/Toast';
import { AuthField, ErrorBanner } from '../../components/auth/AuthKit';
import { gradientFor } from '../../lib/utils/profileColors';
import { useActiveStudent } from '../../lib/store/useActiveStudent';

const DAYS: [keyof import('../../lib/api/batches').WeekSchedule, string][] = [
  ['mon', 'Mon'],
  ['tue', 'Tue'],
  ['wed', 'Wed'],
  ['thu', 'Thu'],
  ['fri', 'Fri'],
  ['sat', 'Sat'],
  ['sun', 'Sun'],
];

/** Join a teacher's private batch from a link or a typed code. */
export function JoinBatchScreen() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();
  const toast = useToast();
  const params = useRoute<any>().params ?? {};
  const initialCode: string | undefined = params.code;
  const { active } = useActiveStudent();

  const [typed, setTyped] = useState(initialCode ?? '');
  const [code, setCode] = useState<string | null>(initialCode && isJoinCode(initialCode) ? initialCode : null);
  // Pre-select the student requested by the caller, else the active one.
  const [studentId, setStudentId] = useState<string | null>(params.studentId ?? active?.id ?? null);
  const [failure, setFailure] = useState<string | null>(null);
  const [sentFor, setSentFor] = useState<string | null>(null);

  const preview = useBatchPreview(code);
  const profiles = useStudentProfiles();
  const memberships = useMyMemberships();
  const request = useRequestJoin();

  const batch = preview.data;
  const statusFor = (id: string) =>
    memberships.data?.find((m) => m.batch_id === batch?.batch_id && m.student_id === id && m.status !== 'declined')?.status;

  const lookUp = () => {
    const c = normalizeJoinCode(typed);
    setFailure(null);
    if (!isJoinCode(c)) {
      setFailure('Enter the code exactly as shared, e.g. VLR-CZ78HG.');
      return;
    }
    setCode(c);
  };

  const send = async () => {
    if (!code || !studentId) return;
    setFailure(null);
    try {
      await request.mutateAsync({ code, studentId });
      const p = profiles.data?.find((x) => x.id === studentId);
      setSentFor(p ? p.first_name : 'your student');
      toast.toast('Request sent to the teacher', 'success');
    } catch (err) {
      setFailure(describeJoinError(err));
    }
  };

  const full = batch ? batch.seats_taken >= batch.capacity : false;
  const level = batch ? [batch.grade, batch.board].filter(Boolean).join(' · ') : '';
  const days = batch ? DAYS.filter(([d]) => batch.weekly_schedule[d] && batch.weekly_schedule[d] !== 'Closed') : [];

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: colors.bgApp }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <Row gap={spacing.md} style={{ paddingTop: insets.top + spacing.sm, paddingHorizontal: spacing.lg, paddingBottom: spacing.sm }}>
        <Pressable
          onPress={() => (navigation.canGoBack() ? navigation.goBack() : navigation.navigate('RealHome'))}
          hitSlop={10}
          accessibilityRole="button"
          accessibilityLabel="Go back"
          style={({ pressed }) => [styles.iconBtn, { backgroundColor: colors.surface, borderColor: colors.border, opacity: pressed ? 0.6 : 1 }]}
        >
          <Ionicons name="arrow-back" size={19} color={colors.textMain} />
        </Pressable>
        <AppText variant="title" style={{ flex: 1 }}>
          Join a batch
        </AppText>
      </Row>

      <ScrollView contentContainerStyle={{ padding: spacing.lg, paddingBottom: spacing.xxxl }} keyboardShouldPersistTaps="handled">
        <ErrorBanner message={failure} />

        {/* Code entry (prefilled from a join link) */}
        {!batch ? (
          <Card>
            <AppText variant="subheading">Enter the join code</AppText>
            <AppText variant="caption" tone="muted" style={{ marginTop: 2, marginBottom: spacing.lg }}>
              Your teacher shares it as a link or a code like VLR-CZ78HG.
            </AppText>
            <AuthField
              label="Join code"
              icon="key-outline"
              placeholder="VLR-XXXXXX"
              autoCapitalize="characters"
              autoCorrect={false}
              maxLength={12}
              value={typed}
              onChangeText={(t) => {
                setTyped(t.toUpperCase());
                setFailure(null);
              }}
              onSubmitEditing={lookUp}
            />
            {preview.isFetching ? (
              <ActivityIndicator color={colors.primary} />
            ) : (
              <Button label="Find batch" iconName="search-outline" fullWidth onPress={lookUp} />
            )}
            {code && !preview.isFetching && preview.isFetched && !batch ? (
              <AppText variant="caption" tone="error" style={{ marginTop: spacing.md }}>
                No batch found for {code}. Check the code with your teacher.
              </AppText>
            ) : null}
          </Card>
        ) : (
          <>
            {/* Batch preview */}
            <HeroCard>
              <AppText variant="overline" style={{ color: colors.goldBright }}>
                PRIVATE BATCH
              </AppText>
              <AppText variant="display" style={{ color: '#FDFBF9', marginTop: 2 }}>
                {batch.name}
              </AppText>
              <AppText variant="caption" style={{ color: 'rgba(253,251,249,0.75)', marginTop: 2 }}>
                {[batch.subject, level].filter(Boolean).join(' · ')}
              </AppText>
              <Row gap={spacing.sm} style={{ marginTop: spacing.lg }}>
                <Ionicons name="person-circle-outline" size={18} color={colors.goldBright} />
                <AppText variant="bodyStrong" style={{ color: '#FDFBF9', flex: 1 }}>
                  {batch.teacher_name}
                </AppText>
              </Row>
              {batch.teacher_qualification ? (
                <AppText variant="caption" style={{ color: 'rgba(253,251,249,0.7)', marginLeft: 26 }}>
                  {batch.teacher_qualification}
                </AppText>
              ) : null}
            </HeroCard>

            <Card style={{ marginTop: spacing.lg }}>
              <KeyValue label="Monthly fee" value={`${rupees(batch.monthly_fee)} / month`} />
              <KeyValue label="Seats" value={full ? 'Full' : `${batch.capacity - batch.seats_taken} of ${batch.capacity} left`} />
              {batch.room ? <KeyValue label="Venue" value={batch.room} /> : null}
              <Divider style={{ marginVertical: spacing.sm }} />
              {days.length ? (
                days.map(([d, label]) => (
                  <Row key={d} justify="space-between" style={{ paddingVertical: 4 }}>
                    <AppText variant="bodyStrong">{label}</AppText>
                    <AppText variant="body" tone="primary">
                      {batch.weekly_schedule[d].replace(/\s*-\s*/, ' – ')}
                    </AppText>
                  </Row>
                ))
              ) : (
                <AppText variant="caption" tone="muted">
                  Class days not set yet.
                </AppText>
              )}
            </Card>

            {/* Choose a profile */}
            <AppText variant="overline" tone="muted" style={{ marginTop: spacing.xxl, marginBottom: spacing.sm }}>
              WHO IS JOINING?
            </AppText>
            {profiles.isLoading ? (
              <ActivityIndicator color={colors.primary} />
            ) : !profiles.data?.length ? (
              <View>
                <EmptyState icon="people-outline" title="Add a student profile first" message="Joining is done for a student profile — yourself or someone you manage." />
                <Button
                  label="Add student profile"
                  iconName="person-add-outline"
                  fullWidth
                  onPress={() => navigation.navigate('StudentForm')}
                  style={{ marginTop: spacing.md }}
                />
              </View>
            ) : (
              <View style={{ gap: spacing.sm }}>
                {profiles.data.map((p, i) => {
                  const status = statusFor(p.id);
                  const selected = studentId === p.id;
                  return (
                    <Pressable
                      key={p.id}
                      disabled={Boolean(status) || full}
                      onPress={() => setStudentId(p.id)}
                      accessibilityRole="radio"
                      accessibilityState={{ checked: selected, disabled: Boolean(status) || full }}
                      style={({ pressed }) => ({
                        flexDirection: 'row',
                        alignItems: 'center',
                        gap: spacing.md,
                        padding: spacing.md,
                        borderRadius: radius.lg,
                        borderWidth: selected ? 1.5 : StyleSheet.hairlineWidth,
                        borderColor: selected ? colors.primary : colors.border,
                        backgroundColor: selected ? colors.primarySubtle : colors.surface,
                        opacity: status || full ? 0.6 : pressed ? 0.85 : 1,
                      })}
                    >
                      <Avatar initials={initialsOf(p)} gradient={gradientFor(i)} size={40} />
                      <AppText variant="subheading" style={{ flex: 1 }} numberOfLines={1}>
                        {fullName(p)}
                      </AppText>
                      {status ? (
                        <Pill label={STATUS_LABEL[status]} tone={status === 'approved' ? 'success' : 'gold'} />
                      ) : selected ? (
                        <Ionicons name="checkmark-circle" size={22} color={colors.primary} />
                      ) : (
                        <Ionicons name="ellipse-outline" size={22} color={colors.borderStrong} />
                      )}
                    </Pressable>
                  );
                })}
              </View>
            )}

            {sentFor ? (
              <Card style={{ marginTop: spacing.xl }} accentColor={colors.gold}>
                <Row gap={spacing.sm}>
                  <Ionicons name="hourglass-outline" size={18} color={colors.gold} />
                  <AppText variant="subheading" style={{ flex: 1 }}>
                    Request sent for {sentFor}
                  </AppText>
                </Row>
                <AppText variant="caption" tone="muted" style={{ marginTop: 4 }}>
                  {batch.teacher_name} will review it. You'll see the status on your home screen.
                </AppText>
                <Button label="Back to home" variant="secondary" size="sm" onPress={() => navigation.navigate('RealHome')} style={{ marginTop: spacing.md }} />
              </Card>
            ) : profiles.data?.length ? (
              <Button
                label={full ? 'Batch is full' : 'Request to join'}
                iconName="paper-plane-outline"
                size="lg"
                fullWidth
                disabled={!studentId || full || Boolean(statusFor(studentId))}
                loading={request.isPending}
                onPress={send}
                style={{ marginTop: spacing.xl }}
              />
            ) : null}
            <AppText variant="caption" tone="muted" center style={{ marginTop: spacing.md }}>
              The teacher approves every request before the student is added.
            </AppText>
          </>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  iconBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: StyleSheet.hairlineWidth,
  },
});
