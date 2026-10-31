const DATABASE = 'ai-library';
const VERSION = 2;

export type BrowserStore = 'my-poses' | 'studio-turns';

let opening: Promise<IDBDatabase> | null = null;

function openDatabase(): Promise<IDBDatabase> {
    opening ??= new Promise((resolve, reject) => {
        const request = indexedDB.open(DATABASE, VERSION);

        request.onupgradeneeded = () => {
            for (const name of ['my-poses', 'studio-turns'])
                if (!request.result.objectStoreNames.contains(name)) request.result.createObjectStore(name, { keyPath: 'id' });
        };
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => {
            opening = null;
            reject(request.error);
        };
    });

    return opening;
}

export async function runInStore<T>(
    store: BrowserStore,
    mode: IDBTransactionMode,
    work: (objects: IDBObjectStore) => IDBRequest<T>
): Promise<T> {
    const database = await openDatabase();

    return new Promise((resolve, reject) => {
        const request = work(database.transaction(store, mode).objectStore(store));

        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
}
