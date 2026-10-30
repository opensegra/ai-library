'use client';

import { useMemo, useState } from 'react';

import { useLibrary } from '@/hooks/client/useLibrary';
import { useMyPoses } from '@/hooks/client/useMyPoses';
import { searchAndSort } from '@/lib/catalogue/filterItems';
import type { LibraryItem } from '@/lib/catalogue/types';
import { isAdultCostume, isAdultPose } from '@/lib/studio/adultContent';

export type PickerKind = 'poses' | 'costumes' | null;

const LIMIT = 150;

export function usePickerDialog(kind: PickerKind) {
  const { catalogue, state } = useLibrary();
  const { byUid: myPoses } = useMyPoses();
  const [query, setQuery] = useState('');
  const found = useMemo(() => {
    const source: LibraryItem[] =
      kind === 'poses'
        ? [...[...myPoses.values()].map(entry => entry.pose), ...catalogue.poses].filter(pose => state.showAdult || !isAdultPose(pose))
        : kind === 'costumes'
          ? catalogue.costumes.filter(costume => state.showAdult || !isAdultCostume(costume))
          : [];

    return searchAndSort(source, query, 'number', 1);
  }, [kind, catalogue, query, state.showAdult, myPoses]);

  return { query, setQuery, items: found.slice(0, LIMIT), more: found.length > LIMIT };
}
