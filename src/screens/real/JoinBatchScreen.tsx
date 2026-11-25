import React, { useState } from 'react';
import { ActivityIndicator, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useTheme } from '../../theme/ThemeProvider';
import { radius, spacing } from '../../theme/tokens';
import {
  describeJoinError,
  InstitutePreview,
  isInstituteCode,
  isJoinCode,
  normalizeJoinCode,
  STATUS_LABEL,
  useBatchPreview,
  useInstitutePreview,
  useRequestJoin,
} from '../../lib/api/batches';
import { fullName, initialsOf, useStudentProfiles } from '../../lib/api/studentProfiles';
import { money } from '../../lib/utils/format';
import { AppText, Avatar, Card, CenterMark, Divider, EmptyState, HeroCard, KeyValue, Pill, PressableCard, Row } from '../../components/ui/base';
import { Button } from '../../components/ui/Button';
import { useToast } from '../../components/ui/Toast';
import { AuthField, ErrorBanner } from '../../components/auth/AuthKit';
import { gradientFor } from '../../lib/utils/profileColors';
import { useActiveStudent } from '../../lib/store/useActiveStudent';
import { navigateToTab } from '../../navigation/realNavigationRef';
import { JoinQrScanner } from '../../components/real/JoinQrScanner';

const DAYS: [keyof import('../../lib/api/batches').WeekSchedule, string][] = [
  ['mon', 'Mon'],
  ['tue', 'Tue'],
  ['wed', 'Wed'],
  ['thu', 'Thu'],
  ['fri', 'Fri'],
  ['sat', 'Sat'],
  ['sun', 'Sun'],
];

/** "Mon · Wed · Fri" — the days a timetable has classes. */
function classDays(schedule: import('../../lib/api/batches').WeekSchedule): string {
  const days = DAYS.filter(([d]) => schedule[d] && schedule[d] !== 'Closed').map(([, label]) => label);
  return days.length ? days.join(' · ') : 'Days not set yet';
}

