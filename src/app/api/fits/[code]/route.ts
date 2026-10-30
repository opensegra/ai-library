import { autoFit, startFigures } from '@/lib/fitting/autofit';
import { readCatalogue } from '@/lib/catalogue/readCatalogue';
import { ensureFitData } from '@/lib/library/readFits';

export async function GET(_request: Request, context: RouteContext<'/api/fits/[code]'>) {
  const { code } = await context.params;
  const catalogue = await readCatalogue();
  const pose = catalogue.poses.find(entry => entry.code === code);

  if (!pose) return Response.json({ error: 'Unknown pose' }, { status: 404 });

  await ensureFitData();

  const fit = autoFit(pose);

  if (!fit) return Response.json({ source: 'stock', figures: startFigures(pose), cams: {}, approx: true, props: null });

  return Response.json(fit, { headers: { 'Cache-Control': 'public, max-age=3600' } });
}
