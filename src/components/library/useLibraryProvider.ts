'use client';

import { useCallback, useMemo, useSyncExternalStore } from 'react';
import { toast } from 'sonner';

import type { Catalogue, LibraryItem } from '@/lib/catalogue/types';
import type { LibraryState } from '@/lib/library/libraryState';
import { changeLibrary, librarySnapshot, serverLibrarySnapshot, subscribeLibrary } from '@/lib/library/libraryStore';

export interface LibraryContextValue {
  catalogue: Catalogue;
  itemByUid: Map<string, LibraryItem>;
  state: LibraryState;
  ready: boolean;
  update: (change: (state: LibraryState) => LibraryState) => void;
  toggleFavourite: (uid: string) => void;
  touchRecent: (uid: string) => void;
  toggleBoardItem: (board: string, uid: string) => void;
  createBoard: (board: string) => boolean;
}

export function useLibraryProvider(catalogue: Catalogue): LibraryContextValue {
  const state = useSyncExternalStore(subscribeLibrary, librarySnapshot, serverLibrarySnapshot);
  const ready = useSyncExternalStore(subscribeLibrary, () => true, () => false);
  const itemByUid = useMemo(() => new Map<string, LibraryItem>([...catalogue.poses, ...catalogue.costumes].map(item => [item.uid, item])), [catalogue]);

  const update = useCallback((change: (state: LibraryState) => LibraryState) => {
    if (!changeLibrary(change)) toast.error('This browser refused to save. Export the library to keep your work.');
  }, []);

  const toggleFavourite = useCallback(
    (uid: string) =>
      update(current => ({ ...current, favourites: current.favourites.includes(uid) ? current.favourites.filter(entry => entry !== uid) : [uid, ...current.favourites] })),
    [update]
  );

  const touchRecent = useCallback((uid: string) => update(current => ({ ...current, recent: [uid, ...current.recent.filter(entry => entry !== uid)].slice(0, 60) })), [update]);

  const toggleBoardItem = useCallback(
    (board: string, uid: string) =>
      update(current => {
        const items = current.boards[board] ?? [];

        return { ...current, boards: { ...current.boards, [board]: items.includes(uid) ? items.filter(entry => entry !== uid) : [...items, uid] } };
      }),
    [update]
  );

  const createBoard = useCallback(
    (board: string) => {
      const name = board.trim();

      if (!name) return false;

      update(current => (current.boards[name] ? current : { ...current, boards: { ...current.boards, [name]: [] } }));

      return true;
    },
    [update]
  );

  return { catalogue, itemByUid, state, ready, update, toggleFavourite, touchRecent, toggleBoardItem, createBoard };
}
