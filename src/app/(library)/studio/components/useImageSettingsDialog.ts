'use client';

import { useState } from 'react';

import { DEFAULT_BASE_URLS, DEFAULT_MODELS } from '@/lib/studio/providerDefaults';
import type { ImageProvider, StudioSettings } from '@/lib/studio/types';

export function useImageSettingsDialog(open: boolean, settings: StudioSettings) {
  const [draft, setDraft] = useState(settings);
  const [wasOpen, setWasOpen] = useState(open);

  if (open !== wasOpen) {
    setWasOpen(open);
    if (open) setDraft(settings);
  }

  const chooseProvider = (provider: ImageProvider) => setDraft(current => ({ ...current, provider, model: DEFAULT_MODELS[provider], baseURL: DEFAULT_BASE_URLS[provider] }));

  return { draft, setDraft, chooseProvider };
}
