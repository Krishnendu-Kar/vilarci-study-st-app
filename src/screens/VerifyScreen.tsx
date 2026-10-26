import React, { useState } from 'react';
import { ScrollView, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useTheme } from '../theme/ThemeProvider';
import { fonts, radius, spacing } from '../theme/tokens';
import { useDocuments, useVerifier } from '../lib/api/hooks';
import {
  AppText,
  Card,
  Divider,
  KeyValue,
  Pill,
  ProgressBar,
  Row,
  SectionHeader,
} from '../components/ui/base';
import { Button } from '../components/ui/Button';
import { Screen } from '../components/ui/Screen';
import { ScreenTitle } from '../components/ScreenTitle';
import { Field } from '../components/ContextHeader';
import type { VerifyResult } from '../lib/api/selectors';

export function VerifyScreen() {
  const { colors } = useTheme();
  const verify = useVerifier();
  const myDocs = useDocuments();
  const [code, setCode] = useState('');
  const [result, setResult] = useState<VerifyResult | null>(null);

  const run = () => {
    if (!code.trim()) return;
    setResult(verify(code));
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.bgApp }}>
      <Screen topInset>
        <ScreenTitle title="Verify" subtitle="Confirm any Vilarci marksheet or certificate from its code." />

        <Card style={{ marginTop: spacing.lg }} level={2}>
          <AppText variant="overline" tone="muted">
            VERIFICATION CODE
          </AppText>
          <Field
            placeholder="VS2025-A1B2"
            value={code}
            onChangeText={(t) => {
              setCode(t.toUpperCase());
              setResult(null);
            }}
            autoCapitalize="characters"
            autoCorrect={false}
            maxLength={20}
            style={{
              marginTop: spacing.sm,
              fontFamily: fonts.sansSemibold,
              fontSize: 18,
              letterSpacing: 2.5,
              textAlign: 'center',
            }}
          />
          <Button
            label="Verify document"
            iconName="shield-checkmark-outline"
            fullWidth
            style={{ marginTop: spacing.md }}
            onPress={run}
            disabled={!code.trim()}
          />
        </Card>

        {result ? <ResultPanel result={result} /> : null}

        {/* Quick-fill from this student's own documents */}
        {myDocs.length ? (
          <View style={{ marginTop: spacing.xxl }}>
            <SectionHeader title="My document codes" subtitle="Tap to fill the field" />
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ gap: spacing.sm, paddingRight: spacing.lg }}
            >
              {myDocs.map((d) => (
                <Card key={d.id} style={{ width: 210 }}>
                  <AppText variant="caption" tone="muted" numberOfLines={1}>
                    {d.title}
                  </AppText>
                  <AppText
                    variant="subheading"
                    tone="primary"
                    style={{ marginTop: 4, fontFamily: fonts.sansBold, letterSpacing: 1 }}
                  >
                    {d.code}
                  </AppText>
                  <Row gap={6} style={{ marginTop: spacing.sm }}>
                    <Pill
                      label={d.status === 'valid' ? 'Valid' : 'Revoked'}
                      tone={d.status === 'valid' ? 'success' : 'error'}
                    />
                  </Row>
                  <Button
                    label="Use code"
                    size="sm"
                    variant="secondary"
                    fullWidth
                    style={{ marginTop: spacing.md }}
                    onPress={() => {
                      setCode(d.code);
                      setResult(null);
                    }}
                  />
                </Card>
              ))}
            </ScrollView>
          </View>
        ) : null}

        <Card style={{ marginTop: spacing.xl }} muted>
          <Row gap={spacing.md} align="flex-start">
            <Ionicons name="lock-closed-outline" size={19} color={colors.textMuted} />
            <AppText variant="caption" tone="muted" style={{ flex: 1 }}>
              Verification is read-only and works without an account, so a school or employer can check a
              record you share. Only the issuing faculty can revoke a document.
            </AppText>
          </Row>
        </Card>
      </Screen>
    </View>
  );
}

