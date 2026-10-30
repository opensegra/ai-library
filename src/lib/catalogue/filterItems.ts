import { type Costume, isPose, type LibraryItem, type Pose } from '@/lib/catalogue/types';

export type SortOrder = 'number' | 'name' | 'shuffle';

export interface PoseFilter {
  line: string | null;
  cls: string | null;
}

export interface CostumeFilter {
  cat: string | null;
  colour: string | null;
  words: string[];
}

function queryTerms(query: string): string[] {
  return query.trim().toLowerCase().split(/\s+/).filter(Boolean);
}

function haystack(item: LibraryItem): string {
  if (isPose(item)) return `${item.code} ${item.name} ${item.cls} ${item.lineName}`.toLowerCase();

  return `${item.id} ${item.words.join(' ')} ${item.catName}`.toLowerCase();
}

function seededRandom(seed: number): () => number {
  let state = seed >>> 0;

  return () => {
    state = (state * 1664525 + 1013904223) >>> 0;

    return state / 4294967296;
  };
}

export function filterPoses(poses: Pose[], filter: PoseFilter): Pose[] {
  return poses.filter(pose => (!filter.line || pose.line === filter.line) && (!filter.cls || pose.cls === filter.cls));
}

export function filterCostumes(costumes: Costume[], filter: CostumeFilter): Costume[] {
  return costumes.filter(
    costume =>
      (!filter.cat || costume.cat === filter.cat) &&
      (!filter.colour || costume.words.includes(filter.colour)) &&
      filter.words.every(word => costume.words.includes(word))
  );
}

export function searchAndSort<T extends LibraryItem>(items: T[], query: string, order: SortOrder, seed: number): T[] {
  const terms = queryTerms(query);
  const matched = terms.length ? items.filter(item => terms.every(term => haystack(item).includes(term))) : items;

  if (order === 'name') return [...matched].sort((a, b) => haystack(a).localeCompare(haystack(b), 'en'));
  if (order === 'shuffle') {
    const random = seededRandom(seed);

    return matched.map(item => [random(), item] as const).sort((a, b) => a[0] - b[0]).map(pair => pair[1]);
  }

  return matched;
}

export function similarCostumes(costume: Costume, costumes: Costume[], count: number): Costume[] {
  const own = new Set(costume.words);

  return costumes
    .filter(other => other !== costume)
    .map(other => ({ other, shared: other.words.filter(word => own.has(word)).length }))
    .sort((a, b) => b.shared - a.shared)
    .slice(0, count)
    .map(entry => entry.other);
}
