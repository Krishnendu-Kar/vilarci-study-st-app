import React, { useMemo, useState } from 'react';
import { ActivityIndicator, Modal, Pressable, StatusBar, StyleSheet, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { WebView } from 'react-native-webview';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useTheme } from '../theme/ThemeProvider';
import { radius, spacing } from '../theme/tokens';
import { useStudentContext, useVideos } from '../lib/api/hooks';
import { centerById } from '../lib/api/selectors';
import { AppText, Card, Chip, EmptyState, Pill, PressableCard, Row } from '../components/ui/base';
import { Screen } from '../components/ui/Screen';
import { ContextHeader } from '../components/ContextHeader';
import { LEARN_NAV, SubNav } from '../components/SubNav';
import type { Video } from '../lib/data/types';
import { ALL_MODAL_ORIENTATIONS, useOrientation } from '../lib/utils/orientation';

export function VideosScreen() {
  const { colors, subject } = useTheme();
  const ctx = useStudentContext();
  const videos = useVideos();
  const [filter, setFilter] = useState('all');
  const [playing, setPlaying] = useState<Video | null>(null);

  const subjects = useMemo(() => [...new Set(videos.map((v) => v.subject))], [videos]);
  const visible = filter === 'all' ? videos : videos.filter((v) => v.subject === filter);

  return (
    <View style={{ flex: 1, backgroundColor: colors.bgApp }}>
      <ContextHeader />
      <SubNav items={LEARN_NAV} />
      <Screen>
        <AppText variant="title">Faculty Lessons</AppText>
        <AppText variant="caption" tone="muted">
          {videos.length} recorded lesson{videos.length === 1 ? '' : 's'} from{' '}
          {ctx.isAllCenters ? 'your faculties' : ctx.activeCenter?.teacher_name}
        </AppText>

        {subjects.length > 1 ? (
          <Row gap={spacing.sm} wrap style={{ marginTop: spacing.lg }}>
            <Chip label="All" selected={filter === 'all'} onPress={() => setFilter('all')} />
            {subjects.map((s) => (
              <Chip key={s} label={s} selected={filter === s} onPress={() => setFilter(s)} />
            ))}
          </Row>
        ) : null}

        <View style={{ marginTop: spacing.lg, gap: spacing.md }}>
          {visible.length ? (
            visible.map((v) => {
              const tone = subject(v.subject);
              const center = centerById(v.center_id);
              return (
                <PressableCard key={v.id} padded={false} onPress={() => setPlaying(v)} level={1}>
                  {/* Thumbnail band */}
                  <View
                    style={{
                      height: 96,
                      backgroundColor: tone.bg,
                      borderTopLeftRadius: radius.lg,
                      borderTopRightRadius: radius.lg,
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <View
                      style={{
                        width: 46,
                        height: 46,
                        borderRadius: 23,
                        backgroundColor: tone.base,
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <Ionicons name="play" size={21} color="#fff" style={{ marginLeft: 2 }} />
                    </View>
                    <View style={{ position: 'absolute', right: spacing.md, bottom: spacing.sm }}>
                      <Pill label={v.duration} tone="neutral" />
                    </View>
                  </View>

                  <View style={{ padding: spacing.lg }}>
                    <AppText variant="overline" style={{ color: tone.text }}>
                      {v.subject.toUpperCase()} · {v.chapter.toUpperCase()}
                    </AppText>
                    <AppText variant="subheading" style={{ marginTop: 4 }}>
                      {v.title}
                    </AppText>
                    <AppText variant="caption" tone="muted" style={{ marginTop: 3 }} numberOfLines={2}>
                      {v.description}
                    </AppText>
                    <Row gap={6} wrap style={{ marginTop: spacing.md }}>
                      <Pill label={v.teacher_name} tone="primary" />
                      {center ? <Pill label={center.name} tone="neutral" /> : null}
                    </Row>
                  </View>
                </PressableCard>
              );
            })
          ) : (
            <EmptyState
              icon="play-circle-outline"
              title="No lessons published yet"
              message="Your teachers' recorded lessons will appear here as they upload them."
            />
          )}
        </View>

        <Card style={{ marginTop: spacing.xl }} muted>
          <AppText variant="caption" tone="muted">
            Lessons stream from the teacher's own channel. Playback needs an internet connection and does not
            count towards learning points — revision logging and practice sets do.
          </AppText>
        </Card>
      </Screen>

      <VideoPlayer video={playing} onClose={() => setPlaying(null)} />
    </View>
  );
}

/**
 * YouTube rejects embeds that don't identify the embedding app (error 153).
 * Serving the player page from a real origin makes the WebView send a Referer.
 */
const EMBED_ORIGIN = 'https://vilarci.study';

function VideoPlayer({ video, onClose }: { video: Video | null; onClose: () => void }) {
  if (!video) return null;
  return <PlayerModal key={video.id} video={video} onClose={onClose} />;
}

function PlayerModal({ video, onClose }: { video: Video; onClose: () => void }) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();
  const [loading, setLoading] = useState(true);
  const landscape = width > height;
  // Free rotation while watching: turn the phone sideways for a full-width player.
  useOrientation('free');

  const origin = encodeURIComponent(EMBED_ORIGIN);
  const params = `playsinline=1&rel=0&modestbranding=1&origin=${origin}&widget_referrer=${origin}`;

  const html = `<!DOCTYPE html><html><head>
    <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1">
    <meta name="referrer" content="strict-origin-when-cross-origin">
    <style>html,body{margin:0;padding:0;background:#000;height:100%;overflow:hidden}iframe{border:0;width:100%;height:100%}</style>
  </head><body>
    <iframe src="https://www.youtube.com/embed/${video.youtube_id}?${params}"
      referrerpolicy="strict-origin-when-cross-origin"
      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
      allowfullscreen></iframe>
  </body></html>`;

  const player = (
    <View style={landscape ? { flex: 1, backgroundColor: '#000' } : { aspectRatio: 16 / 9, backgroundColor: '#000' }}>
      <WebView
        source={{ html, baseUrl: EMBED_ORIGIN }}
        originWhitelist={['*']}
        onLoadEnd={() => setLoading(false)}
        allowsFullscreenVideo
        allowsInlineMediaPlayback
        javaScriptEnabled
        domStorageEnabled
        mediaPlaybackRequiresUserAction={false}
        style={{ flex: 1, backgroundColor: '#000' }}
      />
      {loading ? (
        <View style={[StyleSheet.absoluteFill, { alignItems: 'center', justifyContent: 'center' }]}>
          <ActivityIndicator color="#fff" />
        </View>
      ) : null}
    </View>
  );

  return (
    <Modal
      visible
      animationType="slide"
      onRequestClose={onClose}
      statusBarTranslucent
      supportedOrientations={[...ALL_MODAL_ORIENTATIONS]}
    >
      <StatusBar hidden={landscape} />
      {landscape ? (
        <View style={{ flex: 1, backgroundColor: '#000', paddingLeft: insets.left, paddingRight: insets.right }}>
          {player}
          <Pressable
            onPress={onClose}
            hitSlop={10}
            accessibilityRole="button"
            accessibilityLabel="Close video"
            style={{
              position: 'absolute',
              top: Math.max(insets.top, spacing.md),
              right: Math.max(insets.right, spacing.md),
              width: 34,
              height: 34,
              borderRadius: 17,
              backgroundColor: 'rgba(0,0,0,0.55)',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Ionicons name="close" size={18} color="#fff" />
          </Pressable>
        </View>
      ) : (
        <View style={{ flex: 1, backgroundColor: colors.bgApp, paddingTop: insets.top }}>
          <Row
            justify="space-between"
            gap={spacing.md}
            style={{
              paddingHorizontal: spacing.lg,
              paddingVertical: spacing.sm,
              borderBottomWidth: StyleSheet.hairlineWidth,
              borderBottomColor: colors.border,
            }}
          >
            <View style={{ flex: 1 }}>
              <AppText variant="subheading" numberOfLines={1}>
                {video.title}
              </AppText>
              <AppText variant="caption" tone="muted" numberOfLines={1}>
                {video.teacher_name} · {video.duration}
              </AppText>
            </View>
            <Pressable
              onPress={onClose}
              hitSlop={10}
              accessibilityRole="button"
              accessibilityLabel="Close video"
              style={{
                width: 32,
                height: 32,
                borderRadius: 16,
                backgroundColor: colors.surfaceMuted,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Ionicons name="close" size={17} color={colors.textSecondary} />
            </Pressable>
          </Row>

          {player}

          <Screen>
            <AppText variant="overline" tone="muted">
              {video.subject.toUpperCase()} · {video.chapter.toUpperCase()}
            </AppText>
            <AppText variant="title" style={{ marginTop: 6 }}>
              {video.title}
            </AppText>
            <AppText variant="body" tone="secondary" style={{ marginTop: spacing.md }}>
              {video.description}
            </AppText>
            <Row gap={6} style={{ marginTop: spacing.lg }}>
              <Ionicons name="phone-landscape-outline" size={14} color={colors.textMuted} />
              <AppText variant="caption" tone="muted">
                Turn your phone sideways for a full-screen player.
              </AppText>
            </Row>
          </Screen>
        </View>
      )}
    </Modal>
  );
}
