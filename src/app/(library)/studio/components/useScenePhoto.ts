'use client';

import { useRef } from 'react';
import { toast } from 'sonner';

import { shrinkPhoto } from '@/lib/studio/shrinkPhoto';

export function useScenePhoto(onPhoto: (photo: string) => void) {
  const input = useRef<HTMLInputElement>(null);

  const choose = async (files: FileList | null) => {
    const file = files?.[0];

    if (!file?.type.startsWith('image/')) return;

    try {
      onPhoto(await shrinkPhoto(file));
    } catch {
      toast.error('That image could not be read.');
    }
    if (input.current) input.current.value = '';
  };

  return { input, choose };
}
