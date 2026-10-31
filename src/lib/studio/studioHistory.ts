import { runInStore } from '@/lib/library/browserDatabase';
import type { GeneratedImage } from '@/lib/studio/types';

export interface SavedResult {
    id: string;
    label: string;
    prompt: string;
    state: 'waiting' | 'done' | 'failed';
    note?: string;
    image?: GeneratedImage;
    error?: string;
    driveFileId?: string;
    driveError?: string;
}

export interface TurnAttachment {
    key: string;
    thumb: string;
    label: string;
}

export interface SavedTurn {
    id: string;
    chatId: string;
    createdAt: string;
    message: string;
    photos: string[];
    attachments: TurnAttachment[];
    details: string;
    services: string;
    results: SavedResult[];
}

export interface StudioHistory {
    chatId: string;
    turns: SavedTurn[];
}

const CHAT_KEY = 'ai-library.studio-chat';
const EMPTY: StudioHistory = { chatId: '', turns: [] };

let history: StudioHistory | null = null;
let loading: Promise<void> | null = null;
const listeners = new Set<() => void>();

function newChatId(): string {
    return crypto.randomUUID();
}

function readChatId(): string {
    try {
        const stored = window.localStorage.getItem(CHAT_KEY);

        if (stored) return stored;

        const created = newChatId();

        window.localStorage.setItem(CHAT_KEY, created);

        return created;
    } catch {
        return newChatId();
    }
}

function notify() {
    for (const listener of listeners) listener();
}

function replace(turns: SavedTurn[], chatId = history?.chatId ?? readChatId()) {
    if (chatId !== history?.chatId) {
        try {
            window.localStorage.setItem(CHAT_KEY, chatId);
        } catch {}
    }
    history = { chatId, turns };
    notify();
}

function persist(turn: SavedTurn) {
    void runInStore('studio-turns', 'readwrite', (store) => store.put(turn)).catch(() => {});
}

function load() {
    loading ??= runInStore('studio-turns', 'readonly', (store) => store.getAll() as IDBRequest<SavedTurn[]>)
        .then((stored) =>
            stored
                .sort((a, b) => a.createdAt.localeCompare(b.createdAt))
                .map((turn) => ({
                    ...turn,
                    results: turn.results.map((result) =>
                        result.state === 'waiting'
                            ? {
                                  ...result,
                                  state: 'failed' as const,
                                  error: 'Stopped because the page was closed or reloaded.'
                              }
                            : result
                    )
                }))
        )
        .catch(() => [] as SavedTurn[])
        .then((turns) =>
            replace([...turns, ...(history?.turns ?? []).filter((turn) => !turns.some((saved) => saved.id === turn.id))], readChatId())
        );
}

export function subscribeHistory(listener: () => void): () => void {
    listeners.add(listener);
    load();

    return () => listeners.delete(listener);
}

export function historySnapshot(): StudioHistory {
    return history ?? EMPTY;
}

export function emptyHistory(): StudioHistory {
    return EMPTY;
}

export function addTurn(turn: Omit<SavedTurn, 'chatId' | 'createdAt'>): SavedTurn {
    const saved: SavedTurn = {
        ...turn,
        chatId: history?.chatId || readChatId(),
        createdAt: new Date().toISOString()
    };

    replace([...(history?.turns ?? []), saved]);
    persist(saved);

    return saved;
}

export function updateResult(resultId: string, change: Partial<SavedResult>) {
    const turns = (history?.turns ?? []).map((turn) =>
        turn.results.some((result) => result.id === resultId)
            ? {
                  ...turn,
                  results: turn.results.map((result) => (result.id === resultId ? { ...result, ...change } : result))
              }
            : turn
    );
    const changed = turns.find((turn) => turn.results.some((result) => result.id === resultId));

    replace(turns);
    if (changed && change.state !== 'waiting') persist(changed);
}

export function deleteResult(resultId: string) {
    const turns = (history?.turns ?? []).map((turn) => ({
        ...turn,
        results: turn.results.filter((result) => result.id !== resultId)
    }));
    const changed = turns.find((turn) =>
        (history?.turns ?? []).some((old) => old.id === turn.id && old.results.length !== turn.results.length)
    );

    replace(turns);
    if (changed) persist(changed);
}

export function startNewChat() {
    const chatId = newChatId();

    try {
        window.localStorage.setItem(CHAT_KEY, chatId);
    } catch {}
    replace(history?.turns ?? [], chatId);
}

export async function clearHistory() {
    await runInStore('studio-turns', 'readwrite', (store) => store.clear());
    replace([]);
}

export function switchChat(chatId: string) {
    try {
        window.localStorage.setItem(CHAT_KEY, chatId);
    } catch {}
    replace(history?.turns ?? [], chatId);
}

export async function deleteChat(chatId: string) {
    const removed = (history?.turns ?? []).filter((turn) => turn.chatId === chatId);

    await Promise.all(removed.map((turn) => runInStore('studio-turns', 'readwrite', (store) => store.delete(turn.id))));
    replace(
        (history?.turns ?? []).filter((turn) => turn.chatId !== chatId),
        history?.chatId === chatId ? newChatId() : history?.chatId
    );
}
