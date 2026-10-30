'use client';

import { useMemo } from 'react';

import { useBrowserQuery } from '@/hooks/client/useBrowserQuery';
import { useLibrary } from '@/hooks/client/useLibrary';
import { filterPoses } from '@/lib/catalogue/filterItems';

export function usePosesScreen() {
  const { catalogue } = useLibrary();
  const { read } = useBrowserQuery();
  const line = read('line');
  const cls = read('cls');
  const poses = useMemo(() => filterPoses(catalogue.poses, { line, cls }), [catalogue.poses, line, cls]);
  const group = catalogue.lines.find(entry => entry.key === line);
  const title = group ? `${group.name}${cls ? ` · ${cls}` : ''}` : 'All poses';

  return { title, poses };
}
