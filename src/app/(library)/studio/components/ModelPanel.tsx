'use client';

import { ImagePlusIcon, XIcon } from 'lucide-react';

import { useModelPanel } from '@/app/(library)/studio/components/useModelPanel';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

interface ModelPanelProps {
  photos: string[];
  description: string;
  onPhotos: (photos: string[]) => void;
  onDescription: (description: string) => void;
}

export function ModelPanel({ photos, description, onPhotos, onDescription }: ModelPanelProps) {
  const { addPhotos, input } = useModelPanel(photos, onPhotos);

  return (
    <section className="flex flex-col gap-3 rounded-lg border p-4">
      <h2 className="text-sm font-semibold">Model</h2>
      <p className="text-xs text-muted-foreground">Add up to three photos of the person to draw. Their face, hair and body are kept; the pose comes from the drawing.</p>
      <div className="grid grid-cols-3 gap-2">
        {photos.map((photo, index) => (
          <div key={photo.slice(-40)} className="relative">
            <img src={photo} alt={`Model photo ${index + 1}`} className="aspect-[3/4] w-full rounded-md border object-cover" />
            <Button variant="secondary" size="icon-xs" className="absolute top-1 right-1" aria-label="Remove photo" onClick={() => onPhotos(photos.filter((_, other) => other !== index))}>
              <XIcon />
            </Button>
          </div>
        ))}
        {photos.length < 3 ? (
          <button type="button" onClick={() => input.current?.click()} className="flex aspect-[3/4] flex-col items-center justify-center gap-1 rounded-md border border-dashed text-xs text-muted-foreground hover:bg-accent">
            <ImagePlusIcon className="size-5" />
            Add photo
          </button>
        ) : null}
      </div>
      <input ref={input} type="file" accept="image/png,image/jpeg,image/webp" multiple hidden onChange={event => void addPhotos(event.target.files)} />
      <div className="grid gap-1.5">
        <Label htmlFor="description">Description</Label>
        <Textarea id="description" value={description} onChange={event => onDescription(event.target.value)} placeholder="Adult woman, long wavy black hair, slim athletic build" rows={3} />
      </div>
      <p className="text-xs text-muted-foreground">Photos stay in this browser and are only sent with a generate request.</p>
    </section>
  );
}
