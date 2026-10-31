'use client';

import { useLibrary } from '@/hooks/client/useLibrary';
import { isPose, type LibraryItem } from '@/lib/catalogue/types';
import { useMemo } from 'react';

export function useBoardScreen(board: string) {
    const { state, itemByUid } = useLibrary();
    const uids = state.boards[board];

    const items = useMemo(
        () => (uids ?? []).map((uid) => itemByUid.get(uid)).filter((item): item is LibraryItem => !!item),
        [uids, itemByUid]
    );

    return {
        items,
        showsPoses: items.some(isPose),
        exists: !!uids
    };
}
