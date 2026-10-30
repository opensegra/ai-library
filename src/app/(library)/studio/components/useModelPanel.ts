'use client';

import { useRef } from 'react';
import { toast } from 'sonner';

const LONGEST_SIDE = 1024;

async function shrink(file: File): Promise<string> {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, LONGEST_SIDE / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement('canvas');

  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  canvas.getContext('2d')?.drawImage(bitmap, 0, 0, canvas.width, canvas.height);

  return canvas.toDataURL('image/jpeg', 0.88);
}

export function useModelPanel(photos: string[], onPhotos: (photos: string[]) => void) {
  const input = useRef<HTMLInputElement>(null);

  const addPhotos = async (files: FileList | null) => {
    if (!files?.length) return;

    const room = 3 - photos.length;
    const chosen = [...files].filter(file => file.type.startsWith('image/')).slice(0, room);

    if (files.length > room) toast.info('The studio keeps three model photos at most.');

    try {
      onPhotos([...photos, ...(await Promise.all(chosen.map(shrink)))]);
    } catch {
      toast.error('That image could not be read.');
    }
    if (input.current) input.current.value = '';
  };

  return { addPhotos, input };
}
