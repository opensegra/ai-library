import { readFile } from 'node:fs/promises';
import path from 'node:path';

import type { Catalogue } from '@/lib/catalogue/types';

const CATALOGUE_FILE = path.join(process.cwd(), 'data', 'catalogue.json');

function withMediaBase(catalogue: Catalogue, base: string): Catalogue {
  if (!base) return catalogue;

  const url = (file: string) => `${base}${file}`;

  return {
    ...catalogue,
    poses: catalogue.poses.map(pose => ({
      ...pose,
      images: Object.fromEntries(Object.entries(pose.images).map(([angle, image]) => [angle, { thumb: url(image.thumb), full: url(image.full) }]))
    })),
    costumes: catalogue.costumes.map(costume => ({ ...costume, thumb: url(costume.thumb), mid: url(costume.mid), full: url(costume.full) }))
  };
}

export async function readCatalogue(): Promise<Catalogue> {
  'use cache';

  const text = await readFile(CATALOGUE_FILE, 'utf8');

  return withMediaBase(JSON.parse(text) as Catalogue, (process.env.NEXT_PUBLIC_MEDIA_BASE_URL ?? '').replace(/\/$/, ''));
}
