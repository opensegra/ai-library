'use client';

import { useEffect, useMemo, useRef, useState, useSyncExternalStore } from 'react';
import { toast } from 'sonner';

import type { PickerKind } from '@/app/(library)/studio/components/usePickerDialog';
import { useDrive } from '@/hooks/client/useDrive';
import { useLibrary } from '@/hooks/client/useLibrary';
import { useMyPoses } from '@/hooks/client/useMyPoses';
import { useStudio } from '@/hooks/client/useStudio';
import { angleName } from '@/lib/catalogue/angles';
import { duoArrangement, isDuo } from '@/lib/catalogue/describePose';
import { type Costume, isPose, type Pose } from '@/lib/catalogue/types';
import { copyText } from '@/lib/copyText';
import { composePrompt } from '@/lib/studio/composePrompt';
import { generateWithPuter } from '@/lib/studio/puterImage';
import { fitImage } from '@/lib/studio/fitImage';
import { uploadToDrive } from '@/lib/studio/googleDrive';
import { isServiceReady, presetFor, serviceName } from '@/lib/studio/servicePresets';
import { addTurn, clearHistory, deleteChat, deleteResult, emptyHistory, historySnapshot, type SavedResult, type SavedTurn, startNewChat, subscribeHistory, switchChat, updateResult } from '@/lib/studio/studioHistory';
import type { GeneratedImage, GenerateRequest, ImageProtocol, ServicePresetId, StudioPose } from '@/lib/studio/types';

export type StudioResult = SavedResult;

export type RequestBody = Omit<GenerateRequest, 'protocol'> & { protocol?: ImageProtocol };

export interface ChosenPose {
  pose: Pose;
  angle: string;
  image: string | undefined;
  depth: string | undefined;
}

export type StudioTurn = SavedTurn;

export interface ChatSummary {
  id: string;
  title: string;
  updatedAt: string;
  images: number;
  running: boolean;
}

function summariseChats(turns: SavedTurn[]): ChatSummary[] {
  const chats = new Map<string, ChatSummary>();

  for (const turn of turns) {
    const existing = chats.get(turn.chatId);
    const images = turn.results.filter(result => result.state === 'done').length;
    const running = turn.results.some(result => result.state === 'waiting');

    if (existing) {
      chats.set(turn.chatId, { ...existing, updatedAt: turn.createdAt, images: existing.images + images, running: existing.running || running });
    } else {
      chats.set(turn.chatId, { id: turn.chatId, title: turn.message || turn.attachments.map(attachment => attachment.label.split(' · ')[0]).join(', ') || 'Untitled chat', updatedAt: turn.createdAt, images, running });
    }
  }

  return [...chats.values()].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

export interface GalleryImage {
  result: StudioResult;
  turn: StudioTurn;
}

let serverService: Promise<{ preset: ServicePresetId; model: string } | null> | null = null;

function readServerService() {
  serverService ??= fetch('/api/generate')
    .then(response => response.json() as Promise<{ server: { preset: ServicePresetId; model: string } | null }>)
    .then(payload => payload.server)
    .catch(() => null);

  return serverService;
}

async function requestServer(body: RequestBody, signal: AbortSignal): Promise<GeneratedImage> {
  const response = await fetch('/api/generate', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body), signal });
  const payload = (await response.json()) as GeneratedImage & { error?: string };

  if (!response.ok) throw new Error(payload.error ?? `The request failed (${response.status}).`);

  return payload;
}

