'use client';

import { useMemo } from 'react';

import { COLLECTIONS, type CollectionKind } from '@/app/(library)/collections/[collection]/content';
import { useLibrary } from '@/hooks/client/useLibrary';
import { isPose, type LibraryItem } from '@/lib/catalogue/types';

export function useCollectionScreen(kind: CollectionKind) {
    const { state, itemByUid } = useLibrary();

    const uids = kind === 'favourites' ? state.favourites : kind === 'recent' ? state.recent : Object.keys(state.rigs);

    const items = useMemo(() => {
        return uids.map((uid) => itemByUid.get(uid)).filter((item): item is LibraryItem => !!item);
    }, [uids, itemByUid]);

    return { title: COLLECTIONS[kind].title, empty: COLLECTIONS[kind].empty, items, showsPoses: items.some(isPose) };
}
