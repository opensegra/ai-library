'use client';

import { useMemo, useRef, useState } from 'react';
import { toast } from 'sonner';

import type { PickerKind } from '@/app/(library)/studio/components/usePickerDialog';
import { useLibrary } from '@/hooks/client/useLibrary';
import { useMyPoses } from '@/hooks/client/useMyPoses';
import { useStudio } from '@/hooks/client/useStudio';
import { angleName } from '@/lib/catalogue/angles';
import { duoArrangement, isDuo } from '@/lib/catalogue/describePose';
import { type Costume, isPose, type Pose } from '@/lib/catalogue/types';
import { copyText } from '@/lib/copyText';
import { composePrompt } from '@/lib/studio/composePrompt';
import { generateWithPuter } from '@/lib/studio/puterImage';
import { isServiceReady, presetFor, serviceName } from '@/lib/studio/servicePresets';
import type { GeneratedImage, GenerateRequest, ImageProtocol, ImageService, StudioPose } from '@/lib/studio/types';

export interface StudioResult {
  id: string;
  label: string;
  prompt: string;
  state: 'waiting' | 'done' | 'failed';
  body: Omit<GenerateRequest, 'protocol'> & { protocol?: ImageProtocol };
  image?: GeneratedImage;
  error?: string;
}

export interface ChosenPose {
  pose: Pose;
  angle: string;
  image: string | undefined;
  depth: string | undefined;
}

export interface TurnAttachment {
  key: string;
  thumb: string;
  label: string;
}

export interface StudioTurn {
  id: string;
  message: string;
  photos: string[];
  attachments: TurnAttachment[];
  details: string;
  services: string;
  results: StudioResult[];
}

async function requestServer(result: StudioResult, signal: AbortSignal): Promise<GeneratedImage> {
  const response = await fetch('/api/generate', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(result.body), signal });
  const payload = (await response.json()) as GeneratedImage & { error?: string };

  if (!response.ok) throw new Error(payload.error ?? `The request failed (${response.status}).`);

  return payload;
}

