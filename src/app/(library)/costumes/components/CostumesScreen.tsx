'use client';

import { CostumeFacets } from '@/app/(library)/costumes/components/CostumeFacets';
import { useCostumesScreen } from '@/app/(library)/costumes/components/useCostumesScreen';
import { ItemBrowser } from '@/components/library/ItemBrowser';

export function CostumesScreen() {
  const { title, costumes, facetCounts, words, toggleWord } = useCostumesScreen();

  return (
    <ItemBrowser
      title={title}
      items={costumes}
      showsPoses={false}
      facets={<CostumeFacets counts={facetCounts} active={words} onToggle={toggleWord} />}
      emptyText="No costume matches. Remove a filter or clear the search."
    />
  );
}
