'use client';

import { useZoomDialog } from '@/components/library/useZoomDialog';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { isPose, itemLabel, type LibraryItem } from '@/lib/catalogue/types';

interface ZoomDialogProps {
  item: LibraryItem | null;
  angle: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ZoomDialog({ item, angle, open, onOpenChange }: ZoomDialogProps) {
  const { scale, offset, onWheel, onPointerDown, onPointerMove, onPointerUp, fit, actualSize } = useZoomDialog(open);
  const source = item ? (isPose(item) ? (item.images[angle] ?? Object.values(item.images)[0]).full : item.full) : '';

  return (
    <Dialog open={open && !!item} onOpenChange={onOpenChange}>
      <DialogContent className="flex h-[92dvh] max-w-[96vw] flex-col gap-2 p-3 sm:max-w-[96vw]">
        <div className="flex items-center gap-2 pr-10">
          <DialogTitle className="text-sm">{item ? itemLabel(item) : ''}</DialogTitle>
          <span className="text-xs text-muted-foreground">Scroll to zoom · drag to pan</span>
          <Button variant="outline" size="sm" className="ml-auto" onClick={fit}>
            Fit
          </Button>
          <Button variant="outline" size="sm" onClick={actualSize}>
            100%
          </Button>
        </div>
        <div
          className="relative min-h-0 flex-1 cursor-grab touch-none overflow-hidden rounded-md bg-white active:cursor-grabbing"
          onWheel={onWheel}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
        >
          {source ? (
            <img
              src={source}
              alt=""
              draggable={false}
              className="absolute inset-0 m-auto max-h-full max-w-full select-none [filter:var(--image-filter)]"
              style={{ transform: `translate(${offset.x}px, ${offset.y}px) scale(${scale})` }}
            />
          ) : null}
        </div>
      </DialogContent>
    </Dialog>
  );
}