function ResultPanel({ result }: { result: VerifyResult }) {
  const { colors } = useTheme();

  if (result.state === 'not_found') {
    return (
      <Card style={{ marginTop: spacing.lg }} rail={colors.error}>
        <Row gap={spacing.md} align="center">
          <Ionicons name="close-circle" size={26} color={colors.error} />
          <View style={{ flex: 1 }}>
            <AppText variant="subheading">No record found</AppText>
            <AppText variant="caption" tone="muted">
              No document matches code {result.code}. Check for typos, or ask the issuing faculty.
            </AppText>
          </View>
        </Row>
      </Card>
    );
  }

  const { document: doc, student } = result;
  const revoked = result.state === 'revoked';

  return (
    <Card style={{ marginTop: spacing.lg }} level={2} rail={revoked ? colors.error : colors.success}>
      <Row gap={spacing.md} align="center">
        <View
          style={{
            width: 44,
            height: 44,
            borderRadius: 15,
            backgroundColor: revoked ? colors.errorBg : colors.successBg,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Ionicons
            name={revoked ? 'alert-circle' : 'shield-checkmark'}
            size={22}
            color={revoked ? colors.error : colors.success}
          />
        </View>
        <View style={{ flex: 1 }}>
          <AppText variant="subheading">{revoked ? 'Document revoked' : 'Document authentic'}</AppText>
          <AppText variant="caption" tone="muted">
            {revoked
              ? 'This record was withdrawn by the issuing faculty and should not be relied on.'
              : 'Issued and still recognised by the faculty named below.'}
          </AppText>
        </View>
      </Row>

      <Divider style={{ marginVertical: spacing.lg }} />

      <AppText variant="title">{doc.title}</AppText>
      <AppText variant="caption" tone="muted" style={{ marginTop: 2 }}>
        {doc.exam_name}
      </AppText>

      <View style={{ marginTop: spacing.lg }}>
        <KeyValue label="Student" value={student?.name ?? doc.student_id} />
        <KeyValue label="Class" value={student ? `${student.class} · ${student.board}` : '—'} />
        <KeyValue label="Issued by" value={doc.center_name} />
        <KeyValue label="Authorised" value={doc.director_name} />
        <KeyValue label="Code" value={doc.code} valueTone="primary" />
      </View>

      <Divider style={{ marginVertical: spacing.lg }} />

      <Row justify="space-between" align="flex-end">
        <View>
          <AppText variant="overline" tone="muted">
            RESULT
          </AppText>
          <AppText variant="metric" tone={revoked ? 'muted' : 'primary'}>
            {doc.percentage.toFixed(1)}%
          </AppText>
        </View>
        <View style={{ alignItems: 'flex-end' }}>
          <Pill label={`Grade ${doc.grade}`} tone={revoked ? 'neutral' : 'success'} />
          <AppText variant="caption" tone="muted" style={{ marginTop: 4 }}>
            {doc.total_obtained}/{doc.total_max} marks
          </AppText>
        </View>
      </Row>

      <View
        style={{
          marginTop: spacing.lg,
          padding: spacing.lg,
          borderRadius: radius.md,
          backgroundColor: colors.surfaceMuted,
        }}
      >
        {doc.subject_marks.map((m, idx) => {
          const pct = (m.obtained / m.max) * 100;
          return (
            <View key={m.subject} style={{ marginTop: idx ? spacing.md : 0 }}>
              <Row justify="space-between" style={{ marginBottom: 5 }}>
                <AppText variant="caption">{m.subject}</AppText>
                <AppText variant="caption" tone="muted">
                  {m.obtained}/{m.max}
                </AppText>
              </Row>
              <ProgressBar value={pct} color={revoked ? colors.textMuted : colors.primary} height={5} />
            </View>
          );
        })}
      </View>
    </Card>
  );
}
