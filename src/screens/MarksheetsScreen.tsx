import React, { useState } from 'react';
import { View } from 'react-native';
import { useTheme } from '../theme/ThemeProvider';
import { radius, spacing } from '../theme/tokens';
import { useDocuments, useStudentContext } from '../lib/api/hooks';
import { centerById } from '../lib/api/selectors';
import {
  AppText,
  Card,
  Divider,
  EmptyState,
  KeyValue,
  Pill,
  PressableCard,
  ProgressBar,
  Row,
  SectionHeader,
} from '../components/ui/base';
import { Screen } from '../components/ui/Screen';
import { Sheet } from '../components/ui/Sheet';
import { ContextHeader } from '../components/ContextHeader';
import { ACADEMIC_NAV, SubNav } from '../components/SubNav';
import { formatDate } from '../lib/utils/format';
import type { AcademicDocument } from '../lib/data/types';

export function MarksheetsScreen() {
  const { colors } = useTheme();
  const ctx = useStudentContext();
  const documents = useDocuments();
  const [open, setOpen] = useState<AcademicDocument | null>(null);

  const valid = documents.filter((d) => d.status === 'valid');

  return (
    <View style={{ flex: 1, backgroundColor: colors.bgApp }}>
      <ContextHeader />
      <SubNav items={ACADEMIC_NAV} />
      <Screen>
        <AppText variant="title">Marksheets & Certificates</AppText>
        <AppText variant="caption" tone="muted">
          {valid.length} valid record{valid.length === 1 ? '' : 's'} ·{' '}
          {ctx.isAllCenters ? 'all centres' : ctx.activeCenter?.name}
        </AppText>

        {documents.length ? (
          <View style={{ marginTop: spacing.lg, gap: spacing.sm }}>
            {documents.map((d) => {
              const center = centerById(d.center_id);
              const revoked = d.status === 'revoked';
              return (
                <PressableCard key={d.id} rail={revoked ? colors.error : center?.color} onPress={() => setOpen(d)}>
                  <Row justify="space-between" align="flex-start" gap={spacing.md}>
                    <View style={{ flex: 1 }}>
                      <Row gap={6} wrap>
                        <Pill
                          label={d.type === 'marksheet' ? 'Marksheet' : 'Certificate'}
                          tone={d.type === 'marksheet' ? 'primary' : 'accent'}
                          icon={d.type === 'marksheet' ? '🧾' : '🎖️'}
                        />
                        <Pill
                          label={revoked ? 'Revoked' : 'Valid'}
                          tone={revoked ? 'error' : 'success'}
                          icon={revoked ? '✕' : '✓'}
                        />
                      </Row>
                      <AppText variant="subheading" style={{ marginTop: 7 }}>
                        {d.title}
                      </AppText>
                      <AppText variant="caption" tone="muted" style={{ marginTop: 2 }}>
                        {d.center_name} · issued {formatDate(d.issue_date)}
                      </AppText>
                      <AppText variant="caption" tone="muted">
                        Verification code {d.code}
                      </AppText>
                    </View>
                    <View style={{ alignItems: 'flex-end' }}>
                      <AppText variant="metric" style={{ color: revoked ? colors.textMuted : colors.primary }}>
                        {d.percentage.toFixed(0)}%
                      </AppText>
                      <Pill label={`Grade ${d.grade}`} tone={revoked ? 'neutral' : 'success'} />
                    </View>
                  </Row>
                </PressableCard>
              );
            })}
          </View>
        ) : (
          <View style={{ marginTop: spacing.lg }}>
            <EmptyState
              icon="🧾"
              title="No documents issued yet"
              message="Official marksheets and certificates appear after each term evaluation."
            />
          </View>
        )}

        <View style={{ marginTop: spacing.xl }}>
          <SectionHeader icon="🛡️" title="About verification" />
          <Card muted>
            <AppText variant="caption" tone="secondary">
              Every document carries a unique verification code issued by the coaching centre. Schools,
              employers or parents can confirm authenticity under More → Verify Credential without needing an
              account. Revoked records stay listed for your own history but fail verification.
            </AppText>
          </Card>
        </View>
      </Screen>

      <DocumentSheet document={open} onClose={() => setOpen(null)} />
    </View>
  );
}

