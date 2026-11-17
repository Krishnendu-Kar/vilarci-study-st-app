import React, { useMemo, useRef, useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, type TextInputInstance, View } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import DateTimePicker from '@react-native-community/datetimepicker';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useTheme } from '../../theme/ThemeProvider';
import { radius, spacing } from '../../theme/tokens';
import { toISODate } from '../../lib/auth';
import {
  describeProfileError,
  Gender,
  OTHER_RELATION_MAX,
  OTHER_RELATION_MIN,
  Relation,
  RELATIONS,
  useDeleteStudentProfile,
  useSaveStudentProfile,
  useStudentProfiles,
} from '../../lib/api/studentProfiles';
import { formatDateLong } from '../../lib/utils/format';
import { AppText, Chip, Row } from '../../components/ui/base';
import { Button } from '../../components/ui/Button';
import { Sheet } from '../../components/ui/Sheet';
import { useToast } from '../../components/ui/Toast';
import { AuthField, ErrorBanner } from '../../components/auth/AuthKit';

const GENDERS: { value: Gender; label: string }[] = [
  { value: 'female', label: 'Female' },
  { value: 'male', label: 'Male' },
  { value: 'other', label: 'Other' },
];

const CLASSES = ['Nursery', 'KG', ...Array.from({ length: 12 }, (_, i) => `Class ${i + 1}`), 'College'];
const BOARDS = ['CBSE', 'ICSE', 'State Board', 'IB', 'Other'];

type Errors = Partial<Record<'relation' | 'relationOther' | 'firstName' | 'lastName' | 'dob', string>>;

