'use client';

import { useCallback, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

import { useBrowserQuery } from '@/hooks/client/useBrowserQuery';
import { useLibrary } from '@/hooks/client/useLibrary';
import type { PoseFit } from '@/lib/fitting/autofit';
import { ANGLES } from '@/lib/catalogue/angles';
import { isPose, type LibraryItem, type Pose } from '@/lib/catalogue/types';
import { sendPoseRender } from '@/lib/studio/studioStore';

async function fetchFit(code: string): Promise<PoseFit> {
  const response = await fetch(`/api/fits/${encodeURIComponent(code)}`);

  if (!response.ok) throw new Error(`fit request failed with ${response.status}`);

  return (await response.json()) as PoseFit;
}

export function useRigViewer(list: LibraryItem[]) {
  const { state, update, touchRecent } = useLibrary();
  const { write } = useBrowserQuery();
  const router = useRouter();
  const reopen = useRef<(pose: Pose, angleJp: string) => Promise<void>>(async () => {});

  const openRig = useCallback(
    async (pose: Pose, angleJp: string): Promise<void> => {
      const poses = list.filter(isPose);
      const at = poses.findIndex(entry => entry.uid === pose.uid);
      let viewer: typeof import('@/lib/rig/viewer');
      let fit: PoseFit;

      try {
        [viewer, fit] = await Promise.all([import('@/lib/rig/viewer'), fetchFit(pose.code)]);
      } catch (error) {
        toast.error(`The 3D viewer could not load: ${(error as Error).message}`);

        return;
      }

      const { RigViewer } = viewer;

      const saved = state.rigs[pose.uid];
      const images = ANGLES.filter(angle => pose.images[angle.jp]).map(angle => ({
        label: angle.en,
        jp: angle.jp,
        url: pose.images[angle.jp].full,
        yaw: fit.cams[angle.jp]?.yaw ?? angle.yaw,
        pitch: fit.cams[angle.jp]?.pitch ?? angle.pitch
      }));

      await RigViewer.open({
        code: pose.code,
        title: pose.name,
        figures: structuredClone(saved?.figures ?? fit.figures),
        source: saved ? 'edited' : fit.source === 'auto' && fit.approx ? 'approx' : fit.source,
        images,
        imageIndex: Math.max(0, images.findIndex(image => image.jp === angleJp)),
        position: at >= 0 ? `${at + 1} of ${poses.length}` : '',
        framing: pose.line === '上半身1人' ? 'upper' : 'full',
        proportions: fit.props,
        onStep:
          at < 0 || poses.length < 2
            ? null
            : (direction, imageJp) => {
                const next = poses[(at + direction + poses.length) % poses.length];

                write({ item: next.uid });
                touchRecent(next.uid);
                void reopen.current(next, imageJp);
              },
        onSave: figures => {
          update(current => ({ ...current, rigs: { ...current.rigs, [pose.uid]: { figures: structuredClone(figures), savedAt: new Date().toISOString() } } }));
          toast.success(`${pose.code} rig saved.`);
        },
        onRefit: () => structuredClone(fit.figures),
        onStudio: image => {
          sendPoseRender(pose.uid, angleJp, image);
          toast.success(`${pose.code} sent to the studio as a 3D render.`, {
            action: {
              label: 'Open studio',
              onClick: () => {
                RigViewer.close();
                router.push('/studio');
              }
            }
          });
        }
      });
    },
    [list, state.rigs, update, write, touchRecent, router]
  );

  useEffect(() => {
    reopen.current = openRig;
  }, [openRig]);

  return { openRig };
}
