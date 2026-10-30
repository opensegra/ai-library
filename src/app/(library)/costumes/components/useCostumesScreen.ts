'use client';

import { useMemo } from 'react';

import { useBrowserQuery } from '@/hooks/client/useBrowserQuery';
import { useLibrary } from '@/hooks/client/useLibrary';
import { colourName } from '@/lib/catalogue/facets';
import { filterCostumes } from '@/lib/catalogue/filterItems';

export function useCostumesScreen() {
  const { catalogue } = useLibrary();
  const { read, readList, write } = useBrowserQuery();
  const cat = read('cat');
  const colour = read('colour');
  const wordsKey = read('words') ?? '';
  const words = useMemo(() => wordsKey.split(',').filter(Boolean), [wordsKey]);
  const costumes = useMemo(() => filterCostumes(catalogue.costumes, { cat, colour, words }), [catalogue.costumes, cat, colour, words]);
  const facetCounts = useMemo(() => {
    const counts: Record<string, number> = {};

    for (const costume of costumes) for (const word of costume.words) counts[word] = (counts[word] ?? 0) + 1;

    return counts;
  }, [costumes]);
  const group = catalogue.categories.find(entry => entry.key === cat);
  const title = [group?.name ?? (colour ? null : 'All costumes'), colour ? colourName(colour) : null].filter(Boolean).join(' · ');

  const toggleWord = (word: string) => {
    const current = readList('words');

    write({ words: current.includes(word) ? current.filter(entry => entry !== word) : [...current, word] });
  };

  return { title, costumes, facetCounts, words, toggleWord };
}
