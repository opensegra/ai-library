'use client';

import { type PickerKind, usePickerDialog } from '@/app/(library)/studio/components/usePickerDialog';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { isPose, itemLabel, itemTitle } from '@/lib/catalogue/types';
import { cn } from '@/lib/utils';
import { CheckIcon } from 'lucide-react';

interface PickerDialogProps {
    kind: PickerKind;
    onOpenChange: (open: boolean) => void;
    selectedPoses: string[];
    selectedCostume: string | null;
    onPickPose: (uid: string) => void;
    onPickCostume: (uid: string) => void;
}

export function PickerDialog({ kind, onOpenChange, selectedPoses, selectedCostume, onPickPose, onPickCostume }: PickerDialogProps) {
    const { query, setQuery, group, chooseGroup, groups, items, total, more, scroller, setSentinel, loadMore } = usePickerDialog(kind);

    return (
        <Dialog open={!!kind} onOpenChange={onOpenChange}>
            <DialogContent className="flex max-h-[88dvh] flex-col sm:max-w-3xl">
                <DialogHeader>
                    <DialogTitle>{kind === 'poses' ? 'Add a pose' : 'Pick a costume'}</DialogTitle>
                </DialogHeader>
                <Input
                    autoFocus
                    value={query}
                    onChange={(event) => setQuery(event.target.value)}
                    placeholder={kind === 'poses' ? 'Search name or ID' : 'Search words or ID'}
                    aria-label="Search"
                />
                <div className="flex flex-wrap gap-1.5">
                    <Button variant={group === null ? 'default' : 'outline'} size="xs" onClick={() => chooseGroup(null)}>
                        All
                    </Button>
                    {groups.map((entry) => (
                        <Button
                            key={entry.key}
                            variant={group === entry.key ? 'default' : 'outline'}
                            size="xs"
                            onClick={() => chooseGroup(entry.key)}
                        >
                            {entry.name}
                            <span className="opacity-60">{entry.count}</span>
                        </Button>
                    ))}
                </div>
                <div ref={scroller} className="grid min-h-0 flex-1 grid-cols-3 content-start gap-2 overflow-y-auto sm:grid-cols-5">
                    {items.map((item) => {
                        const chosen = isPose(item) ? selectedPoses.includes(item.uid) : selectedCostume === item.uid;
                        const thumb = isPose(item) ? Object.values(item.images)[0].thumb : item.thumb;

                        return (
                            <button
                                key={item.uid}
                                type="button"
                                onClick={() => (isPose(item) ? onPickPose(item.uid) : onPickCostume(item.uid))}
                                className={cn(
                                    'relative flex flex-col gap-1 rounded-md border p-1 text-left',
                                    chosen && 'ring-2 ring-primary'
                                )}
                                aria-pressed={chosen}
                            >
                                <img src={thumb} alt="" loading="lazy" className="aspect-3/4 w-full rounded bg-white object-contain" />
                                <span className="font-mono text-[10px] text-muted-foreground">{itemLabel(item)}</span>
                                <span className="line-clamp-2 text-[11px]">{itemTitle(item)}</span>
                                {chosen ? (
                                    <CheckIcon className="absolute top-2 right-2 size-4 rounded-full bg-primary p-0.5 text-primary-foreground" />
                                ) : null}
                            </button>
                        );
                    })}
                    {more ? (
                        <div ref={setSentinel} className="col-span-full flex justify-center py-2">
                            <Button variant="outline" size="sm" onClick={loadMore}>
                                Load more
                            </Button>
                        </div>
                    ) : null}
                    {items.length ? null : (
                        <p className="col-span-full py-8 text-center text-sm text-muted-foreground">
                            Nothing matches. Try another group or search.
                        </p>
                    )}
                </div>
                <p className="text-center text-xs text-muted-foreground">
                    {more
                        ? `Showing ${items.length} of ${total} · scroll for more`
                        : `${total} ${kind === 'poses' ? (total === 1 ? 'pose' : 'poses') : total === 1 ? 'costume' : 'costumes'}`}
                </p>
            </DialogContent>
        </Dialog>
    );
}
