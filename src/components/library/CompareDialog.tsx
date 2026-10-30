'use client';

import { useCompareDialog } from '@/components/library/useCompareDialog';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { isPose, itemLabel } from '@/lib/catalogue/types';

interface CompareDialogProps {
  uids: string[];
  angle: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CompareDialog({ uids, angle, open, onOpenChange }: CompareDialogProps) {
  const { items } = useCompareDialog(uids);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92dvh] max-w-[96vw] overflow-y-auto sm:max-w-[96vw]">
        <DialogHeader>
          <DialogTitle>Compare</DialogTitle>
        </DialogHeader>
        <div className="grid gap-3" style={{ gridTemplateColumns: `repeat(${Math.max(1, items.length)}, minmax(0, 1fr))` }}>
          {items.map(item => (
            <figure key={item.uid} className="flex flex-col gap-1.5">
              <img
                src={isPose(item) ? (item.images[angle] ?? Object.values(item.images)[0]).full : item.mid}
                alt=""
                className="w-full rounded-md border bg-white object-contain [filter:var(--image-filter)]"
              />
              <figcaption className="text-xs text-muted-foreground">{itemLabel(item)}</figcaption>
            </figure>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
