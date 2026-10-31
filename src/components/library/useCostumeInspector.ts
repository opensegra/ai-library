'use client';

import { useLibrary } from '@/hooks/client/useLibrary';
import { useStudio } from '@/hooks/client/useStudio';
import { similarCostumes } from '@/lib/catalogue/filterItems';
import type { Costume } from '@/lib/catalogue/types';
import { useMemo } from 'react';

export function useCostumeInspector(costume: Costume) {
    const { catalogue, state, toggleFavourite } = useLibrary();
    const { selection, setCostume } = useStudio();
    const inStudio = selection.costume === costume.uid;
    const similar = useMemo(() => similarCostumes(costume, catalogue.costumes, 6), [costume, catalogue.costumes]);

    return {
        favourite: state.favourites.includes(costume.uid),
        toggleFavourite: () => toggleFavourite(costume.uid),
        similar,
        inStudio,
        toggleStudio: () => setCostume(inStudio ? null : costume.uid)
    };
}
