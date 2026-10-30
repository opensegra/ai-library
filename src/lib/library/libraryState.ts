export interface ImageAdjustments {
  flip: boolean;
  invert: boolean;
  contrast: number;
  tint: number;
}

export interface FigurePlacement {
  at: number[];
  rot: Record<string, number[]>;
}

export interface SavedRig {
  figures: FigurePlacement[];
  savedAt: string;
}

export interface LibraryState {
  favourites: string[];
  recent: string[];
  boards: Record<string, string[]>;
  rigs: Record<string, SavedRig>;
  cellSize: number;
  adjustments: ImageAdjustments;
  showAdult: boolean;
}

export const STORAGE_KEY = 'ai-library.v1';

export const EMPTY_LIBRARY: LibraryState = {
  favourites: [],
  recent: [],
  boards: {},
  rigs: {},
  cellSize: 168,
  adjustments: { flip: false, invert: false, contrast: 1, tint: 0 },
  showAdult: true
};

export function readLibraryState(): LibraryState {
  try {
    const stored = JSON.parse(window.localStorage.getItem(STORAGE_KEY) ?? 'null') as Partial<LibraryState> | null;

    return { ...EMPTY_LIBRARY, ...stored, adjustments: { ...EMPTY_LIBRARY.adjustments, ...stored?.adjustments } };
  } catch {
    return EMPTY_LIBRARY;
  }
}

export function writeLibraryState(state: LibraryState): boolean {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));

    return true;
  } catch {
    return false;
  }
}

export function imageFilter(adjustments: ImageAdjustments): string {
  const parts: string[] = [];

  if (adjustments.invert) parts.push('invert(1)');
  if (adjustments.contrast !== 1) parts.push(`contrast(${adjustments.contrast})`);
  if (adjustments.tint) parts.push(`sepia(1) saturate(2.2) hue-rotate(${adjustments.tint}deg)`);

  return parts.join(' ') || 'none';
}