export function useStudioScreen() {
  const { itemByUid } = useLibrary();
  const { byUid: myPoses } = useMyPoses();
  const studio = useStudio();
  const { selection, settings, patch } = studio;
  const history = useSyncExternalStore(subscribeHistory, historySnapshot, emptyHistory);
  const turns = useMemo(() => history.turns.filter(turn => turn.chatId === history.chatId), [history]);
  const gallery = useMemo<GalleryImage[]>(() => history.turns.flatMap(turn => turn.results.filter(result => result.state === 'done' && result.image).map(result => ({ result, turn }))).reverse(), [history]);
  const chats = useMemo(() => summariseChats(history.turns), [history]);
  const bodies = useRef(new Map<string, RequestBody>());
  const drive = useDrive();
  const [askDrive, setAskDrive] = useState(false);
  const askedDrive = useRef(false);
  const [retryable, setRetryable] = useState<Set<string>>(new Set());
  const [running, setRunning] = useState(0);
  const [picker, setPicker] = useState<PickerKind>(null);
  const [modelOpen, setModelOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [negativeOpen, setNegativeOpen] = useState(false);
  const [galleryOpen, setGalleryOpen] = useState(false);
  const [viewing, setViewing] = useState<GalleryImage | null>(null);
  const [chatsOpen, setChatsOpen] = useState(false);
  const generating = running > 0;

  useEffect(() => {
    if (!generating) return;

    const warn = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = '';
    };

    window.addEventListener('beforeunload', warn);

    return () => window.removeEventListener('beforeunload', warn);
  }, [generating]);
  const controllers = useRef(new Map<string, AbortController>());
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

  const buildJob = (group: ChosenPose[], message: string, limit = Infinity) => {
    const poseSources = group.map(entry => entry.image ?? (entry.pose.images[entry.angle] ?? Object.values(entry.pose.images)[0]).full).slice(0, limit);
    const kept = group.slice(0, poseSources.length);
    let room = limit - poseSources.length;
    const take = (wanted: boolean) => {
      if (!wanted || room <= 0) return false;
      room -= 1;

      return true;
    };
    const photos = selection.modelPhotos.slice(0, take(selection.modelPhotos.length > 0) ? 1 : 0);
    const withCostume = take(!!costume);
    const depths = kept.map(entry => take(!!entry.depth));
    const withScene = take(!!selection.scenePhoto);

    for (const photo of selection.modelPhotos.slice(1)) if (take(true)) photos.push(photo);

    const dropped = [
      selection.modelPhotos.length > photos.length ? `${selection.modelPhotos.length - photos.length} model photo${selection.modelPhotos.length - photos.length > 1 ? 's' : ''}` : null,
      costume && !withCostume ? 'the outfit' : null,
      kept.some((entry, index) => entry.depth && !depths[index]) ? 'depth maps' : null,
      selection.scenePhoto && !withScene ? 'the environment photo' : null,
      group.length > kept.length ? `${group.length - kept.length} pose${group.length - kept.length > 1 ? 's' : ''}` : null
    ].filter((entry): entry is string => !!entry);

    return {
      label: kept.map(entry => entry.pose.code).join(' + '),
      modelPhotos: photos,
      scenePhoto: withScene ? selection.scenePhoto : null,
      costumeImage: withCostume && costume ? costume.mid : null,
      poseImages: [...poseSources, ...kept.flatMap((entry, index) => (entry.depth && depths[index] ? [entry.depth] : []))],
      dropped,
      prompt: composePrompt({
        poses: kept.map((entry, index) => ({
          code: entry.pose.code,
          name: entry.pose.name,
          group: entry.pose.lineName,
          angle: entry.image ? 'Rendered' : angleName(entry.angle),
          people: isDuo(entry.pose) ? 2 : 1,
          arrangement: duoArrangement(entry.pose),
          hasDepth: !!entry.depth && depths[index]
        })),
        costume: withCostume && costume ? { id: costume.id, words: costume.words } : null,
        modelPhotoCount: photos.length,
        hasScene: withScene,
        description: selection.description,
        extraPrompt: message,
        mode: selection.mode
      })
    };
  };

  const buildJobs = (message: string, limit?: number) => groups.map(group => buildJob(group, message, limit));

  const withNegative = (prompt: string) => (selection.negativePrompt.trim() ? `${prompt}\n\nAvoid: ${selection.negativePrompt.trim()}.` : prompt);

  const settle = (resultId: string, change: Partial<StudioResult>) => updateResult(resultId, change);

  const driveName = (result: StudioResult) => `${result.label.replace(/[^\w.-]+/g, '-')}-${result.id}.${result.image?.dataUrl.startsWith('data:image/jpeg') ? 'jpg' : 'png'}`;

  const uploadResults = async (results: StudioResult[]) => {
    for (const result of results) {
      if (!result.image || result.driveFileId) continue;

      try {
        updateResult(result.id, { driveFileId: await uploadToDrive(driveName(result), result.image.dataUrl), driveError: undefined });
      } catch (error) {
        updateResult(result.id, { driveError: (error as Error).message });
        throw error;
      }
    }
  };

  const unsavedResults = () => history.turns.flatMap(turn => turn.results.filter(result => result.state === 'done' && result.image && !result.driveFileId));

  const saveToDrive = async (results: StudioResult[]) => {
    try {
      if (!drive.connected) await drive.connect();
      await uploadResults(results);
      toast.success(results.length === 1 ? 'Saved to Google Drive.' : `${results.length} images saved to Google Drive.`);
    } catch (error) {
      toast.error((error as Error).message);
    }
  };

  const afterImage = (result: StudioResult) => {
    if (!drive.available) return;
    if (drive.preference === 'ask' && !askedDrive.current) {
      askedDrive.current = true;
      setAskDrive(true);
      return;
    }
    if (drive.preference !== 'on') return;
    if (drive.connected) {
      void uploadResults([result]).catch(() => {});
      return;
    }

    updateResult(result.id, { driveError: 'Not saved to Drive yet: Google Drive needs connecting again.' });
    toast.info('Google Drive needs connecting again to keep saving images.', { action: { label: 'Connect', onClick: () => void saveToDrive(unsavedResults()) } });
  };

  const request = async (result: StudioResult) => {
    const body = bodies.current.get(result.id);
    const controller = new AbortController();

    if (!body) return;

    controllers.current.set(result.id, controller);
    setRunning(count => count + 1);
    try {
      const image = body.protocol === 'puter' ? await generateWithPuter({ ...body, signal: controller.signal }) : await requestServer(body, controller.signal);

      settle(result.id, { state: 'done', image, error: undefined });
      afterImage({ ...result, state: 'done', image });
    } catch (error) {
      settle(result.id, { state: 'failed', error: (error as Error).name === 'AbortError' ? 'Stopped.' : (error as Error).message });
    } finally {
      controllers.current.delete(result.id);
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
    const server = services.length ? null : await readServerService();
    const targets = services.length ? services.map(service => ({ service, preset: presetFor(service.preset) })) : [{ service: null, preset: server ? presetFor(server.preset) : null }];
    const runs = groups.flatMap(group => targets.map(target => ({ job: buildJob(group, message, target.preset?.maxReferences), ...target })));
    const prepared = Promise.all(
      runs.map(async ({ job, service, preset }, index): Promise<StudioResult & { body: RequestBody }> => {
        const negativeField = !!preset?.negativeField;
        const side = preset?.maxReferenceSide;
        const fit = (source: string) => (side ? fitImage(source, side) : Promise.resolve(source));

        return {
          id: `${stamp}-${index}`,
          label: service ? `${job.label} · ${serviceName(service)}` : job.label,
          prompt: withNegative(job.prompt),
          state: 'waiting',
          note: job.dropped.length
            ? `${preset?.label ?? 'This service'} takes ${preset?.maxReferences} reference images, so ${job.dropped.length > 1 ? `${job.dropped.slice(0, -1).join(', ')} and ${job.dropped.at(-1)}` : job.dropped[0]} ${job.dropped.length > 1 ? 'were' : 'was'} left out.`
            : undefined,
          body: {
            protocol: service ? preset?.protocol : undefined,
            apiKey: service?.apiKey ?? '',
            baseURL: service?.baseURL ?? '',
            model: service?.model ?? '',
            accountId: service?.accountId,
            prompt: negativeField ? job.prompt : withNegative(job.prompt),
            negativePrompt: negativeField ? selection.negativePrompt.trim() || undefined : undefined,
            modelPhotos: await Promise.all(job.modelPhotos.map(fit)),
            scenePhoto: job.scenePhoto ? await fit(job.scenePhoto) : null,
            costumeImage: job.costumeImage && side ? await fit(job.costumeImage) : job.costumeImage,
            poseImages: await Promise.all(job.poseImages.map(fit)),
            aspectRatio: selection.aspectRatio
          }
        };
      })
    );
    let results: (StudioResult & { body: RequestBody })[];

    try {
      results = await prepared;
    } catch (error) {
      toast.error(`The references could not be prepared: ${(error as Error).message}`);
      return;
    }

    const saved = results.map(({ body, ...result }) => {
      bodies.current.set(result.id, body);

      return result;
    });

    setRetryable(current => new Set([...current, ...saved.map(result => result.id)]));

    const turn = {
      id: `${stamp}`,
      message,
      photos: [...selection.modelPhotos, ...(selection.scenePhoto ? [selection.scenePhoto] : [])],
      attachments: [
        ...poses.map(({ pose, angle, image }) => ({ key: pose.uid, thumb: image ?? (pose.images[angle] ?? Object.values(pose.images)[0]).thumb, label: `${pose.code} · ${image ? '3D' : angleName(angle)}` })),
        ...poses.flatMap(({ pose, depth }) => (depth ? [{ key: `${pose.uid}-depth`, thumb: depth, label: `${pose.code} · depth` }] : [])),
        ...(costume ? [{ key: costume.uid, thumb: costume.thumb, label: costume.id }] : [])
      ],
      details: [selection.aspectRatio, poses.length > 1 ? (selection.mode === 'sheet' ? 'one sheet' : 'one image each') : null].filter(Boolean).join(' · '),
      services: services.length ? services.map(serviceName).join(', ') : server ? `the server key (${presetFor(server.preset).label})` : 'the server key',
      results: saved
    };

    addTurn(turn);
    patch({ extraPrompt: '' });
    await Promise.all(saved.map(request));
  };

  const retry = (result: StudioResult) => {
    settle(result.id, { state: 'waiting', error: undefined });
    void request(result);
  };

  const stop = () => turns.forEach(turn => turn.results.forEach(result => controllers.current.get(result.id)?.abort()));

  const stopAll = () => controllers.current.forEach(controller => controller.abort());

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
    startNewChat();
    setChatsOpen(false);
  };

  const openChat = (chatId: string) => {
    switchChat(chatId);
    setChatsOpen(false);
  };

  const removeChat = async (chatId: string) => {
    history.turns.filter(turn => turn.chatId === chatId).forEach(turn => turn.results.forEach(result => controllers.current.get(result.id)?.abort()));
    await deleteChat(chatId);
    toast.success('Chat deleted.');
  };

  const removeImage = (resultId: string) => {
    deleteResult(resultId);
    bodies.current.delete(resultId);
  };

  const removeAllImages = async () => {
    stopAll();
    await clearHistory();
    bodies.current.clear();
    toast.success('All generated images deleted.');
  };

  return {
    ...studio,
    poses,
    costume,
    services,
    imageCount,
    turns,
    gallery,
    chats,
    chatId: history.chatId,
    chatsOpen,
    setChatsOpen,
    openChat,
    removeChat: (chatId: string) => void removeChat(chatId),
    canRetry: (resultId: string) => retryable.has(resultId) && bodies.current.has(resultId),
    removeImage,
    removeAllImages,
    galleryOpen,
    setGalleryOpen,
    drive,
    askDrive,
    setAskDrive,
    saveToDrive: (results: StudioResult[]) => void saveToDrive(results),
    saveAllToDrive: () => void saveToDrive(unsavedResults()),
    acceptDrive: async () => {
      setAskDrive(false);
      drive.setPreference('on');
      await saveToDrive(unsavedResults());
    },
    viewing,
    setViewing,
    openResult: (result: StudioResult) => {
      const turn = history.turns.find(entry => entry.results.some(item => item.id === result.id));

      if (turn) setViewing({ result, turn });
    },
    running: turns.some(turn => turn.results.some(result => result.state === 'waiting')),
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
