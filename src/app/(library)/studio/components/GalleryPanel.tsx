'use client';

import { CloudCheckIcon, CloudUploadIcon, DownloadIcon, Trash2Icon } from 'lucide-react';

import { useGalleryPanel } from '@/app/(library)/studio/components/useGalleryPanel';
import type { GalleryImage } from '@/app/(library)/studio/components/useStudioScreen';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet';

interface GalleryPanelProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  images: GalleryImage[];
  onOpen: (image: GalleryImage) => void;
  onDelete: (resultId: string) => void;
  onDeleteAll: () => Promise<void>;
  driveAvailable: boolean;
  onSaveAllToDrive: () => void;
}

export function GalleryPanel({ open, onOpenChange, images, onOpen, onDelete, onDeleteAll, driveAvailable, onSaveAllToDrive }: GalleryPanelProps) {
  const unsaved = images.filter(image => !image.result.driveFileId).length;
  const { confirming, downloading, downloadAll, deleteAll } = useGalleryPanel(open, images, onDeleteAll);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full gap-0 sm:max-w-md">
        <SheetHeader>
          <SheetTitle>Generated images</SheetTitle>
          <SheetDescription>{images.length ? `${images.length} saved in this browser, newest first.` : 'Images you generate are saved here, in this browser.'}</SheetDescription>
        </SheetHeader>
        {images.length ? (
          <div className="flex gap-2 px-4 pb-3">
            <Button variant="outline" size="sm" disabled={downloading} onClick={() => void downloadAll()}>
              <DownloadIcon />
              {downloading ? 'Downloading…' : 'Download all'}
            </Button>
            {driveAvailable && unsaved ? (
              <Button variant="outline" size="sm" onClick={onSaveAllToDrive}>
                <CloudUploadIcon />
                Save {unsaved} to Drive
              </Button>
            ) : null}
            <Button variant="ghost" size="sm" className="ml-auto text-destructive" onClick={() => void deleteAll()}>
              <Trash2Icon />
              {confirming ? 'Click again to delete all' : 'Delete all'}
            </Button>
          </div>
        ) : null}
        <div className="grid min-h-0 flex-1 grid-cols-2 content-start gap-2 overflow-y-auto px-4 pb-4 sm:grid-cols-3">
          {images.map(image => (
            <figure key={image.result.id} className="group relative overflow-hidden rounded-lg border bg-muted">
              <button type="button" onClick={() => onOpen(image)} aria-label={`Open ${image.result.label}`} className="block w-full">
                <img src={image.result.image?.dataUrl} alt={image.result.label} loading="lazy" className="aspect-[3/4] w-full object-cover" />
              </button>
              <figcaption className="absolute inset-x-0 bottom-0 flex items-center gap-0.5 bg-black/60 px-1.5 py-1 text-[10px] text-white">
                {image.result.driveFileId ? <CloudCheckIcon className="size-3 shrink-0" aria-label="Saved to Google Drive" /> : null}
                <span className="min-w-0 flex-1 truncate">{image.result.label}</span>
                <Button variant="ghost" size="icon-xs" className="text-white hover:bg-white/20 hover:text-white" aria-label={`Download ${image.result.label}`} nativeButton={false} render={<a href={image.result.image?.dataUrl} download={`${image.result.label}.png`} />}>
                  <DownloadIcon />
                </Button>
                <Button variant="ghost" size="icon-xs" className="text-white hover:bg-white/20 hover:text-white" aria-label={`Delete ${image.result.label}`} onClick={() => onDelete(image.result.id)}>
                  <Trash2Icon />
                </Button>
              </figcaption>
            </figure>
          ))}
        </div>
      </SheetContent>
    </Sheet>
  );
}
