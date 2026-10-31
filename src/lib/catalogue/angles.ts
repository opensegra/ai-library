export interface ViewAngle {
    jp: string;
    en: string;
    k: string;
    yaw: number;
    pitch: number;
}

export const ANGLES: ViewAngle[] = [
    { jp: '正面', en: 'Front', k: '1', yaw: 0, pitch: 0 },
    { jp: '上から', en: 'Above', k: '2', yaw: 0, pitch: 40 },
    { jp: '下から', en: 'Below', k: '3', yaw: 0, pitch: -25 },
    { jp: '横', en: 'Side', k: '4', yaw: 90, pitch: 0 },
    { jp: '斜め', en: 'Diagonal', k: '5', yaw: 35, pitch: 8 }
];

export function angleName(jp: string): string {
    return ANGLES.find((angle) => angle.jp === jp)?.en ?? jp;
}

export function angleSlug(jp: string): string {
    return angleName(jp).toLowerCase();
}

export function angleFromSlug(slug: string | null): string | null {
    return ANGLES.find((angle) => angle.en.toLowerCase() === slug?.toLowerCase() || angle.jp === slug)?.jp ?? null;
}
