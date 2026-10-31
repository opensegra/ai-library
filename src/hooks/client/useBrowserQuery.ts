'use client';

import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useCallback } from 'react';

export interface BrowserQuery {
    read: (key: string) => string | null;
    readList: (key: string) => string[];
    write: (changes: Record<string, string | string[] | null>) => void;
}

export function useBrowserQuery(): BrowserQuery {
    const params = useSearchParams();
    const router = useRouter();
    const pathname = usePathname();

    const read = useCallback((key: string) => params.get(key), [params]);
    const readList = useCallback((key: string) => (params.get(key) ?? '').split(',').filter(Boolean), [params]);

    const write = useCallback(
        (changes: Record<string, string | string[] | null>) => {
            const next = new URLSearchParams(params.toString());

            for (const [key, value] of Object.entries(changes)) {
                const text = Array.isArray(value) ? value.join(',') : value;

                if (text) next.set(key, text);
                else next.delete(key);
            }

            const query = next.toString();

            router.replace(query ? `${pathname}?${query}` : pathname, {
                scroll: false
            });
        },
        [params, pathname, router]
    );

    return { read, readList, write };
}
