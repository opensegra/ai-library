'use client';

import { useLibrary } from '@/hooks/client/useLibrary';
import { EMPTY_LIBRARY, type ImageAdjustments } from '@/lib/library/libraryState';
import { useEffect, useState } from 'react';

export function useBrowserToolbar(query: string, onQuery: (value: string) => void) {
    const { state, update } = useLibrary();
    const [draft, setDraft] = useState(query);
    const [syncedQuery, setSyncedQuery] = useState(query);

    if (query !== syncedQuery) {
        setSyncedQuery(query);
        setDraft(query);
    }

    useEffect(() => {
        if (draft === query) return;

        const timer = window.setTimeout(() => onQuery(draft), 220);

        return () => window.clearTimeout(timer);
    }, [draft, query, onQuery]);

    return {
        draft,
        setDraft,
        adjustments: state.adjustments,
        cellSize: state.cellSize,
        setCellSize: (cellSize: number) => update((current) => ({ ...current, cellSize })),
        setAdjustment: (change: Partial<ImageAdjustments>) =>
            update((current) => ({ ...current, adjustments: { ...current.adjustments, ...change } })),
        resetView: () =>
            update((current) => ({
                ...current,
                cellSize: EMPTY_LIBRARY.cellSize,
                adjustments: { ...EMPTY_LIBRARY.adjustments }
            }))
    };
}
