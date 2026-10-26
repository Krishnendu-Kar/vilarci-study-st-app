import React, { useMemo, useState } from 'react';
import { View } from 'react-native';
import { useTheme } from '../theme/ThemeProvider';
import { spacing } from '../theme/tokens';
import { useStudentContext, useSyllabus } from '../lib/api/hooks';
import { useAppStore } from '../lib/store/useAppStore';
import { centerById } from '../lib/api/selectors';
import {
  AppText,
  Card,
  Chip,
  Divider,
  EmptyState,
  Pill,
  PillTone,
  ProgressBar,
  Row,
  SectionHeader,
} from '../components/ui/base';
import { Button } from '../components/ui/Button';
import { Screen } from '../components/ui/Screen';
import { useToast } from '../components/ui/Toast';
import { ContextHeader } from '../components/ContextHeader';
import { ACADEMIC_NAV, SubNav } from '../components/SubNav';
import { formatDate } from '../lib/utils/format';
import type { SyllabusStatus } from '../lib/data/types';

const STATUS_META: Record<SyllabusStatus, { label: string; tone: PillTone; icon: string }> = {
  covered: { label: 'Covered', tone: 'success', icon: '✓' },
  partial: { label: 'In progress', tone: 'warning', icon: '◑' },
  skipped: { label: 'Skipped', tone: 'error', icon: '✕' },
  upcoming: { label: 'Upcoming', tone: 'neutral', icon: '○' },
};

type Filter = 'all' | SyllabusStatus | 'to_revise';

