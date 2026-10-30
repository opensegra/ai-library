'use client';

import { useMemo } from 'react';

import { useLibrary } from '@/hooks/client/useLibrary';
import { similarCostumes } from '@/lib/catalogue/filterItems';
import type { Costume } from '@/lib/catalogue/types';

export function useCostumeInspector(costume: Costume) {
  const { catalogue, state, toggleFavourite } = useLibrary();
  const similar = useMemo(() => similarCostumes(costume, catalogue.costumes, 6), [costume, catalogue.costumes]);

  return { favourite: state.favourites.includes(costume.uid), toggleFavourite: () => toggleFavourite(costume.uid), similar };
}
