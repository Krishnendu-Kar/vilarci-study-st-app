import React, { useMemo, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useTheme } from '../theme/ThemeProvider';
import { radius, spacing } from '../theme/tokens';
import { useAppStore } from '../lib/store/useAppStore';
import { useMcqs, useStudentContext } from '../lib/api/hooks';
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
import { Button } from '../components/ui/Button';
import { Screen } from '../components/ui/Screen';
import { useToast } from '../components/ui/Toast';
import { ContextHeader } from '../components/ContextHeader';
import { LEARN_NAV, SubNav } from '../components/SubNav';
import type { McqOptionKey } from '../lib/data/types';

const KEYS: McqOptionKey[] = ['a', 'b', 'c', 'd'];

export function PracticeScreen() {
  const { colors, subject } = useTheme();
  const ctx = useStudentContext();
  const mcqs = useMcqs();
  const awardPractice = useAppStore((s) => s.awardPractice);
  const { points: pointsToast, toast } = useToast();

  const [filter, setFilter] = useState('all');
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, McqOptionKey>>({});
  const [revealed, setRevealed] = useState<Record<string, true>>({});
  const [finished, setFinished] = useState(false);

  const subjects = useMemo(() => [...new Set(mcqs.map((m) => m.subject))], [mcqs]);
  const deck = useMemo(() => (filter === 'all' ? mcqs : mcqs.filter((m) => m.subject === filter)), [mcqs, filter]);

  const question = deck[index];
  const correctCount = deck.filter((q) => answers[q.id] === q.correct).length;
  const answeredCount = deck.filter((q) => answers[q.id]).length;
  const scorePercent = deck.length ? (correctCount / deck.length) * 100 : 0;

  const reset = (nextFilter?: string) => {
    if (nextFilter) setFilter(nextFilter);
    setIndex(0);
    setAnswers({});
    setRevealed({});
    setFinished(false);
  };

  const choose = (key: McqOptionKey) => {
    if (!question || revealed[question.id]) return;
    setAnswers((a) => ({ ...a, [question.id]: key }));
    setRevealed((r) => ({ ...r, [question.id]: true }));
  };

  const advance = () => {
    if (index + 1 < deck.length) {
      setIndex(index + 1);
      return;
    }
    setFinished(true);
    const awarded = awardPractice(scorePercent, filter === 'all' ? 'Mixed' : filter);
    if (awarded) pointsToast(awarded, 'Practice set cleared above 80%');
    else toast(`Scored ${scorePercent.toFixed(0)}% — reach 80% to earn 30 points.`, 'info');
  };

  if (!deck.length) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.bgApp }}>
        <ContextHeader />
        <SubNav items={LEARN_NAV} />
        <Screen>
          <EmptyState icon="❓" title="No practice questions" message="Question banks are added per subject." />
        </Screen>
      </View>
    );
  }

  // ── Result card ───────────────────────────────────────────────────────────
  if (finished) {
    const passed = scorePercent >= 80;
    return (
      <View style={{ flex: 1, backgroundColor: colors.bgApp }}>
        <ContextHeader />
        <SubNav items={LEARN_NAV} />
        <Screen>
          <HeroCard gold={passed} style={{ alignItems: 'center', paddingVertical: spacing.xxl }}>
            <AppText variant="overline" style={{ color: passed ? 'rgba(22,17,15,0.6)' : colors.goldBright }}>
              PRACTICE COMPLETE
            </AppText>
            <AppText
              variant="metricXl"
              style={{ color: passed ? '#1B1208' : '#FDFBF9', marginTop: spacing.sm }}
            >
              {scorePercent.toFixed(0)}%
            </AppText>
            <AppText
              variant="caption"
              style={{ color: passed ? 'rgba(22,17,15,0.7)' : 'rgba(253,251,249,0.65)' }}
            >
              {correctCount} of {deck.length} correct
            </AppText>
            <AppText
              variant="body"
              center
              style={{
                color: passed ? 'rgba(22,17,15,0.85)' : 'rgba(253,251,249,0.8)',
                marginTop: spacing.lg,
                maxWidth: 260,
              }}
            >
              {passed
                ? 'Above 80% — 30 honours points credited to your ledger.'
                : 'Reach 80% to earn 30 honours points. Review the explanations and try again.'}
            </AppText>
          </HeroCard>

          <View style={{ marginTop: spacing.xl }}>
            <SectionHeader title="Review" subtitle="Every question with its explanation" />
            <View style={{ gap: spacing.sm }}>
              {deck.map((q) => {
                const picked = answers[q.id];
                const right = picked === q.correct;
                return (
                  <Card key={q.id} rail={right ? colors.success : colors.error}>
                    <Row gap={spacing.sm} align="flex-start">
                      <Ionicons
                        name={right ? 'checkmark-circle' : 'close-circle'}
                        size={18}
                        color={right ? colors.success : colors.error}
                        style={{ marginTop: 2 }}
                      />
                      <View style={{ flex: 1 }}>
                        <AppText variant="bodyStrong">{q.question}</AppText>
                        <AppText variant="caption" tone="muted" style={{ marginTop: 6 }}>
                          Correct: {q.options[q.correct]}
                          {picked && !right ? ` · You chose: ${q.options[picked]}` : ''}
                        </AppText>
                        <Divider style={{ marginVertical: spacing.sm }} />
                        <AppText variant="caption" tone="secondary">
                          {q.explanation}
                        </AppText>
                      </View>
                    </Row>
                  </Card>
                );
              })}
            </View>
          </View>

          <Button
            label="Practise again"
            iconName="refresh"
            fullWidth
            style={{ marginTop: spacing.xl }}
            onPress={() => reset()}
          />
        </Screen>
      </View>
    );
  }

  // ── Question card ─────────────────────────────────────────────────────────
  const tone = subject(question.subject);
  const picked = answers[question.id];
  const isRevealed = Boolean(revealed[question.id]);

  return (
    <View style={{ flex: 1, backgroundColor: colors.bgApp }}>
      <ContextHeader />
      <SubNav items={LEARN_NAV} />
      <Screen>
        <Row gap={spacing.sm} wrap>
          <Chip label="Mixed" selected={filter === 'all'} onPress={() => reset('all')} />
          {subjects.map((s) => (
            <Chip key={s} label={s} selected={filter === s} onPress={() => reset(s)} />
          ))}
        </Row>

        <View style={{ marginTop: spacing.lg }}>
          <Row justify="space-between" style={{ marginBottom: 7 }}>
            <AppText variant="overline" tone="muted">
              QUESTION {index + 1} OF {deck.length}
            </AppText>
            <AppText variant="overline" tone="muted">
              {answeredCount} ANSWERED
            </AppText>
          </Row>
          <ProgressBar value={((index + (isRevealed ? 1 : 0)) / deck.length) * 100} gradient={colors.primaryGradient} />
        </View>

        <Card style={{ marginTop: spacing.lg }} level={2}>
          <Pill label={question.subject} tone="primary" />
          <AppText variant="title" style={{ marginTop: spacing.md, lineHeight: 30 }}>
            {question.question}
          </AppText>

          <View style={{ marginTop: spacing.lg, gap: spacing.sm }}>
            {KEYS.map((key) => {
              const isCorrect = key === question.correct;
              const isPicked = picked === key;
              const showCorrect = isRevealed && isCorrect;
              const showWrong = isRevealed && isPicked && !isCorrect;

              const borderColor = showCorrect
                ? colors.success
                : showWrong
                  ? colors.error
                  : isPicked
                    ? colors.primary
                    : colors.border;
              const bg = showCorrect ? colors.successBg : showWrong ? colors.errorBg : colors.surface;

              return (
                <Pressable
                  key={key}
                  onPress={() => choose(key)}
                  disabled={isRevealed}
                  style={({ pressed }) => [
                    {
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: spacing.md,
                      padding: spacing.lg,
                      borderRadius: radius.md,
                      borderWidth: StyleSheet.hairlineWidth,
                      borderColor,
                      backgroundColor: bg,
                      opacity: pressed ? 0.85 : 1,
                    },
                  ]}
                >
                  <View
                    style={{
                      width: 26,
                      height: 26,
                      borderRadius: 13,
                      backgroundColor: showCorrect
                        ? colors.success
                        : showWrong
                          ? colors.error
                          : colors.surfaceMuted,
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <AppText
                      variant="captionStrong"
                      style={{
                        color: showCorrect || showWrong ? '#fff' : colors.textSecondary,
                        textTransform: 'uppercase',
                      }}
                    >
                      {key}
                    </AppText>
                  </View>
                  <AppText variant="body" style={{ flex: 1 }}>
                    {question.options[key]}
                  </AppText>
                  {showCorrect ? <Ionicons name="checkmark" size={17} color={colors.success} /> : null}
                  {showWrong ? <Ionicons name="close" size={17} color={colors.error} /> : null}
                </Pressable>
              );
            })}
          </View>

          {isRevealed ? (
            <View
              style={{
                marginTop: spacing.lg,
                padding: spacing.lg,
                borderRadius: radius.md,
                backgroundColor: tone.bg,
              }}
            >
              <AppText variant="overline" style={{ color: tone.text }}>
                WHY
              </AppText>
              <AppText variant="caption" tone="secondary" style={{ marginTop: 4 }}>
                {question.explanation}
              </AppText>
            </View>
          ) : null}
        </Card>

        <Button
          label={index + 1 < deck.length ? 'Next question' : 'Finish & score'}
          iconName="arrow-forward"
          fullWidth
          disabled={!isRevealed}
          style={{ marginTop: spacing.lg }}
          onPress={advance}
        />

        <AppText variant="caption" tone="muted" center style={{ marginTop: spacing.md }}>
          {ctx.student.name.split(' ')[0]}, score above 80% to earn 30 honours points.
        </AppText>
      </Screen>
    </View>
  );
}