export function useStudioScreen() {
  const { itemByUid } = useLibrary();
  const { byUid: myPoses } = useMyPoses();
  const studio = useStudio();
  const { selection, settings, patch } = studio;
  const [turns, setTurns] = useState<StudioTurn[]>([]);
  const [running, setRunning] = useState(0);
  const [picker, setPicker] = useState<PickerKind>(null);
  const [modelOpen, setModelOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [negativeOpen, setNegativeOpen] = useState(false);
  const controllers = useRef(new Set<AbortController>());
  const poses = useMemo(
    () =>
      selection.poses
        .map((entry: StudioPose) => {
          const mine = myPoses.get(entry.uid);

          return { pose: mine?.pose ?? itemByUid.get(entry.uid), angle: entry.angle, image: entry.image, depth: entry.depth ?? (entry.image ? undefined : mine?.saved.views.find(view => view.jp === entry.angle)?.depth) };
        })
        .filter((entry): entry is ChosenPose => !!entry.pose && isPose(entry.pose)),
    [selection.poses, itemByUid, myPoses]
  );
  const costumeItem = selection.costume ? itemByUid.get(selection.costume) : undefined;
  const costume = costumeItem && !isPose(costumeItem) ? (costumeItem as Costume) : null;
  const services = useMemo(() => settings.services.filter(service => settings.selected.includes(service.id) && isServiceReady(service)), [settings]);
  const groups = selection.mode === 'sheet' && poses.length > 1 ? [poses] : poses.map(entry => [entry]);
  const imageCount = groups.length * Math.max(1, services.length);

  const buildJobs = (message: string) =>
    groups.map(group => ({
      label: group.map(entry => entry.pose.code).join(' + '),
      poseImages: [...group.map(entry => entry.image ?? (entry.pose.images[entry.angle] ?? Object.values(entry.pose.images)[0]).full), ...group.flatMap(entry => (entry.depth ? [entry.depth] : []))],
      prompt: composePrompt({
        poses: group.map(entry => ({ code: entry.pose.code, name: entry.pose.name, group: entry.pose.lineName, angle: entry.image ? 'Rendered' : angleName(entry.angle), people: isDuo(entry.pose) ? 2 : 1, arrangement: duoArrangement(entry.pose), hasDepth: !!entry.depth })),
        costume: costume ? { id: costume.id, words: costume.words } : null,
        modelPhotoCount: selection.modelPhotos.length,
        hasScene: !!selection.scenePhoto,
        description: selection.description,
        extraPrompt: message,
        mode: selection.mode
      })
    }));

  const withNegative = (prompt: string) => (selection.negativePrompt.trim() ? `${prompt}\n\nAvoid: ${selection.negativePrompt.trim()}.` : prompt);

  const settle = (resultId: string, change: Partial<StudioResult>) => setTurns(current => current.map(turn => ({ ...turn, results: turn.results.map(result => (result.id === resultId ? { ...result, ...change } : result)) })));

  const request = async (result: StudioResult) => {
    const controller = new AbortController();

    controllers.current.add(controller);
    setRunning(count => count + 1);
    try {
      settle(result.id, { state: 'done', image: result.body.protocol === 'puter' ? await generateWithPuter({ ...result.body, signal: controller.signal }) : await requestServer(result, controller.signal), error: undefined });
    } catch (error) {
      settle(result.id, { state: 'failed', error: (error as Error).name === 'AbortError' ? 'Stopped.' : (error as Error).message });
    } finally {
      controllers.current.delete(controller);
      setRunning(count => count - 1);
    }
  };

  const send = async () => {
    if (!poses.length) {
      toast.info('Add at least one pose first.');
      return;
    }

    const message = selection.extraPrompt.trim();
    const stamp = Date.now();
    const runs = buildJobs(message).flatMap(job => (services.length ? services : [null]).map((service: ImageService | null) => ({ job, service })));
    const results: StudioResult[] = runs.map(({ job, service }, index) => {
      const negativeField = !!service && !!presetFor(service.preset).negativeField;
      const prompt = negativeField ? job.prompt : withNegative(job.prompt);

      return {
        id: `${stamp}-${index}`,
        label: service ? `${job.label} · ${serviceName(service)}` : job.label,
        prompt: withNegative(job.prompt),
        state: 'waiting',
        body: {
          protocol: service ? presetFor(service.preset).protocol : undefined,
          apiKey: service?.apiKey ?? '',
          baseURL: service?.baseURL ?? '',
          model: service?.model ?? '',
          prompt,
          negativePrompt: negativeField ? selection.negativePrompt.trim() || undefined : undefined,
          modelPhotos: selection.modelPhotos,
          scenePhoto: selection.scenePhoto,
          costumeImage: costume?.mid ?? null,
          poseImages: job.poseImages,
          aspectRatio: selection.aspectRatio
        }
      };
    });
    const turn: StudioTurn = {
      id: `${stamp}`,
      message,
      photos: [...selection.modelPhotos, ...(selection.scenePhoto ? [selection.scenePhoto] : [])],
      attachments: [
        ...poses.map(({ pose, angle, image }) => ({ key: pose.uid, thumb: image ?? (pose.images[angle] ?? Object.values(pose.images)[0]).thumb, label: `${pose.code} · ${image ? '3D' : angleName(angle)}` })),
        ...poses.flatMap(({ pose, depth }) => (depth ? [{ key: `${pose.uid}-depth`, thumb: depth, label: `${pose.code} · depth` }] : [])),
        ...(costume ? [{ key: costume.uid, thumb: costume.thumb, label: costume.id }] : [])
      ],
      details: [selection.aspectRatio, poses.length > 1 ? (selection.mode === 'sheet' ? 'one sheet' : 'one image each') : null].filter(Boolean).join(' · '),
      services: services.length ? services.map(serviceName).join(', ') : 'Server key',
      results
    };

    setTurns(current => [...current, turn]);
    patch({ extraPrompt: '' });
    await Promise.all(results.map(request));
  };

  const retry = (result: StudioResult) => {
    settle(result.id, { state: 'waiting', error: undefined });
    void request(result);
  };

  const stop = () => controllers.current.forEach(controller => controller.abort());

  const copyPrompt = async (prompt: string) => {
    if (await copyText(prompt)) toast.success('Prompt copied.');
    else toast.error('The browser blocked copying.');
  };

  const copyDraft = () => {
    if (!poses.length) {
      toast.info('Add at least one pose first.');
      return;
    }

    void copyPrompt(
      buildJobs(selection.extraPrompt)
        .map(job => withNegative(job.prompt))
        .join('\n\n---\n\n')
    );
  };

  const newChat = () => {
    stop();
    setTurns([]);
  };

  return {
    ...studio,
    poses,
    costume,
    services,
    imageCount,
    turns,
    running: running > 0,
    picker,
    setPicker,
    modelOpen,
    setModelOpen,
    settingsOpen,
    setSettingsOpen,
    negativeOpen,
    setNegativeOpen,
    send,
    retry,
    stop,
    copyPrompt,
    copyDraft,
    newChat
  };
}
