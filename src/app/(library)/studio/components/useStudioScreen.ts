'use client';

import { useMemo, useState } from 'react';
import { toast } from 'sonner';

import { useLibrary } from '@/hooks/client/useLibrary';
import { useStudio } from '@/hooks/client/useStudio';
import { angleName } from '@/lib/catalogue/angles';
import { type Costume, isPose, type Pose } from '@/lib/catalogue/types';
import { composePrompt } from '@/lib/studio/composePrompt';
import type { GeneratedImage, StudioPose } from '@/lib/studio/types';

export interface StudioResult {
  id: string;
  label: string;
  prompt: string;
  state: 'waiting' | 'done' | 'failed';
  image?: GeneratedImage;
  error?: string;
}

export interface ChosenPose {
  pose: Pose;
  angle: string;
}

export function useStudioScreen() {
  const { itemByUid } = useLibrary();
  const studio = useStudio();
  const { selection, settings } = studio;
  const [results, setResults] = useState<StudioResult[]>([]);
  const [running, setRunning] = useState(false);
  const poses = useMemo(
    () =>
      selection.poses
        .map((entry: StudioPose) => ({ pose: itemByUid.get(entry.uid), angle: entry.angle }))
        .filter((entry): entry is ChosenPose => !!entry.pose && isPose(entry.pose)),
    [selection.poses, itemByUid]
  );
  const costumeItem = selection.costume ? itemByUid.get(selection.costume) : undefined;
  const costume = costumeItem && !isPose(costumeItem) ? (costumeItem as Costume) : null;

  const jobs = useMemo(() => {
    const groups = selection.mode === 'sheet' && poses.length > 1 ? [poses] : poses.map(entry => [entry]);

    return groups.map(group => ({
      label: group.map(entry => entry.pose.code).join(' + '),
      poseImages: group.map(entry => (entry.pose.images[entry.angle] ?? Object.values(entry.pose.images)[0]).full),
      prompt: composePrompt({
        poses: group.map(entry => ({ code: entry.pose.code, name: entry.pose.name, group: entry.pose.lineName, angle: angleName(entry.angle), people: entry.pose.line === '2人絡み' ? 2 : 1 })),
        costume: costume ? { id: costume.id, words: costume.words } : null,
        modelPhotoCount: selection.modelPhotos.length,
        description: selection.description,
        extraPrompt: selection.extraPrompt,
        mode: selection.mode
      })
    }));
  }, [poses, costume, selection.modelPhotos.length, selection.description, selection.extraPrompt, selection.mode]);

  const generate = async () => {
    if (!jobs.length) return;

    setRunning(true);
    const batch: StudioResult[] = jobs.map((job, index) => ({ id: `${Date.now()}-${index}`, label: job.label, prompt: job.prompt, state: 'waiting' }));

    setResults(current => [...batch, ...current]);
    await Promise.all(
      jobs.map(async (job, index) => {
        const id = batch[index].id;

        try {
          const response = await fetch('/api/generate', {
            method: 'POST',
            headers: { 'content-type': 'application/json' },
            body: JSON.stringify({ ...settings, prompt: job.prompt, modelPhotos: selection.modelPhotos, costumeImage: costume?.mid ?? null, poseImages: job.poseImages, aspectRatio: selection.aspectRatio })
          });
          const payload = (await response.json()) as GeneratedImage & { error?: string };

          if (!response.ok) throw new Error(payload.error ?? `The request failed (${response.status}).`);

          setResults(current => current.map(result => (result.id === id ? { ...result, state: 'done', image: payload } : result)));
        } catch (error) {
          setResults(current => current.map(result => (result.id === id ? { ...result, state: 'failed', error: (error as Error).message } : result)));
        }
      })
    );
    setRunning(false);
  };

  const copyPrompt = async (prompt: string) => {
    try {
      await navigator.clipboard.writeText(prompt);
      toast.success('Prompt copied.');
    } catch {
      toast.error('The browser blocked copying.');
    }
  };

  return { ...studio, poses, costume, jobs, results, running, generate, copyPrompt, clearResults: () => setResults([]), hasKey: !!settings.apiKey.trim() };
}
