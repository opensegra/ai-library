'use client';

import { useCallback, useSyncExternalStore } from 'react';

import { changeSelection, changeSettings, clearSettings, EMPTY_SELECTION, DEFAULT_SETTINGS, selectionSnapshot, settingsSnapshot, subscribeStudio } from '@/lib/studio/studioStore';
import type { StudioSelection } from '@/lib/studio/types';

export function useStudio() {
  const selection = useSyncExternalStore(subscribeStudio, selectionSnapshot, () => EMPTY_SELECTION);
  const settings = useSyncExternalStore(subscribeStudio, settingsSnapshot, () => DEFAULT_SETTINGS);

  const addPose = useCallback(
    (uid: string, angle: string) => changeSelection(current => (current.poses.some(pose => pose.uid === uid) ? current : { ...current, poses: [...current.poses, { uid, angle }].slice(-6) })),
    []
  );
  const removePose = useCallback((uid: string) => changeSelection(current => ({ ...current, poses: current.poses.filter(pose => pose.uid !== uid) })), []);
  const setPoseAngle = useCallback((uid: string, angle: string) => changeSelection(current => ({ ...current, poses: current.poses.map(pose => (pose.uid === uid ? { ...pose, angle } : pose)) })), []);
  const setCostume = useCallback((uid: string | null) => changeSelection(current => ({ ...current, costume: uid })), []);
  const patch = useCallback((change: Partial<StudioSelection>) => changeSelection(current => ({ ...current, ...change })), []);

  return { selection, settings, addPose, removePose, setPoseAngle, setCostume, patch, saveSettings: changeSettings, clearSettings };
}
