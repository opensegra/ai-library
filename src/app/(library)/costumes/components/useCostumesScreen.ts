'use client';

import { useBrowserQuery } from '@/hooks/client/useBrowserQuery';
import { useLibrary } from '@/hooks/client/useLibrary';
import { colourName } from '@/lib/catalogue/facets';
import { filterCostumes } from '@/lib/catalogue/filterItems';
import { groupBySlug, groupSlug } from '@/lib/catalogue/groupSlug';
import { isAdultCostume } from '@/lib/studio/adultContent';
import { useEffect, useMemo } from 'react';

export function useCostumesScreen() {
    const { catalogue, state } = useLibrary();
    const { read, readList, write } = useBrowserQuery();

    const group = groupBySlug(catalogue.categories, read('cat'));
    const cat = group?.key ?? null;

    const colour = read('colour');
    const wordsKey = read('words') ?? '';
    const written = read('cat');

    const words = useMemo(() => wordsKey.split(',').filter(Boolean), [wordsKey]);

    const costumes = useMemo(
        () => filterCostumes(catalogue.costumes, { cat, colour, words }).filter((costume) => state.showAdult || !isAdultCostume(costume)),
        [catalogue.costumes, cat, colour, words, state.showAdult]
    );

    const facetCounts = useMemo(() => {
        const counts: Record<string, number> = {};

        for (const costume of costumes) for (const word of costume.words) counts[word] = (counts[word] ?? 0) + 1;

        return counts;
    }, [costumes]);

    useEffect(() => {
        if (group && written !== groupSlug(group)) write({ cat: groupSlug(group) });
    }, [group, written, write]);

    const title = [group?.name ?? (colour ? null : 'All costumes'), colour ? colourName(colour) : null].filter(Boolean).join(' · ');

    const toggleWord = (word: string) => {
        const current = readList('words');

        write({ words: current.includes(word) ? current.filter((entry) => entry !== word) : [...current, word] });
    };

    return {
        title,
        costumes,
        facetCounts,
        words,
        toggleWord
    };
}
