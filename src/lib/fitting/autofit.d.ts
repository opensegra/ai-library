import type { FigurePlacement } from '@/lib/library/libraryState';
import type { Pose } from '@/lib/catalogue/types';

export interface ViewCamera {
    yaw: number;
    pitch: number;
}

export interface PoseFit {
    figures: FigurePlacement[];
    fitted: boolean;
    start?: string;
    cams: Record<string, ViewCamera>;
    source: 'auto' | 'stock' | 'edited';
    version?: number;
    approx: boolean;
    props: Record<string, number | null> | null;
}

export function setFitData(autofit: unknown, dwfit: unknown): void;
export function autoFit(pose: Pose): PoseFit | null;
export function startFigures(pose: Pose, name?: string): FigurePlacement[];
export function startPreset(pose: Pose): string;
export function rigFromLandmarks(world: number[][]): Record<string, number[]>;
export function figuresFromEntry(entry: unknown): FigurePlacement[];
export const FIT_VERSION: number;
