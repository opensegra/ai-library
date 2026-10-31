'use client';

import { useLibrary } from '@/hooks/client/useLibrary';
import type { LibraryItem } from '@/lib/catalogue/types';
import { useMemo } from 'react';

export function useCompareDialog(uids: string[]) {
    const { itemByUid } = useLibrary();
    const items = useMemo(() => uids.map((uid) => itemByUid.get(uid)).filter((item): item is LibraryItem => !!item), [uids, itemByUid]);

    return { items };
}
