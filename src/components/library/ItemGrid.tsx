'use client';

import { ItemCard } from '@/components/library/ItemCard';
import { useItemGrid } from '@/components/library/useItemGrid';
import type { LibraryItem } from '@/lib/catalogue/types';

interface ItemGridProps {
  items: LibraryItem[];
  angle: string;
  selectedUid: string | null;
  compare: string[];
  emptyText: string;
  onSelect: (item: LibraryItem) => void;
  onOpen: (item: LibraryItem) => void;
  onToggleCompare: (uid: string) => void;
}

export function ItemGrid({ items, angle, selectedUid, compare, emptyText, onSelect, onOpen, onToggleCompare }: ItemGridProps) {
  const { shown, sentinel, gridStyle, favourites, rigs } = useItemGrid(items);

  if (!items.length) return <div className="flex flex-1 items-center justify-center p-10 text-center text-sm text-muted-foreground">{emptyText}</div>;

  return (
    <div className="min-h-0 flex-1 overflow-y-auto p-4">
      <div role="listbox" aria-label="Items" className="grid gap-3" style={gridStyle}>
        {shown.map(item => (
          <ItemCard
            key={item.uid}
            item={item}
            angle={angle}
            selected={item.uid === selectedUid}
            favourite={favourites.has(item.uid)}
            rigged={rigs.has(item.uid)}
            compared={compare.includes(item.uid)}
            onSelect={onSelect}
            onOpen={onOpen}
            onToggleCompare={onToggleCompare}
          />
        ))}
      </div>
      <div ref={sentinel} className="h-10" />
    </div>
  );
}
