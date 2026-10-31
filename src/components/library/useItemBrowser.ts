'use client';

import { useBrowserQuery } from '@/hooks/client/useBrowserQuery';
import { useLibrary } from '@/hooks/client/useLibrary';
import { angleFromSlug, ANGLES, angleSlug } from '@/lib/catalogue/angles';
import { searchAndSort, type SortOrder } from '@/lib/catalogue/filterItems';
import { isPose, type LibraryItem } from '@/lib/catalogue/types';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';

export function useItemBrowser(items: LibraryItem[]) {
    const { read, write } = useBrowserQuery();
    const { touchRecent } = useLibrary();

    const [compare, setCompare] = useState<string[]>([]);
    const [zoomOpen, setZoomOpen] = useState(false);
    const [compareOpen, setCompareOpen] = useState(false);
    const [picked, setPicked] = useState<{ uid: string; angle: string } | null>(null);

    const query = read('q') ?? '';
    const sort = (read('sort') as SortOrder | null) ?? 'number';
    const seed = Number(read('seed') ?? 1);
    const writtenAngle = read('angle');
    const selectedUid = read('item');

    const angle = angleFromSlug(writtenAngle) ?? ANGLES[0].jp;

    const list = useMemo(() => searchAndSort(items, query, sort, seed), [items, query, sort, seed]);
    const selected = useMemo(() => items.find((item) => item.uid === selectedUid) ?? null, [items, selectedUid]);

    const selectedAngle =
        selected && isPose(selected)
            ? picked?.uid === selected.uid && selected.images[picked.angle]
                ? picked.angle
                : selected.images[angle]
                  ? angle
                  : Object.keys(selected.images)[0]
            : angle;

    const setSelectedAngle = useCallback((value: string) => setPicked(selected ? { uid: selected.uid, angle: value } : null), [selected]);

    const select = useCallback(
        (item: LibraryItem) => {
            write({ item: item.uid });
            touchRecent(item.uid);
        },
        [write, touchRecent]
    );

    const toggleCompare = useCallback((uid: string) => {
        setCompare((current) => {
            if (current.includes(uid)) return current.filter((entry) => entry !== uid);
            if (current.length >= 4) {
                toast.info('Compare holds four items. Untick one first.');

                return current;
            }

            return [...current, uid];
        });
    }, []);

    useEffect(() => {
        if (writtenAngle && writtenAngle !== angleSlug(angle)) write({ angle: angle === ANGLES[0].jp ? null : angleSlug(angle) });
    }, [angle, writtenAngle, write]);

    useEffect(() => {
        const onKey = (event: KeyboardEvent) => {
            const target = event.target as HTMLElement | null;

            if (target?.closest('input, textarea, select, [contenteditable]')) return;

            const match = ANGLES.find((entry) => entry.k === event.key);

            if (match && selected && isPose(selected) && selected.images[match.jp]) setSelectedAngle(match.jp);
        };

        window.addEventListener('keydown', onKey);

        return () => window.removeEventListener('keydown', onKey);
    }, [selected, setSelectedAngle]);

    return {
        list,
        query,
        sort,
        angle,
        selected,
        selectedAngle,
        setSelectedAngle,
        compare,
        zoomOpen,
        setZoomOpen,
        compareOpen,
        setCompareOpen,
        select,
        toggleCompare,
        closeInspector: () => write({ item: null }),
        setQuery: (value: string) => write({ q: value || null }),
        setSort: (value: SortOrder) =>
            write({ sort: value === 'number' ? null : value, seed: value === 'shuffle' ? String(Math.floor(Math.random() * 1e9)) : null }),
        setAngle: (value: string) => write({ angle: value === ANGLES[0].jp ? null : angleSlug(value) }),
        openCompare: () => (compare.length >= 2 ? setCompareOpen(true) : toast.info('Tick two to four items to compare them.'))
    };
}
