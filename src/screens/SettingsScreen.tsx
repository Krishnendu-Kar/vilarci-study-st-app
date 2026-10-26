import React, { useEffect, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useTheme } from '../theme/ThemeProvider';
import { fonts, radius, spacing } from '../theme/tokens';
import { Language, ThemeMode, useAppStore } from '../lib/store/useAppStore';
import { useStudentContext } from '../lib/api/hooks';
import {
  AppText,
  Avatar,
  Card,
  CenterMark,
  Divider,
  KeyValue,
  ListRow,
  Pill,
  Row,
  SectionHeader,
  VerifiedTick,
} from '../components/ui/base';
import { Button } from '../components/ui/Button';
import { Screen } from '../components/ui/Screen';
import { Sheet } from '../components/ui/Sheet';
import { useToast } from '../components/ui/Toast';
import { Field } from '../components/ContextHeader';
import { ScreenTitle } from '../components/ScreenTitle';
import { formatDate, rupees } from '../lib/utils/format';

type ContactKey = 'father' | 'mother' | 'guardian';

const CONTACTS: { key: ContactKey; label: string }[] = [
  { key: 'father', label: 'Father' },
  { key: 'mother', label: 'Mother' },
  { key: 'guardian', label: 'Guardian' },
];

const THEME_OPTIONS: { value: ThemeMode; label: string; icon: React.ComponentProps<typeof Ionicons>['name'] }[] = [
  { value: 'light', label: 'Light', icon: 'sunny-outline' },
  { value: 'dark', label: 'Dark', icon: 'moon-outline' },
  { value: 'system', label: 'System', icon: 'phone-portrait-outline' },
];

const LANGUAGE_OPTIONS: { value: Language; label: string; native: string }[] = [
  { value: 'en', label: 'English', native: 'English' },
  { value: 'bn', label: 'Bengali', native: 'বাংলা' },
];

/**
 * Profile, guardian contacts, faculty enrolment and app preferences for the
 * profile currently in focus.
 */
