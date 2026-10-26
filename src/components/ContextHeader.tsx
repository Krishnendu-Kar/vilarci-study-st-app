import React, { useState } from 'react';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useTheme } from '../theme/ThemeProvider';
import { elevation, fonts, radius, spacing } from '../theme/tokens';
import { ALL_CENTERS, useAppStore } from '../lib/store/useAppStore';
import { useAllCenters, useStudentContext, useStudents } from '../lib/api/hooks';
import { household } from '../lib/data';
import { AppText, Avatar, CenterMark, Divider, Pill, Row } from './ui/base';
import { Button } from './ui/Button';
import { Sheet } from './ui/Sheet';
import { useToast } from './ui/Toast';

/**
 * Slim app bar: who is studying, which faculty is in focus. Both are tappable
 * and re-filter every screen. Deliberately compact so screen content leads.
 */
export function ContextHeader({ title }: { title?: string }) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const ctx = useStudentContext();
  const [profileOpen, setProfileOpen] = useState(false);
  const [centerOpen, setCenterOpen] = useState(false);

  const centerLabel = ctx.isAllCenters ? 'All centres' : ctx.activeCenter?.name ?? 'All centres';

  return (
    <View
      style={{
        backgroundColor: colors.bgApp,
        paddingTop: insets.top + spacing.sm,
        paddingHorizontal: spacing.lg,
        paddingBottom: spacing.sm,
      }}
    >
      <Row justify="space-between" gap={spacing.md}>
        <Pressable
          onPress={() => setProfileOpen(true)}
          accessibilityRole="button"
          accessibilityLabel="Switch student profile"
          style={({ pressed }) => [
            { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, flex: 1, opacity: pressed ? 0.7 : 1 },
          ]}
        >
          <Avatar initials={ctx.student.photo_initials} gradient={ctx.student.avatar_gradient} size={40} ring />
          <View style={{ flex: 1 }}>
            <AppText variant="overline" tone="muted">
              {(title ?? ctx.student.class).toUpperCase()}
            </AppText>
            <Row gap={3}>
              <AppText variant="subheading" numberOfLines={1}>
                {ctx.student.name}
              </AppText>
              <Ionicons name="chevron-down" size={13} color={colors.textMuted} />
            </Row>
          </View>
        </Pressable>

        {/* Faculty focus selector */}
        <Pressable
          onPress={() => setCenterOpen(true)}
          accessibilityRole="button"
          accessibilityLabel="Switch coaching centre"
          style={({ pressed }) => [
            {
              flexDirection: 'row',
              alignItems: 'center',
              gap: 6,
              paddingHorizontal: spacing.md,
              paddingVertical: 8,
              borderRadius: radius.pill,
              backgroundColor: colors.surface,
              borderWidth: StyleSheet.hairlineWidth,
              borderColor: colors.border,
              maxWidth: 160,
              opacity: pressed ? 0.7 : 1,
              ...elevation(1, colors.shadowColor, colors.shadowOpacity),
            },
          ]}
        >
          <View
            style={{
              width: 7,
              height: 7,
              borderRadius: 4,
              backgroundColor: ctx.isAllCenters ? colors.gold : ctx.activeCenter?.color ?? colors.primary,
            }}
          />
          <AppText variant="captionStrong" numberOfLines={1} style={{ flexShrink: 1 }}>
            {centerLabel}
          </AppText>
          <Ionicons name="swap-horizontal" size={13} color={colors.textMuted} />
        </Pressable>
      </Row>

      <ProfileSheet visible={profileOpen} onClose={() => setProfileOpen(false)} />
      <CenterSheet visible={centerOpen} onClose={() => setCenterOpen(false)} />
    </View>
  );
}

// ─── Household profile switcher ───────────────────────────────────────────────

