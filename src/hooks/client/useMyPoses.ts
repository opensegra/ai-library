'use client';

import { useMemo, useSyncExternalStore } from 'react';

import { emptyMyPoses, type MyPose, myPoseAsPose, myPosesSnapshot, subscribeMyPoses } from '@/lib/library/myPoses';
import type { Pose } from '@/lib/catalogue/types';

export function useMyPoses() {
  const poses = useSyncExternalStore(subscribeMyPoses, myPosesSnapshot, emptyMyPoses);
  const byUid = useMemo(() => new Map<string, { saved: MyPose; pose: Pose }>(poses.map(saved => [`m:${saved.id}`, { saved, pose: myPoseAsPose(saved) }])), [poses]);

  return { poses, byUid };
}