/**
 * Join a teacher's private batch, or a coaching institute's section, from a
 * link, a QR or a typed code. An institute's code (VLI-…) lists its sections
 * first; picking one opens that section's code (VLR-…) like a batch's.
 */
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
  const [instituteCode, setInstituteCode] = useState<string | null>(initialCode && isInstituteCode(initialCode) ? initialCode : null);
  // Pre-select the student requested by the caller, else the active one.
  const [studentId, setStudentId] = useState<string | null>(params.studentId ?? active?.id ?? null);
  const [failure, setFailure] = useState<string | null>(null);
  const [sentFor, setSentFor] = useState<string | null>(null);
  const [scanning, setScanning] = useState(false);

  const preview = useBatchPreview(code);
  const institute = useInstitutePreview(code ? null : instituteCode);
  const { profiles, isLoading: profilesLoading } = useStudentProfiles();
  const request = useRequestJoin();

  const batch = preview.data;
  // Students already in, or waiting for, this batch can't ask again.
  const statusFor = (id: string) =>
    batch?.mine.find((m) => m.student_id === id && (m.status === 'approved' || m.status === 'pending'))?.status;

  /** A batch / section code opens it; an institute's code lists its sections. */
  const open = (c: string) => {
    setFailure(null);
    if (isInstituteCode(c)) {
      setCode(null);
      setInstituteCode(c);
    } else {
      setCode(c);
    }
  };

  const lookUp = () => {
    const c = normalizeJoinCode(typed);
    if (!isJoinCode(c) && !isInstituteCode(c)) {
      setFailure('Enter the code exactly as shared, e.g. VLR-CZ78HG (a batch) or VLI-… (an institute).');
      return;
    }
    open(c);
  };

  const onScanned = (c: string) => {
    setScanning(false);
    setTyped(c);
    open(c);
  };

  const send = async () => {
    if (!code || !studentId) return;
    setFailure(null);
    try {
      await request.mutateAsync({ code, studentId });
      const p = profiles.find((x) => x.id === studentId);
      setSentFor(p ? p.first_name : 'your student');
      toast.toast(batch?.kind === 'section' ? 'Request sent to the institute' : 'Request sent to the teacher', 'success');
    } catch (err) {
      setFailure(describeJoinError(err));
    }
  };

  const isSection = batch?.kind === 'section';
  const full = batch ? batch.seats_taken >= batch.capacity : false;
  const level = batch ? [batch.grade, batch.board].filter(Boolean).join(' · ') : '';
  const days = batch ? DAYS.filter(([d]) => batch.weekly_schedule[d] && batch.weekly_schedule[d] !== 'Closed') : [];

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: colors.bgApp }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <Row gap={spacing.md} style={{ paddingTop: insets.top + spacing.sm, paddingHorizontal: spacing.lg, paddingBottom: spacing.sm }}>
        <Pressable
          onPress={() => (navigation.canGoBack() ? navigation.goBack() : navigateToTab(navigation, 'RealHome'))}
          hitSlop={10}
          accessibilityRole="button"
          accessibilityLabel="Go back"
          style={({ pressed }) => [styles.iconBtn, { backgroundColor: colors.surface, borderColor: colors.border, opacity: pressed ? 0.6 : 1 }]}
        >
          <Ionicons name="arrow-back" size={19} color={colors.textMain} />
        </Pressable>
        <AppText variant="title" style={{ flex: 1 }}>
          {instituteCode && !batch ? 'Join an institute' : 'Join a batch'}
        </AppText>
      </Row>

      <ScrollView contentContainerStyle={{ padding: spacing.lg, paddingBottom: spacing.xxxl }} keyboardShouldPersistTaps="handled">
        <ErrorBanner message={failure} />

        {/* An institute's sections: pick one */}
        {!batch && instituteCode && !code ? (
          <InstituteSections
            loading={institute.isFetching}
            data={institute.data ?? null}
            fetched={institute.isFetched}
            code={instituteCode}
            onPick={(sectionCode) => setCode(sectionCode)}
            onOtherCode={() => {
              setInstituteCode(null);
              setTyped('');
            }}
          />
        ) : null}

        {/* Code entry (prefilled from a join link) */}
        {instituteCode && !code && !batch ? null : !batch ? (
          <Card>
            <AppText variant="subheading">Scan or enter the join code</AppText>
            <AppText variant="caption" tone="muted" style={{ marginTop: 2, marginBottom: spacing.lg }}>
              Your teacher or institute shares it as a QR, a link or a code like VLR-CZ78HG.
            </AppText>
            <Button label="Scan QR code" iconName="qr-code-outline" size="lg" fullWidth onPress={() => setScanning(true)} />
            <Row gap={spacing.sm} style={{ marginVertical: spacing.lg }}>
              <View style={{ flex: 1, height: StyleSheet.hairlineWidth, backgroundColor: colors.border }} />
              <AppText variant="caption" tone="muted">
                or type the code
              </AppText>
              <View style={{ flex: 1, height: StyleSheet.hairlineWidth, backgroundColor: colors.border }} />
            </Row>
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
              <Button label="Find batch" iconName="search-outline" variant="secondary" fullWidth onPress={lookUp} />
            )}
            {code && !preview.isFetching && preview.isFetched && !batch ? (
              <AppText variant="caption" tone="error" style={{ marginTop: spacing.md }}>
                No batch found for {code}. Check the code with your teacher.
              </AppText>
            ) : null}
            {instituteCode && code ? (
              <Button
                label="Back to the institute’s sections"
                variant="ghost"
                size="sm"
                onPress={() => setCode(null)}
                style={{ marginTop: spacing.sm, alignSelf: 'center' }}
              />
            ) : null}
          </Card>
        ) : (
          <>
            {/* Batch preview */}
            <HeroCard>
              <AppText variant="overline" style={{ color: colors.goldBright }} numberOfLines={1}>
                {isSection ? (batch.institute?.name ?? 'Institute').toUpperCase() : 'PRIVATE BATCH'}
              </AppText>
              <AppText variant="display" style={{ color: '#FDFBF9', marginTop: 2 }}>
                {batch.name}
              </AppText>
              <AppText variant="caption" style={{ color: 'rgba(253,251,249,0.75)', marginTop: 2 }}>
                {(isSection ? [level] : [batch.subject, level]).filter(Boolean).join(' · ')}
              </AppText>
              {isSection ? (
                batch.institute?.address ? (
                  <Row gap={spacing.sm} style={{ marginTop: spacing.lg }} align="flex-start">
                    <Ionicons name="location-outline" size={16} color={colors.goldBright} />
                    <AppText variant="caption" style={{ color: 'rgba(253,251,249,0.85)', flex: 1 }}>
                      {batch.institute.address}
                    </AppText>
                  </Row>
                ) : null
              ) : (
                <>
                  <Row gap={spacing.sm} style={{ marginTop: spacing.lg }}>
                    <Ionicons name="person-circle-outline" size={18} color={colors.goldBright} />
                    <AppText variant="bodyStrong" style={{ color: '#FDFBF9', flex: 1 }}>
                      {batch.teacher.name}
                    </AppText>
                  </Row>
                  {batch.teacher.qualification ? (
                    <AppText variant="caption" style={{ color: 'rgba(253,251,249,0.7)', marginLeft: 26 }}>
                      {batch.teacher.qualification}
                    </AppText>
                  ) : null}
                </>
              )}
            </HeroCard>

            <Card style={{ marginTop: spacing.lg }}>
              <KeyValue label="Monthly fee" value={`${money(batch.monthly_fee)} / month`} />
              <KeyValue label="Seats" value={full ? 'Full' : `${batch.capacity - batch.seats_taken} of ${batch.capacity} left`} />
              {batch.room ? <KeyValue label="Venue" value={batch.room} /> : null}
              <Divider style={{ marginVertical: spacing.sm }} />
              {isSection ? (
                batch.subjects?.length ? (
                  batch.subjects.map((c) => (
                    <View key={c.subject} style={{ paddingVertical: 4 }}>
                      <Row justify="space-between" gap={spacing.md}>
                        <AppText variant="bodyStrong">{c.subject}</AppText>
                        <AppText variant="caption" tone="muted" numberOfLines={1} style={{ flexShrink: 1 }}>
                          {c.teacher_name ?? 'Teacher to be announced'}
                        </AppText>
                      </Row>
                      <AppText variant="caption" tone="primary">
                        {classDays(c.weekly_schedule)}
                      </AppText>
                    </View>
                  ))
                ) : (
                  <AppText variant="caption" tone="muted">
                    Subjects not added yet.
                  </AppText>
                )
              ) : days.length ? (
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
            {profilesLoading ? (
              <ActivityIndicator color={colors.primary} />
            ) : !profiles.length ? (
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
                {profiles.map((p, i) => {
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
                  {isSection ? batch.institute?.name ?? 'The institute' : batch.teacher.name} will review it. You’ll see the status in Batches.
                </AppText>
                <Button label="See batches" variant="secondary" size="sm" onPress={() => navigateToTab(navigation, 'Batches')} style={{ marginTop: spacing.md }} />
              </Card>
            ) : profiles.length ? (
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
              {isSection
                ? 'The institute approves every request. Once in, the student gets all the section’s subjects.'
                : 'The teacher approves every request before the student is added.'}
            </AppText>
          </>
        )}
      </ScrollView>
      <JoinQrScanner visible={scanning} onClose={() => setScanning(false)} onCode={onScanned} />
    </KeyboardAvoidingView>
  );
}

/** An institute's live sections from its code; tapping one opens it like a batch code. */
function InstituteSections({
  loading,
  fetched,
  data,
  code,
  onPick,
  onOtherCode,
}: {
  loading: boolean;
  fetched: boolean;
  data: InstitutePreview | null;
  code: string;
  onPick: (sectionCode: string) => void;
  onOtherCode: () => void;
}) {
  const { colors } = useTheme();
  if (loading && !data) return <ActivityIndicator color={colors.primary} style={{ marginTop: spacing.xxl }} />;
  if (!data) {
    return fetched ? (
      <Card>
        <AppText variant="subheading">No institute found for {code}</AppText>
        <AppText variant="caption" tone="muted" style={{ marginTop: 2 }}>
          Check the code with the institute — it may have been changed.
        </AppText>
        <Button label="Enter another code" variant="secondary" size="sm" onPress={onOtherCode} style={{ marginTop: spacing.md, alignSelf: 'flex-start' }} />
      </Card>
    ) : null;
  }
  return (
    <View>
      <Card>
        <Row gap={spacing.md} align="flex-start">
          <CenterMark text={data.logo_text} color={data.theme_color} size={52} />
          <View style={{ flex: 1 }}>
            <AppText variant="heading">{data.name}</AppText>
            {data.tagline ? (
              <AppText variant="caption" tone="muted">
                {data.tagline}
              </AppText>
            ) : null}
            {data.address ? (
              <AppText variant="caption" tone="muted" style={{ marginTop: 2 }}>
                {data.address}
              </AppText>
            ) : null}
          </View>
        </Row>
      </Card>
      <AppText variant="overline" tone="muted" style={{ marginTop: spacing.xl, marginBottom: spacing.sm }}>
        CHOOSE YOUR CLASS
      </AppText>
      {data.sections.length ? (
        <View style={{ gap: spacing.md }}>
          {data.sections.map((sec) => {
            const full = sec.seats_taken >= sec.capacity;
            const level = [sec.grade, sec.board].filter(Boolean).join(' · ');
            const mine = sec.mine.filter((m) => m.status === 'approved' || m.status === 'pending');
            return (
              <PressableCard key={sec.batch_id} level={1} onPress={() => onPick(sec.join_code)}>
                <Row justify="space-between" align="flex-start" gap={spacing.md}>
                  <View style={{ flex: 1 }}>
                    <AppText variant="subheading">{sec.name}</AppText>
                    <AppText variant="caption" tone="muted">
                      {[level, sec.monthly_fee ? `${money(sec.monthly_fee)}/month` : null, full ? 'Full' : `${sec.capacity - sec.seats_taken} seats left`]
                        .filter(Boolean)
                        .join(' · ')}
                    </AppText>
                  </View>
                  <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
                </Row>
                {sec.subjects.length ? (
                  <Row gap={5} wrap style={{ marginTop: spacing.sm }}>
                    {sec.subjects.map((c) => (
                      <Pill key={c.subject} label={c.subject} />
                    ))}
                  </Row>
                ) : null}
                {mine.length ? (
                  <Row gap={5} wrap style={{ marginTop: spacing.sm }}>
                    {mine.map((m) => (
                      <Pill key={m.student_id} label={STATUS_LABEL[m.status]} tone={m.status === 'approved' ? 'success' : 'gold'} />
                    ))}
                  </Row>
                ) : null}
              </PressableCard>
            );
          })}
        </View>
      ) : (
        <EmptyState icon="school-outline" title="No classes open yet" message="The institute hasn't added any sections. Ask them when admissions open." />
      )}
      <Button label="Enter another code" variant="ghost" size="sm" onPress={onOtherCode} style={{ marginTop: spacing.lg, alignSelf: 'center' }} />
    </View>
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
