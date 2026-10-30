import type { FigurePlacement } from '@/lib/library/libraryState';

export interface RigImage {
  label: string;
  jp: string;
  url: string;
  yaw: number;
  pitch: number;
}

export interface RigOpenOptions {
  code: string;
  title: string;
  figures: FigurePlacement[];
  source: string;
  images: RigImage[];
  imageIndex: number;
  position: string;
  framing: 'upper' | 'full';
  proportions: Record<string, number | null> | null;
  onStep: ((direction: number, imageJp: string) => void) | null;
  onSave?: (figures: FigurePlacement[]) => void;
  onRefit?: () => FigurePlacement[] | null;
  onStudio?: (image: string, depth: string) => void;
  onCreate?: (views: RigView[], figures: FigurePlacement[]) => void;
}

export interface RigView {
  jp: string;
  label: string;
  yaw: number;
  pitch: number;
  full: string;
  depth: string;
}

export const RigViewer: {
  open(options: RigOpenOptions): Promise<void>;
  close(): void;
  fromImage(): void;
};
