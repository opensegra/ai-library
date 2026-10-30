'use client';

import type { ReactNode } from 'react';

import { BrowserToolbar } from '@/components/library/BrowserToolbar';
import { CompareDialog } from '@/components/library/CompareDialog';
import { ItemGrid } from '@/components/library/ItemGrid';
import { ItemInspector } from '@/components/library/ItemInspector';
import { useItemBrowser } from '@/components/library/useItemBrowser';
import { ZoomDialog } from '@/components/library/ZoomDialog';
import type { LibraryItem } from '@/lib/catalogue/types';

interface ItemBrowserProps {
  title: string;
  items: LibraryItem[];
  showsPoses: boolean;
  facets?: ReactNode;
  emptyText: string;
}

export function ItemBrowser({ title, items, showsPoses, facets, emptyText }: ItemBrowserProps) {
  const browser = useItemBrowser(items);

  return (
    <div className="flex min-h-0 flex-1">
      <section className="flex min-w-0 flex-1 flex-col">
        <BrowserToolbar
          title={title}
          count={browser.list.length}
          showsAngles={showsPoses}
          query={browser.query}
          sort={browser.sort}
          angle={browser.angle}
          compareCount={browser.compare.length}
          onQuery={browser.setQuery}
          onSort={browser.setSort}
          onAngle={browser.setAngle}
          onCompare={browser.openCompare}
        />
        {facets}
        <ItemGrid
          items={browser.list}
          angle={browser.angle}
          selectedUid={browser.selected?.uid ?? null}
          compare={browser.compare}
          emptyText={emptyText}
          onSelect={browser.select}
          onOpen={item => {
            browser.select(item);
            browser.setZoomOpen(true);
          }}
          onToggleCompare={browser.toggleCompare}
        />
      </section>
      <ItemInspector
        item={browser.selected}
        list={browser.list}
        angle={browser.selectedAngle}
        onAngle={browser.setSelectedAngle}
        onClose={browser.closeInspector}
        onZoom={() => browser.setZoomOpen(true)}
        onSelect={browser.select}
      />
      <ZoomDialog item={browser.selected} angle={browser.selectedAngle} open={browser.zoomOpen} onOpenChange={browser.setZoomOpen} />
      <CompareDialog uids={browser.compare} angle={browser.angle} open={browser.compareOpen} onOpenChange={browser.setCompareOpen} />
    </div>
  );
}