function ProfileSheet({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const { colors } = useTheme();
  const students = useStudents();
  const currentStudentId = useAppStore((s) => s.currentStudentId);
  const setCurrentStudent = useAppStore((s) => s.setCurrentStudent);
  const addStudentProfile = useAppStore((s) => s.addStudentProfile);
  const bonusPointsFor = useAppStore((s) => s.bonusPointsFor);
  const { toast } = useToast();

  const [adding, setAdding] = useState(false);
  const [name, setName] = useState('');
  const [klass, setKlass] = useState('');
  const [board, setBoard] = useState('CBSE');

  const atCap = students.length >= household.max_profiles;

  const submit = () => {
    if (!name.trim() || !klass.trim()) {
      toast('Enter the student name and class.', 'warning');
      return;
    }
    const initials = name
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((p) => p[0].toUpperCase())
      .join('');
    const id = addStudentProfile({
      name: name.trim(),
      roll: `SA-${100 + students.length + 1}`,
      class: klass.trim(),
      board: board.trim() || 'CBSE',
      dob: '',
      phone: '',
      phone_verified: false,
      father_name: 'Rajesh Mehta',
      father_phone: '+91 98111 22334',
      father_phone_verified: true,
      mother_name: 'Sunita Mehta',
      mother_phone: '+91 98765 11223',
      mother_phone_verified: true,
      guardian_name: '',
      guardian_phone: '',
      guardian_phone_verified: false,
      photo_initials: initials || 'ST',
      avatar_gradient: ['#45101F', '#B8902F'],
      enrolled_centers: [],
      points: 0,
      streak: 0,
    });
    setCurrentStudent(id);
    setName('');
    setKlass('');
    setAdding(false);
    onClose();
    toast(`Profile added for ${name.trim()}. Join a faculty with its 6-character code.`, 'success');
  };

  return (
    <Sheet
      visible={visible}
      onClose={onClose}
      title={household.name}
      subtitle={`${students.length} of ${household.max_profiles} profiles · ${household.primary_contact}`}
    >
      <View style={{ gap: spacing.sm }}>
        {students.map((s) => {
          const active = s.id === currentStudentId;
          return (
            <Pressable
              key={s.id}
              onPress={() => {
                setCurrentStudent(s.id);
                onClose();
              }}
              style={({ pressed }) => [
                {
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: spacing.md,
                  padding: spacing.lg,
                  borderRadius: radius.lg,
                  borderWidth: StyleSheet.hairlineWidth,
                  borderColor: active ? colors.primary : colors.border,
                  backgroundColor: active ? colors.primarySubtle : colors.surface,
                  opacity: pressed ? 0.85 : 1,
                },
              ]}
            >
              <Avatar initials={s.photo_initials} gradient={s.avatar_gradient} size={44} ring={active} />
              <View style={{ flex: 1 }}>
                <AppText variant="subheading">{s.name}</AppText>
                <AppText variant="caption" tone="muted">
                  {s.class} · {s.board} · {s.enrolled_centers.length} faculty
                  {s.enrolled_centers.length === 1 ? '' : 'ies'}
                </AppText>
              </View>
              <View style={{ alignItems: 'flex-end' }}>
                <AppText variant="metricSm" tone="primary">
                  {(s.points + bonusPointsFor(s.id)).toLocaleString('en-IN')}
                </AppText>
                <AppText variant="overline" tone="muted">
                  POINTS
                </AppText>
              </View>
            </Pressable>
          );
        })}
      </View>

      <Divider style={{ marginVertical: spacing.lg }} />

      {adding ? (
        <View style={{ gap: spacing.sm }}>
          <AppText variant="subheading">New sibling profile</AppText>
          <Field placeholder="Full name" value={name} onChangeText={setName} />
          <Field placeholder="Class (e.g. Class 9)" value={klass} onChangeText={setKlass} />
          <Field placeholder="Board (CBSE / ICSE / State)" value={board} onChangeText={setBoard} />
          <Row gap={spacing.sm}>
            <Button label="Add profile" onPress={submit} style={{ flex: 1 }} />
            <Button label="Cancel" variant="secondary" onPress={() => setAdding(false)} />
          </Row>
        </View>
      ) : (
        <Button
          label={atCap ? `Limit of ${household.max_profiles} profiles reached` : 'Add a sibling profile'}
          iconName="person-add-outline"
          variant="secondary"
          fullWidth
          disabled={atCap}
          onPress={() => setAdding(true)}
        />
      )}
    </Sheet>
  );
}

// ─── Faculty switcher + join by code ─────────────────────────────────────────

function CenterSheet({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const { colors } = useTheme();
  const ctx = useStudentContext();
  const allCenters = useAllCenters();
  const currentCenterId = useAppStore((s) => s.currentCenterId);
  const setCurrentCenter = useAppStore((s) => s.setCurrentCenter);
  const joinCenterByCode = useAppStore((s) => s.joinCenterByCode);
  const { toast } = useToast();
  const [code, setCode] = useState('');

  const join = () => {
    const result = joinCenterByCode(ctx.student.id, code);
    toast(result.message, result.ok ? 'success' : 'warning');
    if (result.ok) setCode('');
  };

  const available = allCenters.filter((c) => !ctx.student.enrolled_centers.includes(c.id));
  const allActive = currentCenterId === ALL_CENTERS;

  return (
    <Sheet
      visible={visible}
      onClose={onClose}
      title="Faculty in focus"
      subtitle={`${ctx.student.name} · ${ctx.enrolledCenters.length} enrolled`}
    >
      <Pressable
        onPress={() => {
          setCurrentCenter(ALL_CENTERS);
          onClose();
        }}
        style={({ pressed }) => [
          {
            padding: spacing.lg,
            borderRadius: radius.lg,
            borderWidth: StyleSheet.hairlineWidth,
            borderColor: allActive ? colors.gold : colors.border,
            backgroundColor: allActive ? colors.goldSubtle : colors.surface,
            marginBottom: spacing.sm,
            opacity: pressed ? 0.85 : 1,
          },
        ]}
      >
        <Row gap={spacing.md}>
          <Ionicons name="layers-outline" size={22} color={colors.gold} />
          <View style={{ flex: 1 }}>
            <AppText variant="subheading">Everything combined</AppText>
            <AppText variant="caption" tone="muted">
              Fees, attendance, syllabus and marks across every faculty at once.
            </AppText>
          </View>
        </Row>
      </Pressable>

      <View style={{ gap: spacing.sm }}>
        {ctx.enrolledCenters.map((c) => {
          const active = c.id === currentCenterId;
          return (
            <Pressable
              key={c.id}
              onPress={() => {
                setCurrentCenter(c.id);
                onClose();
              }}
              style={({ pressed }) => [
                {
                  flexDirection: 'row',
                  gap: spacing.md,
                  padding: spacing.lg,
                  borderRadius: radius.lg,
                  borderWidth: StyleSheet.hairlineWidth,
                  borderColor: active ? c.color : colors.border,
                  backgroundColor: active ? `${c.color}0F` : colors.surface,
                  opacity: pressed ? 0.85 : 1,
                },
              ]}
            >
              <CenterMark text={c.logo_text} color={c.color} />
              <View style={{ flex: 1 }}>
                <AppText variant="subheading" numberOfLines={1}>
                  {c.name}
                </AppText>
                <AppText variant="caption" tone="muted" numberOfLines={1}>
                  {c.teacher_name}
                </AppText>
                <Row gap={5} wrap style={{ marginTop: 7 }}>
                  {c.subjects.map((s) => (
                    <Pill key={s} label={s} tone="neutral" />
                  ))}
                  <Pill label={c.code} tone="gold" />
                </Row>
              </View>
            </Pressable>
          );
        })}
      </View>

      <Divider style={{ marginVertical: spacing.lg }} />

      <AppText variant="subheading">Join a faculty</AppText>
      <AppText variant="caption" tone="muted" style={{ marginTop: 2 }}>
        Enter the 6-character invite code from your teacher.
      </AppText>
      <Row gap={spacing.sm} style={{ marginTop: spacing.md }}>
        <Field
          placeholder="e.g. HORIZ5"
          value={code}
          onChangeText={(t: string) => setCode(t.toUpperCase())}
          style={{ flex: 1, letterSpacing: 2, fontFamily: fonts.sansSemibold }}
          autoCapitalize="characters"
          maxLength={8}
        />
        <Button label="Join" onPress={join} />
      </Row>

      {available.length ? (
        <View style={{ marginTop: spacing.md }}>
          <AppText variant="overline" tone="muted">
            AVAILABLE IN THIS DEMO
          </AppText>
          <Row gap={6} wrap style={{ marginTop: 7 }}>
            {available.map((c) => (
              <Pressable key={c.id} onPress={() => setCode(c.code)}>
                <Pill label={`${c.name} · ${c.code}`} tone="info" />
              </Pressable>
            ))}
          </Row>
        </View>
      ) : null}
    </Sheet>
  );
}

// ─── Shared input ─────────────────────────────────────────────────────────────

export function Field({ style, ...props }: React.ComponentProps<typeof TextInput>) {
  const { colors } = useTheme();
  return (
    <TextInput
      placeholderTextColor={colors.textMuted}
      style={[
        {
          backgroundColor: colors.surfaceMuted,
          borderWidth: StyleSheet.hairlineWidth,
          borderColor: colors.border,
          borderRadius: radius.md,
          paddingHorizontal: spacing.lg,
          paddingVertical: 14,
          color: colors.textMain,
          fontSize: 14.5,
          fontFamily: fonts.sans,
        },
        style,
      ]}
      {...props}
    />
  );
}
