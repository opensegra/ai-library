import type { LibraryState } from '@/lib/library/libraryState';

export interface LibraryExport {
  app: 'ai-library';
  version: 1;
  exported: string;
  favourites: string[];
  boards: Record<string, string[]>;
  rigs: LibraryState['rigs'];
}

export function buildLibraryExport(state: LibraryState): LibraryExport {
  return { app: 'ai-library', version: 1, exported: new Date().toISOString(), favourites: state.favourites, boards: state.boards, rigs: state.rigs };
}

export function mergeLibraryExport(state: LibraryState, incoming: LibraryExport, knownUids: Set<string>): LibraryState {
  const keep = (uids: string[]) => uids.filter(uid => knownUids.has(uid));
  const boards = { ...state.boards };

  for (const [name, uids] of Object.entries(incoming.boards ?? {})) boards[name] = [...new Set([...(boards[name] ?? []), ...keep(uids)])];

  return {
    ...state,
    favourites: [...new Set([...state.favourites, ...keep(incoming.favourites ?? [])])],
    boards,
    rigs: { ...state.rigs, ...incoming.rigs }
  };
}

export function isLibraryExport(value: unknown): value is LibraryExport {
  return typeof value === 'object' && value !== null && (value as LibraryExport).app === 'ai-library';
}