/** Letterhead-style record view — the mobile equivalent of the website's print layout. */
function DocumentSheet({ document: doc, onClose }: { document: AcademicDocument | null; onClose: () => void }) {
  const { colors } = useTheme();
  if (!doc) return null;
  const center = centerById(doc.center_id);
  const revoked = doc.status === 'revoked';

  return (
    <Sheet visible={Boolean(doc)} onClose={onClose} title={doc.title} subtitle={doc.exam_name}>
      {/* Letterhead */}
      <View
        style={{
          backgroundColor: colors.primarySubtle,
          borderRadius: radius.md,
          padding: spacing.lg,
          alignItems: 'center',
          borderWidth: 1,
          borderColor: colors.primary,
        }}
      >
        <AppText variant="overline" tone="primary">
          {(center?.type ?? 'COACHING INSTITUTE').toUpperCase()}
        </AppText>
        <AppText variant="title" tone="primary" center style={{ marginTop: 3 }}>
          {doc.center_name}
        </AppText>
        <AppText variant="caption" tone="muted" center style={{ marginTop: 2 }}>
          {center?.address}
        </AppText>
        <Divider style={{ marginVertical: spacing.md, width: '100%' }} />
        <AppText variant="subheading" center>
          {doc.type === 'marksheet' ? 'STATEMENT OF MARKS' : 'CERTIFICATE OF ACHIEVEMENT'}
        </AppText>
        <Pill
          label={revoked ? 'REVOKED RECORD' : 'VALID RECORD'}
          tone={revoked ? 'error' : 'success'}
          style={{ marginTop: spacing.sm }}
        />
      </View>

      <Card style={{ marginTop: spacing.md }}>
        <KeyValue label="Student" value={doc.student_id === 'student-1' ? 'Aryan Mehta' : doc.student_id} />
        <KeyValue label="Examination" value={doc.exam_name} />
        <KeyValue label="Issued on" value={formatDate(doc.issue_date)} />
        <KeyValue label="Attendance" value={`${doc.attendance_percent.toFixed(1)}%`} />
        <KeyValue label="Verification code" value={doc.code} valueTone="primary" />
      </Card>

      <SectionHeader title="Subject marks" icon="📊" />
      <Card>
        {doc.subject_marks.map((m, idx) => {
          const pct = (m.obtained / m.max) * 100;
          return (
            <View key={m.subject}>
              {idx > 0 ? <Divider style={{ marginVertical: spacing.sm }} /> : null}
              <Row justify="space-between" style={{ marginBottom: 5 }}>
                <AppText variant="captionStrong">{m.subject}</AppText>
                <AppText variant="caption" tone="muted">
                  {m.obtained}/{m.max} · {pct.toFixed(0)}%
                </AppText>
              </Row>
              <ProgressBar value={pct} color={pct >= 85 ? colors.success : colors.primary} height={6} />
            </View>
          );
        })}
        <Divider style={{ marginVertical: spacing.md }} />
        <Row justify="space-between">
          <AppText variant="subheading">Total</AppText>
          <AppText variant="subheading" tone="primary">
            {doc.total_obtained}/{doc.total_max} · {doc.percentage.toFixed(2)}% · Grade {doc.grade}
          </AppText>
        </Row>
      </Card>

      <Card style={{ marginTop: spacing.md }} muted>
        <AppText variant="caption" tone="muted">
          Authorised by
        </AppText>
        <AppText variant="subheading" style={{ marginTop: 2 }}>
          {doc.director_name}
        </AppText>
        <AppText variant="caption" tone="muted" style={{ marginTop: spacing.sm }}>
          This is a digital academic record maintained by the issuing coaching centre on Vilarci Study. Confirm
          it with code {doc.code} under More → Verify Credential.
        </AppText>
      </Card>
    </Sheet>
  );
}
