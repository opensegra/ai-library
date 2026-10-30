export type CollectionKind = 'favourites' | 'recent' | 'rigged';

export const COLLECTIONS: Record<CollectionKind, { title: string; empty: string }> = {
  favourites: { title: 'Favourites', empty: 'Star a pose or costume to keep it here.' },
  recent: { title: 'Recently viewed', empty: 'Poses and costumes you open appear here.' },
  rigged: { title: 'Rigs saved', empty: 'Save a pose from the 3D rig viewer to keep your edits here.' }
};
