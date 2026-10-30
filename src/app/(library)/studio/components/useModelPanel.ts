'use client';

import { useRef } from 'react';
import { toast } from 'sonner';

import { shrinkPhoto } from '@/lib/studio/shrinkPhoto';

export function useModelPanel(photos: string[], onPhotos: (photos: string[]) => void) {
  const input = useRef<HTMLInputElement>(null);

  const addPhotos = async (files: FileList | null) => {
    if (!files?.length) return;

    const room = 3 - photos.length;
    const chosen = [...files].filter(file => file.type.startsWith('image/')).slice(0, room);

    if (files.length > room) toast.info('The studio keeps three model photos at most.');

    try {
      onPhotos([...photos, ...(await Promise.all(chosen.map(shrinkPhoto)))]);
    } catch {
      toast.error('That image could not be read.');
    }
    if (input.current) input.current.value = '';
  };

  return { addPhotos, input };
}
