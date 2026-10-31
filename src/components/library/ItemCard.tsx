'use client';

import { Badge } from '@/components/ui/badge';
import { isPose, itemLabel, itemTitle, type LibraryItem } from '@/lib/catalogue/types';
import { cn } from '@/lib/utils';
import { CheckIcon, PlusIcon, StarIcon } from 'lucide-react';

interface ItemCardProps {
    item: LibraryItem;
    angle: string;
    selected: boolean;
    favourite: boolean;
    rigged: boolean;
    compared: boolean;
    onSelect: (item: LibraryItem) => void;
    onOpen: (item: LibraryItem) => void;
    onToggleCompare: (uid: string) => void;
}

export function ItemCard({ item, angle, selected, favourite, rigged, compared, onSelect, onOpen, onToggleCompare }: ItemCardProps) {
    const image = isPose(item) ? (item.images[angle] ?? Object.values(item.images)[0]).thumb : item.thumb;

    return (
        <div role="option" aria-selected={selected} className="group flex min-w-0 flex-col gap-1.5">
            <button
                type="button"
                onClick={() => onSelect(item)}
                onDoubleClick={() => onOpen(item)}
                className={cn(
                    'relative aspect-[3/4] overflow-hidden rounded-lg border bg-white outline-none focus-visible:ring-2 focus-visible:ring-ring',
                    selected && 'ring-2 ring-primary'
                )}
            >
                <img
                    src={image}
                    alt=""
                    loading="lazy"
                    className="size-full object-contain [filter:var(--image-filter)] [transform:var(--image-transform)]"
                />
                <Badge variant="secondary" className="absolute top-2 left-2 font-mono text-[10px]">
                    {itemLabel(item)}
                </Badge>
                {rigged ? <Badge className="absolute bottom-2 left-2 text-[10px]">rig</Badge> : null}
                {favourite ? <StarIcon className="absolute top-2 right-2 size-4 fill-amber-400 text-amber-400" /> : null}
            </button>
            <div className="flex items-start gap-1">
                <span className="line-clamp-2 min-w-0 flex-1 text-xs text-muted-foreground">{itemTitle(item)}</span>
                <button
                    type="button"
                    onClick={() => onToggleCompare(item.uid)}
                    aria-label={compared ? 'Remove from compare' : 'Add to compare'}
                    aria-pressed={compared}
                    className={cn(
                        'flex size-5 shrink-0 items-center justify-center rounded border text-muted-foreground opacity-0 group-hover:opacity-100 focus-visible:opacity-100',
                        compared && 'border-primary bg-primary text-primary-foreground opacity-100'
                    )}
                >
                    {compared ? <CheckIcon className="size-3" /> : <PlusIcon className="size-3" />}
                </button>
            </div>
        </div>
    );
}
