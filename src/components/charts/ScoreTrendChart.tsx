import React, { useState } from 'react';
import { Pressable, View } from 'react-native';
import Svg, { Circle, Defs, LinearGradient, Path, Stop, Line as SvgLine, Text as SvgText } from 'react-native-svg';
import { useTheme } from '../../theme/ThemeProvider';
import { fonts, spacing } from '../../theme/tokens';
import type { ScorePoint } from '../../lib/api/selectors';
import { AppText, Card, EmptyState, Pill, Row } from '../ui/base';
import { formatDateShort } from '../../lib/utils/format';

/**
 * Score trend polyline with gradient fill, ported from the website's pure-SVG
 * chart. Tap a point to inspect the test behind it.
 */
export function ScoreTrendChart({ points }: { points: ScorePoint[] }) {
  const { colors } = useTheme();
  const [selected, setSelected] = useState<number | null>(points.length ? points.length - 1 : null);

  if (points.length < 2) {
    return (
      <EmptyState
        icon="📈"
        title="Not enough tests yet"
        message="Two or more graded assessments are needed to plot a performance trend."
      />
    );
  }

  const W = 320;
  const H = 150;
  const padL = 30;
  const padR = 12;
  const padT = 14;
  const padB = 26;
  const plotW = W - padL - padR;
  const plotH = H - padT - padB;

  const xFor = (i: number) => padL + (plotW * i) / (points.length - 1);
  const yFor = (pct: number) => padT + plotH - (plotH * Math.max(0, Math.min(100, pct))) / 100;

  const coords = points.map((p, i) => ({ x: xFor(i), y: yFor(p.percent), p }));
  const linePath = coords.map((c, i) => `${i === 0 ? 'M' : 'L'}${c.x.toFixed(1)},${c.y.toFixed(1)}`).join(' ');
  const areaPath = `${linePath} L${coords[coords.length - 1].x.toFixed(1)},${padT + plotH} L${coords[0].x.toFixed(
    1,
  )},${padT + plotH} Z`;

  const active = selected != null ? points[selected] : null;

  return (
    <Card>
      <Row justify="space-between" align="flex-start">
        <View style={{ flex: 1 }}>
          <AppText variant="heading">Score Trend</AppText>
          <AppText variant="caption" tone="muted">
            {points.length} graded assessments · latest {points[points.length - 1].percent.toFixed(0)}%
          </AppText>
        </View>
        <Pill
          label={`Avg ${(points.reduce((s, p) => s + p.percent, 0) / points.length).toFixed(0)}%`}
          tone="primary"
        />
      </Row>

      <View style={{ marginTop: spacing.md, alignItems: 'center' }}>
        <Svg width="100%" height={H} viewBox={`0 0 ${W} ${H}`}>
          <Defs>
            <LinearGradient id="scoreFill" x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0" stopColor={colors.primary} stopOpacity={0.3} />
              <Stop offset="1" stopColor={colors.primary} stopOpacity={0.02} />
            </LinearGradient>
          </Defs>

          {[0, 25, 50, 75, 100].map((tick) => (
            <React.Fragment key={tick}>
              <SvgLine
                x1={padL}
                y1={yFor(tick)}
                x2={W - padR}
                y2={yFor(tick)}
                stroke={colors.border}
                strokeWidth={0.7}
                strokeDasharray={tick === 0 ? undefined : '3 4'}
              />
              <SvgText
                x={padL - 6}
                y={yFor(tick) + 3.5}
                fill={colors.textMuted}
                fontSize={8}
                fontFamily={fonts.sans}
                textAnchor="end"
              >
                {tick}
              </SvgText>
            </React.Fragment>
          ))}

          <Path d={areaPath} fill="url(#scoreFill)" />
          <Path d={linePath} stroke={colors.primary} strokeWidth={2.2} fill="none" strokeLinejoin="round" />

          {coords.map((c, i) => (
            <Circle
              key={points[i].name + i}
              cx={c.x}
              cy={c.y}
              r={selected === i ? 5.2 : 3.4}
              fill={selected === i ? colors.accent : colors.surface}
              stroke={selected === i ? colors.accent : colors.primary}
              strokeWidth={2}
            />
          ))}

          {coords.map((c, i) => (
            <SvgText
              key={`lbl-${i}`}
              x={c.x}
              y={H - 8}
              fill={colors.textMuted}
              fontSize={8}
              fontFamily={fonts.sans}
              textAnchor="middle"
            >
              {formatDateShort(points[i].date)}
            </SvgText>
          ))}
        </Svg>
      </View>

      {/* Tap targets sit above the chart area so points stay reachable on touch. */}
      <Row gap={4} style={{ marginTop: spacing.sm }}>
        {points.map((p, i) => (
          <Pressable
            key={`hit-${i}`}
            onPress={() => setSelected(i)}
            style={{
              flex: 1,
              height: 4,
              borderRadius: 2,
              backgroundColor: selected === i ? colors.accent : colors.surfaceAlt,
            }}
          />
        ))}
      </Row>

      {active ? (
        <View
          style={{
            marginTop: spacing.md,
            padding: spacing.md,
            borderRadius: 12,
            backgroundColor: colors.surfaceMuted,
          }}
        >
          <AppText variant="captionStrong">{active.name}</AppText>
          <AppText variant="caption" tone="muted">
            {active.subject} · {formatDateShort(active.date)} · {active.percent.toFixed(1)}%
          </AppText>
        </View>
      ) : null}
    </Card>
  );
}
