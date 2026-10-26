import { useEffect } from 'react';
import * as ScreenOrientation from 'expo-screen-orientation';

export type OrientationMode = 'portrait' | 'landscape' | 'free';

const LOCKS: Record<Exclude<OrientationMode, 'free'>, ScreenOrientation.OrientationLock> = {
  portrait: ScreenOrientation.OrientationLock.PORTRAIT_UP,
  landscape: ScreenOrientation.OrientationLock.LANDSCAPE,
};

/** Apply an orientation policy. Failures (e.g. iPad split view) are ignored. */
export function setOrientation(mode: OrientationMode) {
  const task = mode === 'free' ? ScreenOrientation.unlockAsync() : ScreenOrientation.lockAsync(LOCKS[mode]);
  task.catch(() => {});
}

/**
 * Hold an orientation while a component is mounted, then return the app to its
 * portrait default. Pass `null` to leave orientation untouched.
 */
export function useOrientation(mode: OrientationMode | null) {
  useEffect(() => {
    if (!mode) return;
    setOrientation(mode);
  }, [mode]);

  useEffect(() => () => setOrientation('portrait'), []);
}

/** Every orientation an iOS <Modal> may rotate to (it defaults to portrait only). */
export const ALL_MODAL_ORIENTATIONS = [
  'portrait',
  'landscape',
  'landscape-left',
  'landscape-right',
] as const;
