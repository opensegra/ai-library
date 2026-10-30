'use client';

import { useMemo, useState } from 'react';

import type { PickerKind } from '@/app/(library)/studio/components/useSelectionPanel';
import { useLibrary } from '@/hooks/client/useLibrary';
import { searchAndSort } from '@/lib/catalogue/filterItems';
import type { LibraryItem } from '@/lib/catalogue/types';
import { isAdultCostume, isAdultPose } from '@/lib/studio/adultContent';

const LIMIT = 150;

export function usePickerDialog(kind: PickerKind) {
  const { catalogue, state } = useLibrary();
  const [query, setQuery] = useState('');
  const found = useMemo(() => {
    const source: LibraryItem[] =
      kind === 'poses'
        ? catalogue.poses.filter(pose => state.showAdult || !isAdultPose(pose))
        : kind === 'costumes'
          ? catalogue.costumes.filter(costume => state.showAdult || !isAdultCostume(costume))
          : [];

    return searchAndSort(source, query, 'number', 1);
  }, [kind, catalogue, query, state.showAdult]);

  return { query, setQuery, items: found.slice(0, LIMIT), more: found.length > LIMIT };
}
