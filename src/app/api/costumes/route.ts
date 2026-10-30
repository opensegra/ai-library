import { readCatalogue } from '@/lib/catalogue/readCatalogue';
import { costumePrompt } from '@/lib/catalogue/describeCostume';
import { filterCostumes, searchAndSort } from '@/lib/catalogue/filterItems';
import { isAdultCostume } from '@/lib/studio/adultContent';

export async function GET(request: Request) {
  const params = new URL(request.url).searchParams;
  const catalogue = await readCatalogue();
  const cat = catalogue.categories.find(group => group.name.toLowerCase() === params.get('category')?.toLowerCase())?.key ?? null;
  const costumes = searchAndSort(filterCostumes(catalogue.costumes, { cat, colour: params.get('colour'), words: [] }), params.get('q') ?? '', 'number', 1).filter(costume => params.get('include_adult') === 'true' || !isAdultCostume(costume));
  const limit = Math.min(100, Math.max(1, Number(params.get('limit') ?? 20)));

  return Response.json({ total: costumes.length, costumes: costumes.slice(0, limit).map(costume => ({ id: costume.id, category: costume.catName, words: costume.words, prompt: costumePrompt(costume), thumb: costume.thumb, image: costume.mid })) });
}
