import { DEFAULT_NEGATIVE_PROMPT } from '@/lib/catalogue/negativePrompt';
import { presetFor } from '@/lib/studio/servicePresets';
import type { ImageService, ServicePresetId, StudioSelection, StudioSettings } from '@/lib/studio/types';

const SELECTION_KEY = 'ai-library.studio';
const SETTINGS_KEY = 'ai-library.image-settings';

export const EMPTY_SELECTION: StudioSelection = { poses: [], costume: null, modelPhotos: [], scenePhoto: null, description: '', extraPrompt: '', negativePrompt: DEFAULT_NEGATIVE_PROMPT, aspectRatio: '3:4', mode: 'each' };
export const DEFAULT_SETTINGS: StudioSettings = { services: [], selected: [] };

export function newService(preset: ServicePresetId): ImageService {
  const defaults = presetFor(preset);

  return { id: `${preset}-${Math.random().toString(36).slice(2, 8)}`, preset, apiKey: '', baseURL: defaults.baseURL, model: defaults.model };
}

function readSettings(): StudioSettings {
  try {
    const stored = JSON.parse(window.localStorage.getItem(SETTINGS_KEY) ?? 'null') as Partial<StudioSettings> | null;

    if (!stored || !Array.isArray(stored.services)) return DEFAULT_SETTINGS;

    const services = stored.services.filter(service => service && typeof service.id === 'string');

    return { services, selected: (stored.selected ?? []).filter(id => services.some(service => service.id === id)) };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

let selection: StudioSelection | null = null;
let settings: StudioSettings | null = null;
const listeners = new Set<() => void>();

function read<T>(key: string, fallback: T): T {
  try {
    return { ...fallback, ...(JSON.parse(window.localStorage.getItem(key) ?? 'null') as Partial<T> | null) };
  } catch {
    return fallback;
  }
}

function write(key: string, value: unknown) {
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {}
}

function notify() {
  for (const listener of listeners) listener();
}

export function subscribeStudio(listener: () => void): () => void {
  listeners.add(listener);

  return () => listeners.delete(listener);
}

export function selectionSnapshot(): StudioSelection {
  selection ??= { ...read(SELECTION_KEY, EMPTY_SELECTION), modelPhotos: [], scenePhoto: null };

  return selection;
}

export function settingsSnapshot(): StudioSettings {
  settings ??= readSettings();

  return settings;
}

export function changeSelection(change: (current: StudioSelection) => StudioSelection) {
  selection = change(selectionSnapshot());

  write(SELECTION_KEY, { ...selection, modelPhotos: [], scenePhoto: null });
  notify();
}

export function changeSettings(next: StudioSettings) {
  settings = next;
  write(SETTINGS_KEY, next);
  notify();
}

export function clearSettings() {
  settings = DEFAULT_SETTINGS;

  try {
    window.localStorage.removeItem(SETTINGS_KEY);
  } catch {}
  notify();
}

export function sendPoseRender(uid: string, angle: string, image: string) {
  changeSelection(current => ({
    ...current,
    poses: current.poses.some(pose => pose.uid === uid) ? current.poses.map(pose => (pose.uid === uid ? { uid, angle, image } : pose)) : [...current.poses, { uid, angle, image }].slice(-6)
  }));
}
