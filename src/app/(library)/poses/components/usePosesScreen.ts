'use client';

import { useMemo } from 'react';

import { useBrowserQuery } from '@/hooks/client/useBrowserQuery';
import { useLibrary } from '@/hooks/client/useLibrary';
import { filterPoses } from '@/lib/catalogue/filterItems';
import { isAdultPose } from '@/lib/studio/adultContent';

export function usePosesScreen() {
  const { catalogue, state } = useLibrary();
  const { read } = useBrowserQuery();
  const line = read('line');
  const cls = read('cls');
  const poses = useMemo(() => filterPoses(catalogue.poses, { line, cls }).filter(pose => state.showAdult || !isAdultPose(pose)), [catalogue.poses, line, cls, state.showAdult]);
  const group = catalogue.lines.find(entry => entry.key === line);
  const title = group ? `${group.name}${cls ? ` · ${cls}` : ''}` : 'All poses';

  return { title, poses };
}
