import React, { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useTheme } from '../theme/ThemeProvider';
import { radius, spacing } from '../theme/tokens';
import { useBatches, usePoints, useStudentContext, useTopScholars } from '../lib/api/hooks';
import {
  AppText,
  Card,
  Chip,
  Divider,
  EmptyState,
  HeroCard,
  Pill,
  ProgressBar,
  Row,
  SectionHeader,
} from '../components/ui/base';
import { Screen } from '../components/ui/Screen';
import { ContextHeader } from '../components/ContextHeader';
import { formatDate } from '../lib/utils/format';
import type { PointsAwardType } from '../lib/data/types';

type Filter = 'all' | PointsAwardType;

export function HonorsScreen() {
  const { colors } = useTheme();
  const ctx = useStudentContext();
  const points = usePoints();
  const batches = useBatches();
  const scholars = useTopScholars(5);

  const [filter, setFilter] = useState<Filter>('all');
  const [batch, setBatch] = useState<string | null>(null);

  const activeBatch = batch ?? batches.names[0] ?? null;
  const board = activeBatch ? batches.board(activeBatch) : null;
  const banner = activeBatch ? batches.banner(activeBatch) : null;

  const ledger = useMemo(
    () => (filter === 'all' ? points.history : points.history.filter((h) => h.award_type === filter)),
    [points.history, filter],
  );

  const earned = points.badges.filter((b) => b.earned);
  const teacherShare = points.total ? (points.teacherTotal / (points.teacherTotal + points.systemTotal || 1)) * 100 : 0;

  return (
    <View style={{ flex: 1, backgroundColor: colors.bgApp }}>
      <ContextHeader />
      <Screen>
        {/* ── Honours hero ────────────────────────────────────────────────── */}
        <HeroCard>
          <AppText variant="overline" style={{ color: colors.goldBright }}>
            ACADEMIC HONOURS
          </AppText>
          <Row align="flex-end" gap={spacing.sm} style={{ marginTop: spacing.sm }}>
            <AppText variant="metricXl" style={{ color: '#FDFBF9' }}>
              {points.total.toLocaleString('en-IN')}
            </AppText>
            <AppText variant="caption" style={{ color: 'rgba(253,251,249,0.6)', marginBottom: 9 }}>
              points
            </AppText>
          </Row>
          <AppText variant="caption" style={{ color: 'rgba(253,251,249,0.62)' }}>
            Earned through verified study — never purchased, never redeemable.
          </AppText>

          <View style={{ marginTop: spacing.xl }}>
            <Row justify="space-between" style={{ marginBottom: 7 }}>
              <AppText variant="overline" style={{ color: 'rgba(253,251,249,0.75)' }}>
                FACULTY AWARDS
              </AppText>
              <AppText variant="overline" style={{ color: 'rgba(253,251,249,0.75)' }}>
                {teacherShare.toFixed(0)}%
              </AppText>
            </Row>
            <ProgressBar
              value={teacherShare}
              gradient={colors.goldGradient}
              trackColor="rgba(253,251,249,0.16)"
              height={7}
            />
          </View>

          <Row style={{ marginTop: spacing.lg }} gap={spacing.lg}>
            <View style={{ flex: 1 }}>
              <AppText variant="metricSm" style={{ color: colors.goldBright }}>
                {points.teacherTotal.toLocaleString('en-IN')}
              </AppText>
              <AppText variant="overline" style={{ color: 'rgba(253,251,249,0.55)' }}>
                TEACHER HONOURS
              </AppText>
            </View>
            <View style={{ width: StyleSheet.hairlineWidth, backgroundColor: 'rgba(253,251,249,0.2)' }} />
            <View style={{ flex: 1 }}>
              <AppText variant="metricSm" style={{ color: '#FDFBF9' }}>
                {points.systemTotal.toLocaleString('en-IN')}
              </AppText>
              <AppText variant="overline" style={{ color: 'rgba(253,251,249,0.55)' }}>
                MILESTONES
              </AppText>
            </View>
            <View style={{ width: StyleSheet.hairlineWidth, backgroundColor: 'rgba(253,251,249,0.2)' }} />
            <View style={{ flex: 1 }}>
              <AppText variant="metricSm" style={{ color: '#FDFBF9' }}>
                {ctx.student.streak}d
              </AppText>
              <AppText variant="overline" style={{ color: 'rgba(253,251,249,0.55)' }}>
                STREAK
              </AppText>
            </View>
          </Row>
        </HeroCard>

        {/* ── Batch peer motivation ──────────────────────────────────────── */}
        <View style={{ marginTop: spacing.xxl }}>
          <SectionHeader
            title="My batch standing"
            subtitle={board ? `${board.center} · ${board.teacher}` : 'No batch published yet'}
          />

          {batches.names.length > 1 ? (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ gap: spacing.sm, paddingRight: spacing.lg, paddingBottom: spacing.md }}
            >
              {batches.names.map((name) => (
                <Chip key={name} label={name} selected={name === activeBatch} onPress={() => setBatch(name)} />
              ))}
            </ScrollView>
          ) : null}

          {banner ? (
            <Card
              level={1}
              style={{
                backgroundColor:
                  banner.kind === 'rank1'
                    ? colors.goldSubtle
                    : banner.kind === 'ranked'
                      ? colors.primarySubtle
                      : colors.surfaceMuted,
                borderColor:
                  banner.kind === 'rank1'
                    ? colors.gold
                    : banner.kind === 'ranked'
                      ? colors.primary
                      : colors.border,
              }}
            >
              <Row gap={spacing.md} align="flex-start">
                <AppText style={{ fontSize: 22 }}>{banner.icon}</AppText>
                <View style={{ flex: 1 }}>
                  <AppText variant="subheading">{banner.title}</AppText>
                  <AppText variant="caption" tone="secondary" style={{ marginTop: 3 }}>
                    {banner.subtitle}
                  </AppText>
                </View>
              </Row>
            </Card>
          ) : null}

          {board ? (
            <Card style={{ marginTop: spacing.sm }} padded={false}>
              {board.students.map((s, idx) => {
                const isSelf = s.student_id === ctx.student.id || s.student_name === ctx.student.name;
                return (
                  <View key={s.student_id}>
                    {idx > 0 ? <Divider inset={spacing.lg} /> : null}
                    <Row
                      gap={spacing.md}
                      style={{
                        paddingHorizontal: spacing.lg,
                        paddingVertical: spacing.md,
                        backgroundColor: isSelf ? colors.primarySubtle : 'transparent',
                      }}
                    >
                      <View style={{ width: 26, alignItems: 'center' }}>
                        <AppText variant="captionStrong" tone={isSelf ? 'primary' : 'muted'}>
                          {s.rank}
                        </AppText>
                      </View>
                      <View style={{ flex: 1 }}>
                        <Row gap={6}>
                          <AppText variant="subheading" numberOfLines={1} style={{ flexShrink: 1 }}>
                            {s.student_name}
                          </AppText>
                          {isSelf ? <Pill label="You" tone="primary" /> : null}
                        </Row>
                        <AppText variant="caption" tone="muted">
                          {s.role_tag} · {s.streak}
                        </AppText>
                      </View>
                      <View style={{ alignItems: 'flex-end' }}>
                        <AppText variant="captionStrong" tone={isSelf ? 'primary' : 'main'}>
                          {s.points.toLocaleString('en-IN')}
                        </AppText>
                        <AppText variant="overline" tone="muted">
                          PTS
                        </AppText>
                      </View>
                    </Row>
                  </View>
                );
              })}
            </Card>
          ) : (
            <EmptyState
              icon="🏅"
              title="No batch standings"
              message="Once your teacher publishes the batch board, your peer ranking appears here."
            />
          )}
        </View>

        {/* ── Milestones ─────────────────────────────────────────────────── */}
        <View style={{ marginTop: spacing.xxl }}>
          <SectionHeader
            title="Milestones"
            subtitle={`${earned.length} of ${points.badges.length} unlocked`}
          />
          <Row gap={spacing.sm} wrap>
            {points.badges.map((b) => (
              <Card
                key={b.id}
                style={{ flexGrow: 1, minWidth: '47%', opacity: b.earned ? 1 : 0.55 }}
                level={b.earned ? 1 : 0}
              >
                <View
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: 14,
                    backgroundColor: b.earned ? colors.goldSubtle : colors.surfaceMuted,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <AppText style={{ fontSize: 19 }}>{b.icon_emoji}</AppText>
                </View>
                <AppText variant="subheading" style={{ marginTop: spacing.md }} numberOfLines={1}>
                  {b.name}
                </AppText>
                <AppText variant="caption" tone="muted" style={{ marginTop: 2 }} numberOfLines={3}>
                  {b.description}
                </AppText>
                <View style={{ marginTop: spacing.sm }}>
                  {b.earned ? (
                    <Pill label={b.earned_date ? formatDate(b.earned_date) : 'Unlocked'} tone="success" icon="✓" />
                  ) : (
                    <Pill label={(b as { progress?: string }).progress ?? 'Locked'} tone="neutral" />
                  )}
                </View>
              </Card>
            ))}
          </Row>
        </View>

        {/* ── Ledger ─────────────────────────────────────────────────────── */}
        <View style={{ marginTop: spacing.xxl }}>
          <SectionHeader title="Honours ledger" subtitle="Every point, and who awarded it" />
          <Row gap={spacing.sm} style={{ marginBottom: spacing.md }}>
            <Chip label="All" selected={filter === 'all'} onPress={() => setFilter('all')} />
            <Chip label="Faculty" icon="🏅" selected={filter === 'teacher'} onPress={() => setFilter('teacher')} />
            <Chip label="System" icon="⚙️" selected={filter === 'system'} onPress={() => setFilter('system')} />
          </Row>

          {ledger.length ? (
            <Card padded={false}>
              {ledger.map((h, idx) => (
                <View key={h.id}>
                  {idx > 0 ? <Divider inset={spacing.lg} /> : null}
                  <Row gap={spacing.md} align="flex-start" style={{ padding: spacing.lg }}>
                    <View
                      style={{
                        width: 34,
                        height: 34,
                        borderRadius: 12,
                        backgroundColor: h.award_type === 'teacher' ? colors.goldSubtle : colors.surfaceMuted,
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <Ionicons
                        name={h.award_type === 'teacher' ? 'ribbon-outline' : 'settings-outline'}
                        size={16}
                        color={h.award_type === 'teacher' ? colors.gold : colors.textSecondary}
                      />
                    </View>
                    <View style={{ flex: 1 }}>
                      <AppText variant="bodyStrong">{h.description}</AppText>
                      <AppText variant="caption" tone="muted" style={{ marginTop: 2 }}>
                        {h.awarded_by} · {formatDate(h.date)}
                      </AppText>
                      {h.center_name ? (
                        <Pill label={h.center_name} tone="neutral" style={{ marginTop: 7 }} />
                      ) : (
                        <Pill label="Universal" tone="info" style={{ marginTop: 7 }} />
                      )}
                    </View>
                    <AppText
                      variant="captionStrong"
                      style={{ color: h.award_type === 'teacher' ? colors.gold : colors.success }}
                    >
                      +{h.points}
                    </AppText>
                  </Row>
                </View>
              ))}
            </Card>
          ) : (
            <EmptyState icon="📭" title="No entries in this filter" />
          )}
        </View>

        {/* ── Institution hall of fame (strictly top 5) ──────────────────── */}
        <View style={{ marginTop: spacing.xxl }}>
          <SectionHeader title="Top scholars" subtitle="Across every batch and institute" />
          <Card padded={false}>
            {scholars.map((s, idx) => {
              const isSelf = s.student_id === ctx.student.id;
              return (
                <View key={s.student_id}>
                  {idx > 0 ? <Divider inset={spacing.lg} /> : null}
                  <Row
                    gap={spacing.md}
                    style={{
                      paddingHorizontal: spacing.lg,
                      paddingVertical: spacing.md,
                      backgroundColor: isSelf ? colors.primarySubtle : 'transparent',
                    }}
                  >
                    <View
                      style={{
                        width: 30,
                        height: 30,
                        borderRadius: radius.xs,
                        backgroundColor: idx < 3 ? colors.goldSubtle : colors.surfaceMuted,
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <AppText variant="captionStrong" style={{ color: idx < 3 ? colors.gold : colors.textMuted }}>
                        {s.rank}
                      </AppText>
                    </View>
                    <View style={{ flex: 1 }}>
                      <AppText variant="subheading" numberOfLines={1}>
                        {s.student_name}
                      </AppText>
                      <AppText variant="caption" tone="muted" numberOfLines={1}>
                        {s.center} · {s.batch}
                      </AppText>
                    </View>
                    <AppText variant="captionStrong">{s.points.toLocaleString('en-IN')}</AppText>
                  </Row>
                </View>
              );
            })}
          </Card>
          <AppText variant="caption" tone="muted" style={{ marginTop: spacing.sm }}>
            Only the genuine top five are listed — your own rank is never appended for comfort.
          </AppText>
        </View>
      </Screen>
    </View>
  );
}
