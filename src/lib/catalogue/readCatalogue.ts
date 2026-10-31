import { readPostures } from '@/lib/catalogue/readPostures';
import type { Catalogue } from '@/lib/catalogue/types';
import { readFile } from 'node:fs/promises';
import path from 'node:path';

const CATALOGUE_FILE = path.join(process.cwd(), 'data', 'catalogue.json');

function withMediaBase(catalogue: Catalogue, base: string): Catalogue {
    if (!base) return catalogue;

    const url = (file: string) => `${base}${file}`;

    return {
        ...catalogue,
        poses: catalogue.poses.map((pose) => ({
            ...pose,
            images: Object.fromEntries(
                Object.entries(pose.images).map(([angle, image]) => [angle, { thumb: url(image.thumb), full: url(image.full) }])
            )
        })),
        costumes: catalogue.costumes.map((costume) => ({
            ...costume,
            thumb: url(costume.thumb),
            mid: url(costume.mid),
            full: url(costume.full)
        }))
    };
}

export async function readCatalogue(): Promise<Catalogue> {
    'use cache';

    const catalogue = JSON.parse(await readFile(CATALOGUE_FILE, 'utf8')) as Catalogue;
    const postures = await readPostures(catalogue.poses);
    const described = {
        ...catalogue,
        poses: catalogue.poses.map((pose) => (postures.has(pose.code) ? { ...pose, posture: postures.get(pose.code) } : pose))
    };

    return withMediaBase(described, (process.env.NEXT_PUBLIC_MEDIA_BASE_URL ?? '').replace(/\/$/, ''));
}