export function SyllabusScreen() {
  const { colors, subject } = useTheme();
  const ctx = useStudentContext();
  const { topics, progress } = useSyllabus();
  const markTopicRevised = useAppStore((s) => s.markTopicRevised);
  const { points, toast } = useToast();

  const [filter, setFilter] = useState<Filter>('all');
  const [subjectFilter, setSubjectFilter] = useState<string>('all');

  const subjects = useMemo(() => [...new Set(topics.map((t) => t.subject))], [topics]);

  const visible = useMemo(
    () =>
      topics.filter((t) => {
        const statusOk =
          filter === 'all'
            ? true
            : filter === 'to_revise'
              ? t.status === 'covered' && !t.revised_by_student
              : t.status === filter;
        const subjectOk = subjectFilter === 'all' || t.subject === subjectFilter;
        return statusOk && subjectOk;
      }),
    [topics, filter, subjectFilter],
  );

  const toRevise = topics.filter((t) => t.status === 'covered' && !t.revised_by_student).length;

  const revise = (id: string, name: string, centerId: string) => {
    const awarded = markTopicRevised(id, name, centerId);
    if (awarded) points(awarded, `Revision logged: ${name}`);
    else toast('Already marked as revised.', 'info');
  };

  const colorFor = (status: SyllabusStatus) =>
    status === 'covered'
      ? colors.success
      : status === 'partial'
        ? colors.accent
        : status === 'skipped'
          ? colors.error
          : colors.border;

  return (
    <View style={{ flex: 1, backgroundColor: colors.bgApp }}>
      <ContextHeader />
      <SubNav items={ACADEMIC_NAV} />
      <Screen>
        <AppText variant="title">Curriculum & Revision</AppText>
        <AppText variant="caption" tone="muted">
          {topics.length} topics planned ·{' '}
          {ctx.isAllCenters ? `${ctx.enrolledCenters.length} centres` : ctx.activeCenter?.name}
        </AppText>

        <Card style={{ marginTop: spacing.lg }}>
          <Row justify="space-between" style={{ marginBottom: 6 }}>
            <AppText variant="captionStrong">Coverage by faculty</AppText>
            <AppText variant="caption" tone="muted">
              {progress.covered}/{progress.total} covered
            </AppText>
          </Row>
          <ProgressBar value={progress.coveragePercent} color={colors.success} />
          <Row justify="space-between" style={{ marginTop: spacing.md, marginBottom: 6 }}>
            <AppText variant="captionStrong">My revision</AppText>
            <AppText variant="caption" tone="muted">
              {progress.revisedPercent.toFixed(0)}% self-revised
            </AppText>
          </Row>
          <ProgressBar value={progress.revisedPercent} color={colors.accent} />
          <Divider style={{ marginVertical: spacing.md }} />
          <Row gap={6} wrap>
            <Pill label={`${progress.covered} covered`} tone="success" />
            <Pill label={`${progress.partial} in progress`} tone="warning" />
            <Pill label={`${progress.skipped} skipped`} tone="error" />
            <Pill label={`${progress.upcoming} upcoming`} tone="neutral" />
          </Row>
          {toRevise > 0 ? (
            <AppText variant="caption" tone="gold" style={{ marginTop: spacing.sm }}>
              🎯 {toRevise} covered topic{toRevise === 1 ? '' : 's'} still waiting on your revision — 15 pts each.
            </AppText>
          ) : null}
        </Card>

        {/* Filters */}
        <Row gap={spacing.sm} wrap style={{ marginTop: spacing.lg }}>
          <Chip label="All" selected={filter === 'all'} onPress={() => setFilter('all')} />
          <Chip label="To revise" icon="🎯" selected={filter === 'to_revise'} onPress={() => setFilter('to_revise')} />
          {(['covered', 'partial', 'skipped', 'upcoming'] as SyllabusStatus[]).map((s) => (
            <Chip
              key={s}
              label={STATUS_META[s].label}
              icon={STATUS_META[s].icon}
              selected={filter === s}
              onPress={() => setFilter(s)}
            />
          ))}
        </Row>

        {subjects.length > 1 ? (
          <Row gap={spacing.sm} wrap style={{ marginTop: spacing.sm }}>
            <Chip label="Every subject" selected={subjectFilter === 'all'} onPress={() => setSubjectFilter('all')} />
            {subjects.map((s) => (
              <Chip key={s} label={s} selected={subjectFilter === s} onPress={() => setSubjectFilter(s)} />
            ))}
          </Row>
        ) : null}

        <View style={{ marginTop: spacing.lg, gap: spacing.sm }}>
          {visible.length ? (
            visible.map((t) => {
              const meta = STATUS_META[t.status];
              const tone = subject(t.subject);
              const center = centerById(t.center_id);
              const canRevise = t.status === 'covered' && !t.revised_by_student;
              return (
                <Card key={t.id} rail={colorFor(t.status)}>
                  <Row justify="space-between" align="flex-start" gap={spacing.sm}>
                    <View style={{ flex: 1 }}>
                      <AppText variant="overline" style={{ color: tone.text }}>
                        {t.subject.toUpperCase()} · {t.chapter.toUpperCase()}
                      </AppText>
                      <AppText variant="subheading" style={{ marginTop: 3 }}>
                        {t.topic}
                      </AppText>
                      <AppText variant="caption" tone="muted" style={{ marginTop: 3 }}>
                        Planned {formatDate(t.planned_date)}
                        {t.covered_date ? ` · Taught ${formatDate(t.covered_date)}` : ' · Not taught yet'}
                      </AppText>
                      <Row gap={5} wrap style={{ marginTop: 7 }}>
                        <Pill label={meta.label} tone={meta.tone} icon={meta.icon} />
                        {center ? <Pill label={center.name} tone="primary" /> : null}
                        {t.revised_by_student ? <Pill label="Revised by me" tone="accent" icon="🎯" /> : null}
                      </Row>
                    </View>
                  </Row>

                  {canRevise ? (
                    <>
                      <Divider style={{ marginVertical: spacing.md }} />
                      <Button
                        label="I revised this topic  (+15 pts)"
                        icon="✓"
                        size="sm"
                        variant="secondary"
                        fullWidth
                        onPress={() => revise(t.id, t.topic, t.center_id)}
                      />
                    </>
                  ) : null}
                </Card>
              );
            })
          ) : (
            <EmptyState
              icon="📚"
              title="Nothing matches this filter"
              message="Try a different status or subject — or switch coaching centre in the header."
            />
          )}
        </View>

        {/* Chapter rollup */}
        <View style={{ marginTop: spacing.xl }}>
          <SectionHeader icon="🗂️" title="Chapter rollup" subtitle="Progress grouped the way your teacher plans it" />
          <Card>
            {groupByChapter(topics).map((g, idx) => (
              <View key={`${g.subject}-${g.chapter}`}>
                {idx > 0 ? <Divider style={{ marginVertical: spacing.sm }} /> : null}
                <Row justify="space-between" style={{ marginBottom: 5 }}>
                  <View style={{ flex: 1 }}>
                    <AppText variant="captionStrong" numberOfLines={1}>
                      {g.chapter}
                    </AppText>
                    <AppText variant="caption" tone="muted">
                      {g.subject}
                    </AppText>
                  </View>
                  <AppText variant="caption" tone="muted">
                    {g.covered}/{g.total}
                  </AppText>
                </Row>
                <ProgressBar value={(g.covered / g.total) * 100} color={subject(g.subject).base} height={6} />
              </View>
            ))}
          </Card>
        </View>
      </Screen>
    </View>
  );
}

function groupByChapter(topics: { subject: string; chapter: string; status: SyllabusStatus }[]) {
  const map = new Map<string, { subject: string; chapter: string; covered: number; total: number }>();
  for (const t of topics) {
    const key = `${t.subject}|${t.chapter}`;
    const b = map.get(key) ?? { subject: t.subject, chapter: t.chapter, covered: 0, total: 0 };
    b.total += 1;
    if (t.status === 'covered') b.covered += 1;
    map.set(key, b);
  }
  return [...map.values()];
}
