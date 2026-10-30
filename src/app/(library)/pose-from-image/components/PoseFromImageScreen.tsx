'use client';

import { ImageUpIcon } from 'lucide-react';

import { usePoseFromImageScreen } from '@/app/(library)/pose-from-image/components/usePoseFromImageScreen';
import { Button } from '@/components/ui/button';

export function PoseFromImageScreen() {
  const { open, opening } = usePoseFromImageScreen();

  return (
    <div className="flex flex-1 items-center justify-center p-6">
      <div className="max-w-md text-center">
        <ImageUpIcon className="mx-auto mb-4 size-10 text-muted-foreground" />
        <h1 className="mb-2 text-xl font-semibold">Pose from your image</h1>
        <p className="mb-6 text-sm text-muted-foreground">
          Drop in a photo or a pose drawing with one or two people in full view. The pose is read in this browser, put on the 3D mannequin, and can be downloaded as a rigged .glb or .bvh. Nothing is uploaded.
        </p>
        <Button onClick={() => void open()} disabled={opening}>
          {opening ? 'Opening…' : 'Choose an image'}
        </Button>
      </div>
    </div>
  );
}