export function SettingsScreen() {
  const { colors, mode, setMode } = useTheme();
  const toast = useToast();
  const ctx = useStudentContext();
  const student = ctx.student;

  const language = useAppStore((s) => s.language);
  const setLanguage = useAppStore((s) => s.setLanguage);
  const joinCenterByCode = useAppStore((s) => s.joinCenterByCode);
  const resetDemoProgress = useAppStore((s) => s.resetDemoProgress);

  const [editing, setEditing] = useState<ContactKey | null>(null);
  const [joinOpen, setJoinOpen] = useState(false);
  const [joinCode, setJoinCode] = useState('');
  const [joinError, setJoinError] = useState<string | null>(null);
  const [confirmReset, setConfirmReset] = useState(false);

  const submitJoin = () => {
    const result = joinCenterByCode(student.id, joinCode);
    if (!result.ok) {
      setJoinError(result.message);
      return;
    }
    toast.toast(result.message, 'success');
    setJoinOpen(false);
    setJoinCode('');
    setJoinError(null);
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.bgApp }}>
      <Screen topInset>
        <ScreenTitle title="Settings" subtitle={`Managing ${student.name}'s profile`} />

        {/* ── Profile ─────────────────────────────────────────────────────── */}
        <Card style={{ marginTop: spacing.lg }} level={2}>
          <Row gap={spacing.md}>
            <Avatar initials={student.photo_initials} gradient={student.avatar_gradient} size={56} ring />
            <View style={{ flex: 1 }}>
              <AppText variant="heading">{student.name}</AppText>
              <AppText variant="caption" tone="muted">
                {student.class} · {student.board}
              </AppText>
            </View>
          </Row>
          <Divider style={{ marginVertical: spacing.md }} />
          <KeyValue label="Roll number" value={student.roll} />
          <KeyValue label="Date of birth" value={formatDate(student.dob)} />
          <KeyValue
            label="Student phone"
            value={student.phone || '—'}
            icon={student.phone ? <VerifiedTick verified={student.phone_verified} /> : undefined}
          />
        </Card>

        {/* ── Guardian contacts ───────────────────────────────────────────── */}
        <View style={{ marginTop: spacing.xxl }}>
          <SectionHeader title="Guardian contacts" subtitle="Used for emergencies and fee reminders" />
          <Card padded={false}>
            {CONTACTS.map((c, i) => {
              const name = student[`${c.key}_name`];
              const phone = student[`${c.key}_phone`];
              const verified = student[`${c.key}_phone_verified`];
              return (
                <View key={c.key} style={{ paddingHorizontal: spacing.lg }}>
                  {i > 0 ? <Divider /> : null}
                  <ListRow
                    title={c.label}
                    subtitle={name ? `${name} · ${phone || 'no number'}` : 'Not added yet'}
                    iconName={c.key === 'guardian' ? 'shield-outline' : 'person-outline'}
                    onPress={() => setEditing(c.key)}
                    right={
                      <Row gap={spacing.sm}>
                        {name ? <VerifiedTick verified={verified} /> : <Pill label="Add" tone="primary" />}
                        <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
                      </Row>
                    }
                  />
                </View>
              );
            })}
          </Card>
        </View>

        {/* ── Faculties ───────────────────────────────────────────────────── */}
        <View style={{ marginTop: spacing.xxl }}>
          <SectionHeader
            title="Enrolled faculties"
            subtitle={`${ctx.enrolledCenters.length} coaching centre${ctx.enrolledCenters.length === 1 ? '' : 's'}`}
            action="Join"
            onAction={() => setJoinOpen(true)}
          />
          <Card padded={false}>
            {ctx.enrolledCenters.length ? (
              ctx.enrolledCenters.map((c, i) => (
                <View key={c.id} style={{ paddingHorizontal: spacing.lg }}>
                  {i > 0 ? <Divider /> : null}
                  <Row gap={spacing.md} style={{ paddingVertical: spacing.md }}>
                    <CenterMark text={c.logo_text} color={c.color} size={38} />
                    <View style={{ flex: 1 }}>
                      <AppText variant="subheading" numberOfLines={1}>
                        {c.name}
                      </AppText>
                      <AppText variant="caption" tone="muted" numberOfLines={1}>
                        {c.teacher_name} · {rupees(c.monthly_fee)}/mo
                      </AppText>
                    </View>
                    <Pill label={c.code} tone="neutral" />
                  </Row>
                </View>
              ))
            ) : (
              <View style={{ padding: spacing.lg }}>
                <AppText variant="caption" tone="muted">
                  Not enrolled anywhere yet. Ask your teacher for their 6-character coaching code.
                </AppText>
              </View>
            )}
          </Card>
        </View>

        {/* ── Appearance ──────────────────────────────────────────────────── */}
        <View style={{ marginTop: spacing.xxl }}>
          <SectionHeader title="Appearance" />
          <Segmented
            options={THEME_OPTIONS.map((o) => ({ value: o.value, label: o.label, icon: o.icon }))}
            value={mode}
            onChange={(v) => setMode(v as ThemeMode)}
          />
        </View>

        <View style={{ marginTop: spacing.xl }}>
          <SectionHeader title="Language" subtitle="Interface translations are rolling out gradually" />
          <Segmented
            options={LANGUAGE_OPTIONS.map((o) => ({ value: o.value, label: o.native }))}
            value={language}
            onChange={(v) => setLanguage(v as Language)}
          />
        </View>

        {/* ── Data ────────────────────────────────────────────────────────── */}
        <View style={{ marginTop: spacing.xxl }}>
          <SectionHeader title="Demo data" />
          <Card>
            {confirmReset ? (
              <View>
                <AppText variant="subheading">Reset all local progress?</AppText>
                <AppText variant="caption" tone="muted" style={{ marginTop: 2 }}>
                  Clears earned points, check-ins, revisions, joined centres, contact edits and added profiles
                  on this device.
                </AppText>
                <Row gap={spacing.sm} style={{ marginTop: spacing.md }}>
                  <Button label="Cancel" variant="secondary" size="sm" onPress={() => setConfirmReset(false)} />
                  <Button
                    label="Reset everything"
                    variant="danger"
                    size="sm"
                    iconName="refresh"
                    onPress={() => {
                      resetDemoProgress();
                      setConfirmReset(false);
                      toast.toast('Demo progress reset', 'info');
                    }}
                  />
                </Row>
              </View>
            ) : (
              <ListRow
                title="Reset demo progress"
                subtitle="Start fresh with the original sample data"
                iconName="refresh-outline"
                tint={colors.error}
                onPress={() => setConfirmReset(true)}
              />
            )}
          </Card>
        </View>

        <AppText variant="caption" tone="muted" center style={{ marginTop: spacing.xxl }}>
          Vilarci Study · v1.0.0
        </AppText>
      </Screen>

      <ContactSheet contact={editing} onClose={() => setEditing(null)} />

      <Sheet
        visible={joinOpen}
        onClose={() => {
          setJoinOpen(false);
          setJoinError(null);
        }}
        title="Join a coaching centre"
        subtitle="Enter the 6-character code your teacher shared"
      >
        <Field
          placeholder="ABC123"
          value={joinCode}
          onChangeText={(t) => {
            setJoinCode(t.toUpperCase());
            setJoinError(null);
          }}
          autoCapitalize="characters"
          autoCorrect={false}
          maxLength={6}
          style={{ fontFamily: fonts.sansSemibold, fontSize: 20, letterSpacing: 6, textAlign: 'center' }}
        />
        {joinError ? (
          <AppText variant="caption" tone="error" style={{ marginTop: spacing.sm }}>
            {joinError}
          </AppText>
        ) : null}
        <Button
          label="Join centre"
          iconName="enter-outline"
          fullWidth
          disabled={joinCode.trim().length < 6}
          onPress={submitJoin}
          style={{ marginTop: spacing.lg }}
        />
      </Sheet>
    </View>
  );
}

