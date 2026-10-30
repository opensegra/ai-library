import { DEFAULT_BASE_URLS, DEFAULT_MODELS } from '@/lib/studio/providerDefaults';
import type { StudioSelection, StudioSettings } from '@/lib/studio/types';

const SELECTION_KEY = 'ai-library.studio';
const SETTINGS_KEY = 'ai-library.image-settings';

export const EMPTY_SELECTION: StudioSelection = { poses: [], costume: null, modelPhotos: [], description: '', extraPrompt: '', aspectRatio: '3:4', mode: 'each' };
export const DEFAULT_SETTINGS: StudioSettings = { provider: 'gemini', apiKey: '', baseURL: DEFAULT_BASE_URLS.gemini, model: DEFAULT_MODELS.gemini };

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
  selection ??= { ...read(SELECTION_KEY, EMPTY_SELECTION), modelPhotos: [] };

  return selection;
}

export function settingsSnapshot(): StudioSettings {
  settings ??= read(SETTINGS_KEY, DEFAULT_SETTINGS);

  return settings;
}

export function changeSelection(change: (current: StudioSelection) => StudioSelection) {
  selection = change(selectionSnapshot());

  write(SELECTION_KEY, { ...selection, modelPhotos: [] });
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
