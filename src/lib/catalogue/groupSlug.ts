import type { CatalogueGroup } from '@/lib/catalogue/types';

export function groupSlug(group: CatalogueGroup): string {
    return group.name.toLowerCase().replace(/\s+/g, '-');
}

export function groupBySlug(groups: CatalogueGroup[], slug: string | null): CatalogueGroup | null {
    if (!slug) return null;

    return groups.find((group) => groupSlug(group) === slug.toLowerCase() || group.key === slug) ?? null;
}
