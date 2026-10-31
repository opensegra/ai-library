'use client';

import { useBrowserQuery } from '@/hooks/client/useBrowserQuery';
import { useLibrary } from '@/hooks/client/useLibrary';
import { filterPoses } from '@/lib/catalogue/filterItems';
import { groupBySlug, groupSlug } from '@/lib/catalogue/groupSlug';
import { isAdultPose } from '@/lib/studio/adultContent';
import { useEffect, useMemo } from 'react';

export function usePosesScreen() {
    const { catalogue, state } = useLibrary();
    const { read, write } = useBrowserQuery();

    const group = groupBySlug(catalogue.lines, read('line'));
    const line = group?.key ?? null;
    const cls = read('cls');

    const poses = useMemo(
        () => filterPoses(catalogue.poses, { line, cls }).filter((pose) => state.showAdult || !isAdultPose(pose)),
        [catalogue.poses, line, cls, state.showAdult]
    );

    const written = read('line');

    useEffect(() => {
        if (group && written !== groupSlug(group)) write({ line: groupSlug(group) });
    }, [group, written, write]);

    const title = group ? `${group.name}${cls ? ` · ${cls}` : ''}` : 'All poses';

    return { title, poses };
}
