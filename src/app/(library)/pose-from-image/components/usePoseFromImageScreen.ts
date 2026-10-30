'use client';

import { useState } from 'react';
import { toast } from 'sonner';

export function usePoseFromImageScreen() {
  const [opening, setOpening] = useState(false);

  const open = async () => {
    setOpening(true);
    try {
      const { RigViewer } = await import('@/lib/rig/viewer');

      RigViewer.fromImage();
    } catch (error) {
      toast.error(`The 3D viewer could not load: ${(error as Error).message}`);
    } finally {
      setOpening(false);
    }
  };

  return { open, opening };
}
