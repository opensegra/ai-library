'use client';

import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useTheme } from 'next-themes';
import { useMemo, useState, useSyncExternalStore } from 'react';
import { toast } from 'sonner';

import { useLibrary } from '@/hooks/client/useLibrary';
import { COLOURS, colourName } from '@/lib/catalogue/facets';
import { buildLibraryExport, isLibraryExport, mergeLibraryExport } from '@/lib/library/libraryExport';
import { ADULT_COSTUME_CATEGORIES, ADULT_POSE_LINES, isAdultCostume, isAdultPose } from '@/lib/studio/adultContent';

export interface SidebarLink {
  href: string;
  label: string;
  count?: number;
  depth?: number;
  icon?: 'pose' | 'costume' | 'star' | 'clock' | 'rig' | 'board' | 'image' | 'studio';
  swatch?: string;
  active: boolean;
}

export interface SidebarSection {
  title: string;
  links: SidebarLink[];
  empty?: string;
}

function countBy<T>(items: T[], key: (item: T) => string): Record<string, number> {
  const counts: Record<string, number> = {};

  for (const item of items) counts[key(item)] = (counts[key(item)] ?? 0) + 1;

  return counts;
}

const subscribeNothing = () => () => {};

export function useLibrarySidebar() {
  const { catalogue, state, itemByUid, createBoard, update } = useLibrary();
  const pathname = usePathname();
  const params = useSearchParams();
  const router = useRouter();
  const { resolvedTheme, setTheme } = useTheme();
  const [boardDialogOpen, setBoardDialogOpen] = useState(false);
  const mounted = useSyncExternalStore(subscribeNothing, () => true, () => false);
  const line = params.get('line');
  const cls = params.get('cls');
  const cat = params.get('cat');
  const colour = params.get('colour');

  const sections = useMemo<SidebarSection[]>(() => {
    const visiblePoses = catalogue.poses.filter(pose => state.showAdult || !isAdultPose(pose));
    const visibleCostumes = catalogue.costumes.filter(costume => state.showAdult || !isAdultCostume(costume));
    const poseCounts = countBy(visiblePoses, pose => pose.line);
    const costumeCounts = countBy(visibleCostumes, costume => costume.cat);
    const colourCounts = countBy(visibleCostumes.flatMap(costume => costume.words.filter(word => word in COLOURS)), word => word);
    const onPoses = pathname === '/poses';
    const onCostumes = pathname === '/costumes';
    const poseLinks: SidebarLink[] = [{ href: '/poses', label: 'All poses', count: visiblePoses.length, icon: 'pose', active: onPoses && !line }];

    for (const group of catalogue.lines.filter(entry => state.showAdult || !ADULT_POSE_LINES.has(entry.key))) {
      poseLinks.push({ href: `/poses?line=${encodeURIComponent(group.key)}`, label: group.name, count: poseCounts[group.key], depth: 1, active: onPoses && line === group.key && !cls });
      if (onPoses && line === group.key) {
        const classes = countBy(catalogue.poses.filter(pose => pose.line === group.key), pose => pose.cls);

        for (const [name, count] of Object.entries(classes))
          poseLinks.push({ href: `/poses?line=${encodeURIComponent(group.key)}&cls=${encodeURIComponent(name)}`, label: name, count, depth: 2, active: cls === name });
      }
    }
    poseLinks.push({ href: '/pose-from-image', label: 'Pose from your image', icon: 'image', active: pathname === '/pose-from-image' });
    poseLinks.push({ href: '/studio', label: 'Studio', icon: 'studio', active: pathname === '/studio' });

    const costumeLinks: SidebarLink[] = [{ href: '/costumes', label: 'All costumes', count: visibleCostumes.length, icon: 'costume', active: onCostumes && !cat && !colour }];

    for (const group of catalogue.categories.filter(entry => state.showAdult || !ADULT_COSTUME_CATEGORIES.has(entry.key)))
      costumeLinks.push({ href: `/costumes?cat=${encodeURIComponent(group.key)}`, label: group.name, count: costumeCounts[group.key], depth: 1, active: onCostumes && cat === group.key });

    const colourLinks: SidebarLink[] = Object.entries(COLOURS)
      .filter(([word]) => colourCounts[word])
      .map(([word, swatch]) => ({ href: `/costumes?colour=${word}`, label: colourName(word), count: colourCounts[word], swatch, active: onCostumes && colour === word }));

    const collectionLinks: SidebarLink[] = [
      { href: '/collections/favourites', label: 'Favourites', count: state.favourites.length, icon: 'star', active: pathname === '/collections/favourites' },
      { href: '/collections/recent', label: 'Recently viewed', count: state.recent.length, icon: 'clock', active: pathname === '/collections/recent' },
      { href: '/collections/rigged', label: 'Rigs saved', count: Object.keys(state.rigs).length, icon: 'rig', active: pathname === '/collections/rigged' }
    ];

    const boardLinks: SidebarLink[] = Object.entries(state.boards).map(([name, uids]) => ({
      href: `/boards/${encodeURIComponent(name)}`,
      label: name,
      count: uids.length,
      icon: 'board',
      active: pathname === `/boards/${encodeURIComponent(name)}`
    }));

    return [
      { title: 'Poses', links: poseLinks },
      { title: 'Costumes', links: costumeLinks },
      { title: 'Colours', links: colourLinks },
      { title: 'Collections', links: collectionLinks },
      { title: 'Boards', links: boardLinks, empty: boardLinks.length ? undefined : 'Collect poses and costumes for one character in a board.' }
    ];
  }, [catalogue, state, pathname, line, cls, cat, colour]);

  const exportLibrary = () => {
    const blob = new Blob([JSON.stringify(buildLibraryExport(state), null, 2)], { type: 'application/json' });
    const link = document.createElement('a');

    link.href = URL.createObjectURL(blob);
    link.download = 'ai-library.json';
    link.click();
    URL.revokeObjectURL(link.href);
  };

  const importLibrary = () => {
    const input = document.createElement('input');

    input.type = 'file';
    input.accept = 'application/json';
    input.onchange = async () => {
      const file = input.files?.[0];

      if (!file) return;

      try {
        const parsed: unknown = JSON.parse(await file.text());

        if (!isLibraryExport(parsed)) throw new Error('not an export');

        update(current => mergeLibraryExport(current, parsed, new Set(itemByUid.keys())));
        toast.success('Library imported.');
      } catch {
        toast.error('That file is not an export from this library.');
      }
    };
    input.click();
  };

  const createAndOpenBoard = (name: string) => {
    if (!createBoard(name)) return;

    setBoardDialogOpen(false);
    router.push(`/boards/${encodeURIComponent(name.trim())}`);
  };

  return {
    sections,
    boardDialogOpen,
    setBoardDialogOpen,
    createBoard: createAndOpenBoard,
    exportLibrary,
    importLibrary,
    theme: mounted ? resolvedTheme : undefined,
    showAdult: state.showAdult,
    setShowAdult: (showAdult: boolean) => update(current => ({ ...current, showAdult })),
    toggleTheme: () => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')
  };
}
