'use client';

import { useState } from 'react';

import { newService } from '@/lib/studio/studioStore';
import { isServiceReady, presetFor } from '@/lib/studio/servicePresets';
import type { ImageService, ServicePresetId, StudioSettings } from '@/lib/studio/types';

export function useImageSettingsDialog(open: boolean, settings: StudioSettings) {
  const [draft, setDraft] = useState(settings);
  const [wasOpen, setWasOpen] = useState(open);

  if (open !== wasOpen) {
    setWasOpen(open);
    if (open) {
      const starter = newService('puter');

      setDraft(settings.services.length ? settings : { services: [starter], selected: [starter.id] });
    }
  }

  const update = (id: string, change: Partial<ImageService>) => setDraft(current => ({ ...current, services: current.services.map(service => (service.id === id ? { ...service, ...change } : service)) }));

  return {
    draft,
    add: (preset: ServicePresetId) =>
      setDraft(current => {
        const service = newService(preset);

        return { services: [...current.services, service], selected: [...current.selected, service.id] };
      }),
    remove: (id: string) => setDraft(current => ({ services: current.services.filter(service => service.id !== id), selected: current.selected.filter(entry => entry !== id) })),
    update,
    choosePreset: (id: string, preset: ServicePresetId) => update(id, { preset, baseURL: presetFor(preset).baseURL, model: presetFor(preset).model }),
    toggle: (id: string) => setDraft(current => ({ ...current, selected: current.selected.includes(id) ? current.selected.filter(entry => entry !== id) : [...current.selected, id] })),
    finished: (): StudioSettings => {
      const services = draft.services.filter(service => isServiceReady(service) || draft.selected.includes(service.id));
      const usable = draft.selected.filter(id => services.some(service => service.id === id && isServiceReady(service)));

      return { services, selected: usable.length ? usable : services.filter(isServiceReady).slice(0, 1).map(service => service.id) };
    }
  };
}
