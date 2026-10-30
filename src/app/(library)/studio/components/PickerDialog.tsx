'use client';

import { CheckIcon } from 'lucide-react';

import type { PickerKind } from '@/app/(library)/studio/components/useSelectionPanel';
import { usePickerDialog } from '@/app/(library)/studio/components/usePickerDialog';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { isPose, itemLabel, itemTitle } from '@/lib/catalogue/types';
import { cn } from '@/lib/utils';

interface PickerDialogProps {
  kind: PickerKind;
  onOpenChange: (open: boolean) => void;
  selectedPoses: string[];
  selectedCostume: string | null;
  onPickPose: (uid: string) => void;
  onPickCostume: (uid: string) => void;
}

export function PickerDialog({ kind, onOpenChange, selectedPoses, selectedCostume, onPickPose, onPickCostume }: PickerDialogProps) {
  const { query, setQuery, items, more } = usePickerDialog(kind);

  return (
    <Dialog open={!!kind} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[88dvh] flex-col sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>{kind === 'poses' ? 'Add poses' : 'Pick a costume'}</DialogTitle>
        </DialogHeader>
        <Input autoFocus value={query} onChange={event => setQuery(event.target.value)} placeholder={kind === 'poses' ? 'Search name or ID' : 'Search words or ID'} aria-label="Search" />
        <div className="grid min-h-0 flex-1 grid-cols-3 gap-2 overflow-y-auto sm:grid-cols-5">
          {items.map(item => {
            const chosen = isPose(item) ? selectedPoses.includes(item.uid) : selectedCostume === item.uid;
            const thumb = isPose(item) ? Object.values(item.images)[0].thumb : item.thumb;

            return (
              <button
                key={item.uid}
                type="button"
                onClick={() => (isPose(item) ? onPickPose(item.uid) : onPickCostume(item.uid))}
                className={cn('relative flex flex-col gap-1 rounded-md border p-1 text-left', chosen && 'ring-2 ring-primary')}
                aria-pressed={chosen}
              >
                <img src={thumb} alt="" loading="lazy" className="aspect-[3/4] w-full rounded bg-white object-contain" />
                <span className="font-mono text-[10px] text-muted-foreground">{itemLabel(item)}</span>
                <span className="line-clamp-2 text-[11px]">{itemTitle(item)}</span>
                {chosen ? <CheckIcon className="absolute top-2 right-2 size-4 rounded-full bg-primary p-0.5 text-primary-foreground" /> : null}
              </button>
            );
          })}
        </div>
        {more ? <p className="text-center text-xs text-muted-foreground">Showing the first {items.length}. Search to narrow it down.</p> : null}
      </DialogContent>
    </Dialog>
  );
}