// ─── Contact editor ───────────────────────────────────────────────────────────

function ContactSheet({ contact, onClose }: { contact: ContactKey | null; onClose: () => void }) {
  const toast = useToast();
  const { student } = useStudentContext();
  const updateContacts = useAppStore((s) => s.updateContacts);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');

  useEffect(() => {
    if (!contact) return;
    setName(student[`${contact}_name`] ?? '');
    setPhone(student[`${contact}_phone`] ?? '');
  }, [contact, student]);

  const label = CONTACTS.find((c) => c.key === contact)?.label ?? '';
  const digits = phone.replace(/\D/g, '');
  const valid = name.trim().length > 1 && digits.length >= 10;

  const save = () => {
    if (!contact) return;
    const original = student[`${contact}_phone`];
    updateContacts(student.id, {
      [`${contact}_name`]: name.trim(),
      [`${contact}_phone`]: phone.trim(),
      // A changed number has to be re-verified by OTP before teachers rely on it.
      [`${contact}_phone_verified`]: original === phone.trim() ? student[`${contact}_phone_verified`] : false,
    } as Partial<typeof student>);
    toast.toast(`${label} contact saved`, 'success');
    onClose();
  };

  return (
    <Sheet visible={contact !== null} onClose={onClose} title={`${label} contact`} subtitle={student.name}>
      <AppText variant="overline" tone="muted">
        FULL NAME
      </AppText>
      <Field value={name} onChangeText={setName} placeholder="Full name" style={{ marginTop: spacing.sm }} />
      <AppText variant="overline" tone="muted" style={{ marginTop: spacing.lg }}>
        MOBILE NUMBER
      </AppText>
      <Field
        value={phone}
        onChangeText={setPhone}
        placeholder="+91 98765 43210"
        keyboardType="phone-pad"
        style={{ marginTop: spacing.sm }}
      />
      <AppText variant="caption" tone="muted" style={{ marginTop: spacing.sm }}>
        Changing the number marks it unverified until the OTP check is completed.
      </AppText>
      <Button label="Save contact" fullWidth disabled={!valid} onPress={save} style={{ marginTop: spacing.lg }} />
    </Sheet>
  );
}

// ─── Segmented control ────────────────────────────────────────────────────────

function Segmented({
  options,
  value,
  onChange,
}: {
  options: { value: string; label: string; icon?: React.ComponentProps<typeof Ionicons>['name'] }[];
  value: string;
  onChange: (value: string) => void;
}) {
  const { colors } = useTheme();
  return (
    <View
      style={{
        flexDirection: 'row',
        padding: 4,
        gap: 4,
        borderRadius: radius.md,
        backgroundColor: colors.surfaceMuted,
        borderWidth: StyleSheet.hairlineWidth,
        borderColor: colors.border,
      }}
    >
      {options.map((o) => {
        const active = o.value === value;
        return (
          <Pressable
            key={o.value}
            onPress={() => onChange(o.value)}
            accessibilityRole="button"
            accessibilityState={{ selected: active }}
            style={({ pressed }) => [
              {
                flex: 1,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 6,
                paddingVertical: 10,
                borderRadius: radius.sm,
                backgroundColor: active ? colors.surface : 'transparent',
                borderWidth: active ? StyleSheet.hairlineWidth : 0,
                borderColor: colors.border,
                opacity: pressed ? 0.7 : 1,
              },
            ]}
          >
            {o.icon ? <Ionicons name={o.icon} size={15} color={active ? colors.primary : colors.textMuted} /> : null}
            <AppText variant="captionStrong" style={{ color: active ? colors.primary : colors.textSecondary }}>
              {o.label}
            </AppText>
          </Pressable>
        );
      })}
    </View>
  );
}
