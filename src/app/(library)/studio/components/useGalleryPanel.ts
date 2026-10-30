'use client';

import { useState } from 'react';

import type { GalleryImage } from '@/app/(library)/studio/components/useStudioScreen';

function fileName(image: GalleryImage, index: number): string {
  const extension = image.result.image?.dataUrl.startsWith('data:image/jpeg') ? 'jpg' : 'png';

  return `${String(index + 1).padStart(3, '0')}-${image.result.label.replace(/[^\w.-]+/g, '-')}.${extension}`;
}

export function useGalleryPanel(open: boolean, images: GalleryImage[], onDeleteAll: () => Promise<void>) {
  const [confirming, setConfirming] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [wasOpen, setWasOpen] = useState(open);

  if (open !== wasOpen) {
    setWasOpen(open);
    setConfirming(false);
  }

  const downloadAll = async () => {
    setDownloading(true);
    for (const [index, image] of images.entries()) {
      const link = document.createElement('a');

      link.href = image.result.image?.dataUrl ?? '';
      link.download = fileName(image, index);
      link.click();
      await new Promise(resolve => setTimeout(resolve, 250));
    }
    setDownloading(false);
  };

  const deleteAll = async () => {
    if (!confirming) {
      setConfirming(true);
      return;
    }

    await onDeleteAll();
    setConfirming(false);
  };

  return { confirming, downloading, downloadAll, deleteAll };
}
