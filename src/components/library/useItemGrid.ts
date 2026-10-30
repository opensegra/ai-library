'use client';

import { type CSSProperties, useEffect, useMemo, useRef, useState } from 'react';

import { useLibrary } from '@/hooks/client/useLibrary';
import type { LibraryItem } from '@/lib/catalogue/types';

const PAGE = 120;

export function useItemGrid(items: LibraryItem[]) {
  const { state } = useLibrary();
  const [count, setCount] = useState(PAGE);
  const [pagedItems, setPagedItems] = useState(items);
  const sentinel = useRef<HTMLDivElement>(null);

  if (items !== pagedItems) {
    setPagedItems(items);
    setCount(PAGE);
  }

  useEffect(() => {
    const node = sentinel.current;

    if (!node) return;

    const observer = new IntersectionObserver(entries => {
      if (entries.some(entry => entry.isIntersecting)) setCount(current => Math.min(items.length, current + PAGE));
    }, { rootMargin: '800px' });

    observer.observe(node);

    return () => observer.disconnect();
  }, [items.length]);

  const gridStyle = useMemo(
    () =>
      ({
        gridTemplateColumns: `repeat(auto-fill, minmax(min(${state.cellSize}px, 44vw), 1fr))`
      }) as CSSProperties,
    [state.cellSize]
  );

  return {
    shown: items.slice(0, count),
    sentinel,
    gridStyle,
    favourites: useMemo(() => new Set(state.favourites), [state.favourites]),
    rigs: useMemo(() => new Set(Object.keys(state.rigs)), [state.rigs])
  };
}
