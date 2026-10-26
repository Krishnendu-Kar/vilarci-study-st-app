import React, { useState } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useTheme } from '../../theme/ThemeProvider';
import { spacing } from '../../theme/tokens';
import { supabase } from '../../lib/supabase';
import { signOut } from '../../lib/auth';
import { accountName, accountPhone, StudyAccountType, useAuth } from '../../lib/AuthProvider';
import { AppText, Row } from '../../components/ui/base';
import { Button } from '../../components/ui/Button';
import { useToast } from '../../components/ui/Toast';
import { AuthCard, AuthHero, ErrorBanner, OptionCard } from '../../components/auth/AuthKit';

/**
 * First visit after "Continue with Vilarci": decide how this person uses the
 * Study app. Stored once in `study_accounts` and not editable afterwards.
 */
export function OnboardingScreen() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const toast = useToast();
  const { session, profile, refreshAccount } = useAuth();
  const [choice, setChoice] = useState<StudyAccountType | null>(null);
  const [busy, setBusy] = useState(false);
  const [failure, setFailure] = useState<string | null>(null);

  const name = accountName(profile, session);
  const phone = accountPhone(profile, session);
  const firstName = name.split(' ')[0];

  const confirm = async () => {
    if (!choice || !session) return;
    setBusy(true);
    setFailure(null);
    try {
      const { error } = await supabase.from('study_accounts').insert({ id: session.user.id, account_type: choice });
      // A duplicate means another device already finished onboarding — just reload.
      if (error && error.code !== '23505') throw error;
      await refreshAccount();
      toast.toast(`Welcome to Vilarci Study, ${firstName}!`, 'success');
    } catch (err) {
      setFailure(String((err as Error)?.message || 'Couldn’t save your choice. Please try again.'));
    } finally {
      setBusy(false);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.bgApp }}>
      <ScrollView contentContainerStyle={{ flexGrow: 1, paddingBottom: spacing.xl }} showsVerticalScrollIndicator={false}>
        <AuthHero title={`Hi, ${firstName}`} subtitle="One last step to set up Vilarci Study." />

        <AuthCard>
          <Row gap={spacing.sm} style={{ marginBottom: spacing.lg }}>
            <Ionicons name="checkmark-circle" size={18} color={colors.success} />
            <AppText variant="caption" tone="secondary" style={{ flex: 1 }}>
              Signed in with Vilarci as <AppText variant="captionStrong">{name}</AppText>
              {phone ? ` · ${phone}` : ''}
            </AppText>
          </Row>

          <AppText variant="title">How will you use Vilarci Study?</AppText>
          <AppText variant="caption" tone="muted" style={{ marginTop: 2, marginBottom: spacing.lg }}>
            This can’t be changed later, so pick the one that fits.
          </AppText>

          <ErrorBanner message={failure} />

          <View style={{ gap: spacing.md }}>
            <OptionCard
              icon="people"
              title="I’m a parent or guardian"
              subtitle="Track attendance, fees and marks for up to 3 children."
              selected={choice === 'parent'}
              onPress={() => setChoice('parent')}
            />
            <OptionCard
              icon="school"
              title="I’m a student"
              subtitle="Your own classes, results and study tools."
              note="For students aged 18+. Younger students join through a parent’s account."
              selected={choice === 'student'}
              onPress={() => setChoice('student')}
            />
          </View>
        </AuthCard>
      </ScrollView>

      <View style={{ paddingHorizontal: spacing.lg, paddingTop: spacing.md, paddingBottom: insets.bottom + spacing.md }}>
        <Button
          label="Continue"
          iconName="arrow-forward"
          size="lg"
          fullWidth
          disabled={!choice}
          loading={busy}
          onPress={confirm}
        />
        <Pressable
          onPress={() => signOut().catch(() => {})}
          hitSlop={8}
          style={{ alignSelf: 'center', marginTop: spacing.md }}
        >
          <AppText variant="caption" tone="secondary">
            Not you? <AppText variant="captionStrong" tone="primary">Use another Vilarci account</AppText>
          </AppText>
        </Pressable>
      </View>
    </View>
  );
}
