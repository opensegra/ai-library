'use client';

import { useState } from 'react';

import { useLibrary } from '@/hooks/client/useLibrary';
import { useStudio } from '@/hooks/client/useStudio';
import { useRigViewer } from '@/hooks/client/useRigViewer';
import type { LibraryItem, Pose } from '@/lib/catalogue/types';

export function usePoseInspector(pose: Pose, list: LibraryItem[], angle: string) {
  const { state, toggleFavourite } = useLibrary();
  const { openRig } = useRigViewer(list);
  const { selection, addPose, removePose } = useStudio();
  const inStudio = selection.poses.some(entry => entry.uid === pose.uid);
  const [opening, setOpening] = useState(false);

  return {
    image: pose.images[angle] ?? Object.values(pose.images)[0],
    favourite: state.favourites.includes(pose.uid),
    saved: !!state.rigs[pose.uid],
    toggleFavourite: () => toggleFavourite(pose.uid),
    inStudio,
    toggleStudio: () => (inStudio ? removePose(pose.uid) : addPose(pose.uid, angle)),
    opening,
    openRig: async () => {
      setOpening(true);
      try {
        await openRig(pose, angle);
      } finally {
        setOpening(false);
      }
    }
  };
}
