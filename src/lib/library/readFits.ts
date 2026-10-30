import { readFile } from 'node:fs/promises';
import path from 'node:path';

import { setFitData } from '@/lib/fitting/autofit';

const FIT_FILES = path.join(process.cwd(), 'data', 'fits');

let loading: Promise<void> | null = null;

export function ensureFitData(): Promise<void> {
  loading ??= Promise.all([readFile(path.join(FIT_FILES, 'autofit.json'), 'utf8'), readFile(path.join(FIT_FILES, 'dwfit.json'), 'utf8')]).then(
    ([autofit, dwfit]) => setFitData(JSON.parse(autofit), JSON.parse(dwfit))
  );

  return loading;
}
