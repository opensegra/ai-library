'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { useLibrary } from '@/hooks/client/useLibrary';
import { useMyPoses } from '@/hooks/client/useMyPoses';
import { searchAndSort } from '@/lib/catalogue/filterItems';
import { isPose, type LibraryItem } from '@/lib/catalogue/types';
import { ADULT_COSTUME_CATEGORIES, ADULT_POSE_LINES, isAdultCostume, isAdultPose } from '@/lib/studio/adultContent';

export type PickerKind = 'poses' | 'costumes' | null;

export interface PickerGroup {
  key: string;
  name: string;
  count: number;
}

const PAGE = 60;
const MINE = 'mine';

export function usePickerDialog(kind: PickerKind) {
  const { catalogue, state } = useLibrary();
  const showAdult = state.showAdult;
  const { byUid: myPoses } = useMyPoses();
  const [query, setQuery] = useState('');
  const [group, setGroup] = useState<string | null>(null);
  const [shown, setShown] = useState(PAGE);
  const [filterKey, setFilterKey] = useState(`${kind}|${query}|${group}`);
  const scroller = useRef<HTMLDivElement>(null);
  const [sentinel, setSentinel] = useState<HTMLDivElement | null>(null);
  const [forKind, setForKind] = useState(kind);

  if (forKind !== kind) {
    setForKind(kind);
    setGroup(null);
    setQuery('');
  }

  if (filterKey !== `${kind}|${query}|${group}`) {
    setFilterKey(`${kind}|${query}|${group}`);
    setShown(PAGE);
  }

  const { source, groups } = useMemo(() => {
    const mine = [...myPoses.values()].map(entry => entry.pose);

    if (kind === 'poses') {
      const visible = [...mine, ...catalogue.poses].filter(pose => showAdult || !isAdultPose(pose));
      const lines = catalogue.lines.filter(line => showAdult || !ADULT_POSE_LINES.has(line.key));
      const counts = new Map<string, number>();

      for (const pose of catalogue.poses) if (showAdult || !isAdultPose(pose)) counts.set(pose.line, (counts.get(pose.line) ?? 0) + 1);

      return {
        source: visible as LibraryItem[],
        groups: [...(mine.length ? [{ key: MINE, name: 'My poses', count: visible.filter(pose => pose.uid.startsWith('m:')).length }] : []), ...lines.map(line => ({ key: line.key, name: line.name, count: counts.get(line.key) ?? 0 }))]
      };
    }

    if (kind === 'costumes') {
      const visible = catalogue.costumes.filter(costume => showAdult || !isAdultCostume(costume));
      const counts = new Map<string, number>();

      for (const costume of visible) counts.set(costume.cat, (counts.get(costume.cat) ?? 0) + 1);

      return {
        source: visible as LibraryItem[],
        groups: catalogue.categories.filter(category => showAdult || !ADULT_COSTUME_CATEGORIES.has(category.key)).map(category => ({ key: category.key, name: category.name, count: counts.get(category.key) ?? 0 }))
      };
    }

    return { source: [] as LibraryItem[], groups: [] as PickerGroup[] };
  }, [kind, catalogue, showAdult, myPoses]);

  const found = useMemo(() => {
    const inGroup = group === null ? source : source.filter(item => (isPose(item) ? (group === MINE ? item.uid.startsWith('m:') : !item.uid.startsWith('m:') && item.line === group) : item.cat === group));

    return searchAndSort(inGroup, query, 'number', 1);
  }, [source, group, query]);

  const more = found.length > shown;

  useEffect(() => {
    if (!sentinel || !more) return;

    const observer = new IntersectionObserver(entries => entries.some(entry => entry.isIntersecting) && setShown(count => count + PAGE), { root: scroller.current, rootMargin: '400px' });

    observer.observe(sentinel);

    return () => observer.disconnect();
  }, [sentinel, more, shown]);

  const chooseGroup = useCallback((key: string | null) => setGroup(current => (current === key ? null : key)), []);

  return { query, setQuery, group, chooseGroup, groups, items: found.slice(0, shown), total: found.length, more, scroller, setSentinel, loadMore: () => setShown(count => count + PAGE) };
}
