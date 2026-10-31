'use client';

import { FACET_GROUPS } from '@/lib/catalogue/facets';
import { useState } from 'react';

const GROUPS = Object.keys(FACET_GROUPS);

export function useCostumeFacets(counts: Record<string, number>, active: string[]) {
    const [group, setGroup] = useState(GROUPS[0]);
    const words = FACET_GROUPS[group].filter((word) => counts[word] && !active.includes(word));

    return { groups: GROUPS, group, setGroup, words };
}
