export interface PoseImage {
    thumb: string;
    full: string;
}

export interface Pose {
    uid: string;
    key: string;
    code: string;
    line: string;
    lineName: string;
    jcls: string;
    cls: string;
    name: string;
    images: Record<string, PoseImage>;
    posture?: string[];
}

export interface Costume {
    uid: string;
    id: string;
    cat: string;
    catName: string;
    words: string[];
    thumb: string;
    mid: string;
    full: string;
}

export interface CatalogueGroup {
    key: string;
    code: string;
    name: string;
}

export interface Catalogue {
    lines: CatalogueGroup[];
    categories: CatalogueGroup[];
    poses: Pose[];
    costumes: Costume[];
}

export type LibraryItem = Pose | Costume;

export function isPose(item: LibraryItem): item is Pose {
    return 'code' in item;
}

export function itemLabel(item: LibraryItem): string {
    return isPose(item) ? item.code : item.id;
}

export function itemTitle(item: LibraryItem): string {
    return isPose(item) ? item.name : item.words.join(' ');
}