/** Add or edit one student profile (online: the server checks the limits, then the app syncs). */
export function StudentFormScreen() {
  const { colors, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const toast = useToast();
  const editingId: string | undefined = route.params?.id;

  const { profiles } = useStudentProfiles();
  const existing = profiles.find((p) => p.id === editingId);
  const selfTaken = profiles.some((p) => p.relation === 'self' && p.id !== editingId);
  // Only the account that added a student can remove it.
  const canRemove = existing?.my_role === 'owner';

  const save = useSaveStudentProfile();
  const remove = useDeleteStudentProfile();

  const [relation, setRelation] = useState<Relation | null>(existing?.relation ?? null);
  const [relationOther, setRelationOther] = useState(existing?.relation_other ?? '');
  const [relationOpen, setRelationOpen] = useState(false);
  const [firstName, setFirstName] = useState(existing?.first_name ?? '');
  const [middleName, setMiddleName] = useState(existing?.middle_name ?? '');
  const [lastName, setLastName] = useState(existing?.last_name ?? '');
  const [gender, setGender] = useState<Gender | null>(existing?.gender ?? null);
  const [dob, setDob] = useState<Date | null>(existing?.dob ? new Date(existing.dob) : null);
  const [className, setClassName] = useState<string | null>(existing?.class_name ?? null);
  const [board, setBoard] = useState<string | null>(existing?.board ?? null);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [draftDob, setDraftDob] = useState<Date>(() => dob ?? defaultStudentDob());
  const [errors, setErrors] = useState<Errors>({});
  const [failure, setFailure] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const middleRef = useRef<TextInputInstance>(null);
  const lastRef = useRef<TextInputInstance>(null);

  const title = editingId ? 'Edit student profile' : 'Add student profile';
  const today = useMemo(() => new Date(), []);

  const submit = async () => {
    const e: Errors = {};
    const other = relationOther.trim();
    if (!relation) e.relation = 'Choose who is creating this profile.';
    else if (relation === 'other' && (other.length < OTHER_RELATION_MIN || other.length > OTHER_RELATION_MAX)) {
      e.relationOther = `Describe the relation in ${OTHER_RELATION_MIN}–${OTHER_RELATION_MAX} characters.`;
    }
    if (!firstName.trim()) e.firstName = 'Enter a first name.';
    if (!lastName.trim()) e.lastName = 'Enter a last name.';
    if (!dob) e.dob = 'Choose a date of birth.';
    setErrors(e);
    setFailure(null);
    if (Object.keys(e).length) return;

    try {
      await save.mutateAsync({
        id: editingId,
        input: {
          relation: relation!,
          relation_other: relation === 'other' ? relationOther.trim() : null,
          first_name: firstName.trim(),
          middle_name: middleName.trim(),
          last_name: lastName.trim(),
          gender,
          dob: toISODate(dob!),
          class_name: className,
          board,
        },
      });
      toast.toast(editingId ? 'Student profile updated' : `${firstName.trim()}'s profile added`, 'success');
      navigation.goBack();
    } catch (err) {
      setFailure(describeProfileError(err));
    }
  };

  const doDelete = async () => {
    if (!editingId) return;
    try {
      await remove.mutateAsync(editingId);
      toast.toast('Student profile removed', 'info');
      navigation.goBack();
    } catch (err) {
      setFailure(describeProfileError(err));
      setConfirmDelete(false);
    }
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: colors.bgApp }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      {/* ── Top bar ─────────────────────────────────────────────────────── */}
      <Row gap={spacing.md} style={{ paddingTop: insets.top + spacing.sm, paddingHorizontal: spacing.lg, paddingBottom: spacing.sm }}>
        <Pressable
          onPress={() => navigation.goBack()}
          hitSlop={10}
          accessibilityRole="button"
          accessibilityLabel="Go back"
          style={({ pressed }) => [styles.iconBtn, { backgroundColor: colors.surface, borderColor: colors.border, opacity: pressed ? 0.6 : 1 }]}
        >
          <Ionicons name="arrow-back" size={19} color={colors.textMain} />
        </Pressable>
        <AppText variant="title" style={{ flex: 1 }} numberOfLines={1}>
          {title}
        </AppText>
      </Row>

      <ScrollView contentContainerStyle={{ padding: spacing.lg, paddingBottom: spacing.xxxl }} keyboardShouldPersistTaps="handled">
        <ErrorBanner message={failure} />

        {/* Created by — the account owner's relation to this student */}
        <AppText variant="overline" tone={errors.relation ? 'error' : 'muted'} style={{ marginBottom: spacing.sm }}>
          CREATED BY
        </AppText>
        <Pressable
          onPress={() => setRelationOpen(true)}
          accessibilityRole="button"
          accessibilityLabel="Choose who is creating this profile"
          style={({ pressed }) => ({
            flexDirection: 'row',
            alignItems: 'center',
            gap: spacing.md,
            padding: spacing.md,
            borderRadius: radius.md,
            borderWidth: errors.relation ? 1.5 : StyleSheet.hairlineWidth,
            borderColor: errors.relation ? colors.error : colors.border,
            backgroundColor: colors.surfaceMuted,
            opacity: pressed ? 0.8 : 1,
          })}
        >
          <Ionicons name="people-outline" size={18} color={relation ? colors.primary : colors.textMuted} />
          <AppText variant="bodyStrong" style={{ flex: 1, color: relation ? colors.textMain : colors.textMuted }}>
            {relation ? RELATIONS.find((r) => r.value === relation)?.label : 'Select — Self, Father, Mother…'}
          </AppText>
          <Ionicons name="chevron-down" size={17} color={colors.textMuted} />
        </Pressable>
        {errors.relation ? (
          <AppText variant="caption" tone="error" style={{ marginTop: 6 }}>
            {errors.relation}
          </AppText>
        ) : null}
        {relation === 'other' ? (
          <View style={{ marginTop: spacing.md }}>
            <AuthField
              label={`Relation (${relationOther.trim().length}/${OTHER_RELATION_MAX})`}
              icon="create-outline"
              placeholder="e.g. Uncle, Guardian, Coach"
              maxLength={OTHER_RELATION_MAX}
              autoCapitalize="words"
              value={relationOther}
              onChangeText={(t) => {
                setRelationOther(t);
                if (errors.relationOther) setErrors((e) => ({ ...e, relationOther: undefined }));
              }}
              error={errors.relationOther}
            />
          </View>
        ) : null}
        <View style={{ height: spacing.xl }} />

        {/* Name */}
        <AuthField
          label="First name"
          icon="person-outline"
          placeholder="Aryan"
          autoCapitalize="words"
          returnKeyType="next"
          value={firstName}
          onChangeText={(t) => {
            setFirstName(t);
            if (errors.firstName) setErrors((e) => ({ ...e, firstName: undefined }));
          }}
          onSubmitEditing={() => middleRef.current?.focus()}
          error={errors.firstName}
        />
        <AuthField
          ref={middleRef}
          label="Middle name"
          optional
          placeholder="—"
          autoCapitalize="words"
          returnKeyType="next"
          value={middleName}
          onChangeText={setMiddleName}
          onSubmitEditing={() => lastRef.current?.focus()}
        />
        <AuthField
          ref={lastRef}
          label="Last name"
          placeholder="Mehta"
          autoCapitalize="words"
          value={lastName}
          onChangeText={(t) => {
            setLastName(t);
            if (errors.lastName) setErrors((e) => ({ ...e, lastName: undefined }));
          }}
          error={errors.lastName}
        />

        {/* Gender */}
        <AppText variant="overline" tone="muted" style={{ marginBottom: spacing.sm }}>
          GENDER
        </AppText>
        <Row gap={spacing.sm} wrap style={{ marginBottom: spacing.xl }}>
          {GENDERS.map((g) => (
            <Chip key={g.value} label={g.label} selected={gender === g.value} onPress={() => setGender(gender === g.value ? null : g.value)} />
          ))}
        </Row>

        {/* Date of birth */}
        <AppText variant="overline" tone={errors.dob ? 'error' : 'muted'} style={{ marginBottom: spacing.sm }}>
          DATE OF BIRTH
        </AppText>
        <Pressable
          onPress={() => {
            setDraftDob(dob ?? defaultStudentDob());
            setPickerOpen(true);
          }}
          accessibilityRole="button"
          style={({ pressed }) => ({
            flexDirection: 'row',
            alignItems: 'center',
            gap: spacing.md,
            padding: spacing.md,
            borderRadius: radius.md,
            borderWidth: errors.dob ? 1.5 : StyleSheet.hairlineWidth,
            borderColor: errors.dob ? colors.error : colors.border,
            backgroundColor: colors.surfaceMuted,
            opacity: pressed ? 0.8 : 1,
          })}
        >
          <Ionicons name="calendar-outline" size={18} color={dob ? colors.primary : colors.textMuted} />
          <AppText variant="bodyStrong" style={{ flex: 1, color: dob ? colors.textMain : colors.textMuted }}>
            {dob ? formatDateLong(toISODate(dob)) : 'Tap to choose'}
          </AppText>
          <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
        </Pressable>
        {errors.dob ? (
          <AppText variant="caption" tone="error" style={{ marginTop: 6 }}>
            {errors.dob}
          </AppText>
        ) : null}

        {/* Class */}
        <AppText variant="overline" tone="muted" style={{ marginTop: spacing.xl, marginBottom: spacing.sm }}>
          CLASS
        </AppText>
        <Row gap={spacing.sm} wrap>
          {CLASSES.map((c) => (
            <Chip key={c} label={c} selected={className === c} onPress={() => setClassName(className === c ? null : c)} />
          ))}
        </Row>

        {/* Board */}
        <AppText variant="overline" tone="muted" style={{ marginTop: spacing.xl, marginBottom: spacing.sm }}>
          BOARD
        </AppText>
        <Row gap={spacing.sm} wrap>
          {BOARDS.map((b) => (
            <Chip key={b} label={b} selected={board === b} onPress={() => setBoard(board === b ? null : b)} />
          ))}
        </Row>

        <Button
          label={editingId ? 'Save changes' : 'Add student profile'}
          iconName={editingId ? 'checkmark-circle-outline' : 'person-add-outline'}
          size="lg"
          fullWidth
          loading={save.isPending}
          onPress={submit}
          style={{ marginTop: spacing.xxl }}
        />

        {editingId && canRemove ? (
          confirmDelete ? (
            <View style={{ marginTop: spacing.lg, padding: spacing.lg, borderRadius: radius.lg, backgroundColor: colors.errorBg }}>
              <AppText variant="subheading" style={{ color: colors.errorText }}>
                Remove {existing?.first_name || 'this'}'s profile?
              </AppText>
              <AppText variant="caption" style={{ color: colors.errorText, marginTop: 2 }}>
                This removes the profile from your account and takes them out of their batches. It can't be undone.
              </AppText>
              <Row gap={spacing.sm} style={{ marginTop: spacing.md }}>
                <Button label="Cancel" variant="secondary" size="sm" onPress={() => setConfirmDelete(false)} />
                <Button label="Remove" variant="danger" size="sm" iconName="trash-outline" loading={remove.isPending} onPress={doDelete} />
              </Row>
            </View>
          ) : (
            <Button
              label="Remove this profile"
              variant="ghost"
              iconName="trash-outline"
              fullWidth
              onPress={() => setConfirmDelete(true)}
              style={{ marginTop: spacing.md }}
            />
          )
        ) : null}
      </ScrollView>

      <Sheet visible={relationOpen} onClose={() => setRelationOpen(false)} title="Created by" subtitle="Your relation to this student">
        <View style={{ gap: spacing.xs, paddingBottom: spacing.md }}>
          {RELATIONS.map((r) => {
            const disabled = r.value === 'self' && selfTaken;
            const active = relation === r.value;
            return (
              <Pressable
                key={r.value}
                disabled={disabled}
                onPress={() => {
                  setRelation(r.value);
                  setErrors((e) => ({ ...e, relation: undefined, relationOther: undefined }));
                  setRelationOpen(false);
                }}
                accessibilityRole="radio"
                accessibilityState={{ checked: active, disabled }}
                style={({ pressed }) => ({
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: spacing.md,
                  paddingVertical: 14,
                  paddingHorizontal: spacing.md,
                  borderRadius: radius.md,
                  backgroundColor: active ? colors.primarySubtle : pressed ? colors.surfaceMuted : 'transparent',
                  opacity: disabled ? 0.45 : 1,
                })}
              >
                <AppText variant="bodyStrong" style={{ flex: 1, color: active ? colors.primary : colors.textMain }}>
                  {r.label}
                </AppText>
                {disabled ? (
                  <AppText variant="caption" tone="muted">
                    Already added
                  </AppText>
                ) : active ? (
                  <Ionicons name="checkmark-circle" size={20} color={colors.primary} />
                ) : null}
              </Pressable>
            );
          })}
        </View>
      </Sheet>

      {/* Date picker: Android system dialog, iOS spinner in a sheet */}
      {pickerOpen && Platform.OS === 'android' ? (
        <DateTimePicker
          value={draftDob}
          mode="date"
          maximumDate={today}
          onValueChange={(_, date) => {
            setPickerOpen(false);
            setDob(date);
            setErrors((e) => ({ ...e, dob: undefined }));
          }}
          onDismiss={() => setPickerOpen(false)}
        />
      ) : null}
      {Platform.OS === 'ios' ? (
        <Sheet visible={pickerOpen} onClose={() => setPickerOpen(false)} title="Date of birth" scroll={false}>
          <DateTimePicker
            value={draftDob}
            mode="date"
            display="spinner"
            maximumDate={today}
            themeVariant={isDark ? 'dark' : 'light'}
            onValueChange={(_, d) => setDraftDob(d)}
          />
          <Button
            label="Done"
            fullWidth
            onPress={() => {
              setDob(draftDob);
              setErrors((e) => ({ ...e, dob: undefined }));
              setPickerOpen(false);
            }}
            style={{ marginTop: spacing.md }}
          />
        </Sheet>
      ) : null}
    </KeyboardAvoidingView>
  );
}

/** Opens the picker around a typical school-age birth year. */
function defaultStudentDob(): Date {
  return new Date(new Date().getFullYear() - 12, 0, 1);
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
