import type { Pose } from '@/lib/catalogue/types';
import { runInStore } from '@/lib/library/browserDatabase';
import type { FigurePlacement } from '@/lib/library/libraryState';

export interface MyPoseView {
    jp: string;
    label: string;
    yaw: number;
    pitch: number;
    full: string;
    depth: string;
}

export interface MyPose {
    id: string;
    code: string;
    name: string;
    createdAt: string;
    framing: 'upper' | 'full';
    basedOn: {
        uid: string;
        code: string;
        name: string;
        line: string;
        cls: string;
    };
    figures: FigurePlacement[];
    views: MyPoseView[];
}

const EMPTY: MyPose[] = [];

let poses: MyPose[] | null = null;
let loading: Promise<void> | null = null;
const listeners = new Set<() => void>();

function run<T>(mode: IDBTransactionMode, work: (store: IDBObjectStore) => IDBRequest<T>): Promise<T> {
    return runInStore('my-poses', mode, work);
}

function notify() {
    for (const listener of listeners) listener();
}

function load() {
    loading ??= run('readonly', (store) => store.getAll() as IDBRequest<MyPose[]>)
        .then((stored) => {
            poses = stored.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
        })
        .catch(() => {
            poses = [];
        })
        .finally(notify);
}

export function subscribeMyPoses(listener: () => void): () => void {
    listeners.add(listener);
    load();

    return () => listeners.delete(listener);
}

export function myPosesSnapshot(): MyPose[] {
    return poses ?? EMPTY;
}

export function emptyMyPoses(): MyPose[] {
    return EMPTY;
}

export async function saveMyPose(pose: MyPose): Promise<void> {
    await run('readwrite', (store) => store.put(pose));
    poses = [pose, ...(poses ?? []).filter((entry) => entry.id !== pose.id)];
    notify();
}

export async function deleteMyPose(id: string): Promise<void> {
    await run('readwrite', (store) => store.delete(id));
    poses = (poses ?? []).filter((entry) => entry.id !== id);
    notify();
}

export function myPoseUid(pose: MyPose): string {
    return `m:${pose.id}`;
}

export function nextMyPoseCode(basedOnCode: string, existing: MyPose[]): string {
    const taken = new Set(existing.map((pose) => pose.code));
    let index = 1;

    while (taken.has(`${basedOnCode}-V${index}`)) index++;

    return `${basedOnCode}-V${index}`;
}

export function myPoseAsPose(pose: MyPose): Pose {
    return {
        uid: myPoseUid(pose),
        key: pose.id,
        code: pose.code,
        line: pose.basedOn.line,
        lineName: 'My poses',
        jcls: '',
        cls: pose.basedOn.cls,
        name: pose.name,
        images: Object.fromEntries(pose.views.map((view) => [view.jp, { thumb: view.full, full: view.full }]))
    };
}
