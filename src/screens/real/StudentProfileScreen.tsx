import React from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, View } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useTheme } from '../../theme/ThemeProvider';
import { spacing } from '../../theme/tokens';
import { toISODate } from '../../lib/auth';
import { ageFrom, fullName, initialsOf, relationLabel, useStudentProfiles } from '../../lib/api/studentProfiles';
import { STATUS_LABEL, useMemberships } from '../../lib/api/batches';
import { useActiveStudent } from '../../lib/store/useActiveStudent';
import { gradientFor } from '../../lib/utils/profileColors';
import { formatDateLong } from '../../lib/utils/format';
import { navigateToTab } from '../../navigation/realNavigationRef';
import { AppText, Avatar, Card, Divider, EmptyState, HeroCard, KeyValue, Pill, Row, SectionHeader } from '../../components/ui/base';
import { Button } from '../../components/ui/Button';
import { StackHeader } from '../../components/real/StackHeader';

/** One student profile, read-only. Edit (top right) opens the form. */
export function StudentProfileScreen() {
  const { colors } = useTheme();
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const id: string | undefined = route.params?.id;

  const { profiles, isLoading } = useStudentProfiles();
  const { active } = useActiveStudent();
  const { memberships } = useMemberships();
  const index = profiles.findIndex((p) => p.id === id);
  const student = index >= 0 ? profiles[index] : undefined;

  if (!student) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.bgApp }}>
        <StackHeader title="Student profile" />
        <View style={{ padding: spacing.lg }}>
          {isLoading ? (
            <ActivityIndicator color={colors.primary} style={{ marginTop: spacing.xxl }} />
          ) : (
            <EmptyState icon="person-outline" title="Profile not found" message="This student profile is no longer on your account." />
          )}
        </View>
      </View>
    );
  }

  const age = ageFrom(student.dob);
  const summary = [student.class_name, student.board, age !== null ? `${age} yrs` : null].filter(Boolean).join(' · ');
  const batches = memberships.filter((m) => m.student_id === student.id && (m.status === 'approved' || m.status === 'pending'));

  return (
    <View style={{ flex: 1, backgroundColor: colors.bgApp }}>
      <StackHeader
        title="Student profile"
        right={
          <Button
            label="Edit"
            iconName="create-outline"
            size="sm"
            variant="secondary"
            onPress={() => navigation.navigate('StudentForm', { id: student.id })}
          />
        }
      />

      <ScrollView contentContainerStyle={{ padding: spacing.lg, paddingBottom: spacing.xxxl }}>
        {/* ── Who ─────────────────────────────────────────────────────── */}
        <HeroCard>
          <Row gap={spacing.lg}>
            <Avatar initials={initialsOf(student)} gradient={gradientFor(index)} size={64} ring />
            <View style={{ flex: 1 }}>
              {active?.id === student.id ? (
                <Row gap={5}>
                  <View style={[styles.dot, { backgroundColor: colors.goldBright }]} />
                  <AppText variant="overline" style={{ color: colors.goldBright }}>
                    ACTIVE STUDENT
                  </AppText>
                </Row>
              ) : null}
              <AppText variant="title" numberOfLines={2} style={{ color: '#FDFBF9' }}>
                {fullName(student)}
              </AppText>
              {summary ? (
                <AppText variant="caption" numberOfLines={1} style={{ color: 'rgba(253,251,249,0.75)', marginTop: 2 }}>
                  {summary}
                </AppText>
              ) : null}
            </View>
          </Row>
        </HeroCard>

        {/* ── Details ─────────────────────────────────────────────────── */}
        <View style={{ marginTop: spacing.xxl }}>
          <SectionHeader title="Details" />
          <Card>
            <KeyValue label="Name" value={fullName(student)} />
            <KeyValue label="Gender" value={student.gender ? capitalise(student.gender) : '—'} />
            <KeyValue
              label="Date of birth"
              value={student.dob ? `${formatDateLong(student.dob)}${age !== null ? ` · ${age} yrs` : ''}` : '—'}
            />
            <KeyValue label="Class" value={student.class_name ?? '—'} />
            <KeyValue label="Board" value={student.board ?? '—'} />
            <Divider style={{ marginVertical: spacing.sm }} />
            <KeyValue label="Created by" value={relationLabel(student)} />
            <KeyValue label="Added on" value={formatDateLong(toISODate(new Date(student.created_at)))} />
          </Card>
        </View>

        {/* ── Batches ─────────────────────────────────────────────────── */}
        <View style={{ marginTop: spacing.xxl }}>
          <SectionHeader
            title="Batches"
            action={batches.length ? 'All batches' : undefined}
            onAction={() => navigateToTab(navigation, 'Batches')}
          />
          {batches.length ? (
            <Card padded={false}>
              {batches.map((m, i) => (
                <Row
                  key={m.id}
                  gap={spacing.md}
                  style={{
                    paddingVertical: spacing.md,
                    paddingHorizontal: spacing.lg,
                    borderTopWidth: i ? StyleSheet.hairlineWidth : 0,
                    borderTopColor: colors.border,
                  }}
                >
                  <View style={{ flex: 1 }}>
                    <AppText variant="bodyStrong" numberOfLines={1}>
                      {m.batch_name}
                    </AppText>
                    <AppText variant="caption" tone="muted" numberOfLines={1}>
                      {[m.subject, m.teacher_name].filter(Boolean).join(' · ')}
                    </AppText>
                  </View>
                  <Pill label={STATUS_LABEL[m.status]} tone={m.status === 'approved' ? 'success' : 'gold'} />
                </Row>
              ))}
            </Card>
          ) : (
            <Card>
              <AppText variant="caption" tone="secondary">
                {student.first_name} isn’t in any batch yet.
              </AppText>
              <Button
                label={`Join a batch for ${student.first_name}`}
                iconName="enter-outline"
                fullWidth
                onPress={() => navigation.navigate('JoinBatch', { studentId: student.id })}
                style={{ marginTop: spacing.md }}
              />
            </Card>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

function capitalise(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

const styles = StyleSheet.create({
  dot: { width: 6, height: 6, borderRadius: 3 },
});
