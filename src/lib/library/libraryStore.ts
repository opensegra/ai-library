import { EMPTY_LIBRARY, type LibraryState, readLibraryState, writeLibraryState } from '@/lib/library/libraryState';

let current: LibraryState | null = null;
const listeners = new Set<() => void>();

export function subscribeLibrary(listener: () => void): () => void {
  listeners.add(listener);

  return () => listeners.delete(listener);
}

export function librarySnapshot(): LibraryState {
  current ??= readLibraryState();

  return current;
}

export function serverLibrarySnapshot(): LibraryState {
  return EMPTY_LIBRARY;
}

export function changeLibrary(change: (state: LibraryState) => LibraryState): boolean {
  current = change(librarySnapshot());

  const saved = writeLibraryState(current);

  for (const listener of listeners) listener();

  return saved;
}
