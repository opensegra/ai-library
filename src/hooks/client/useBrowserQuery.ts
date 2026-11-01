'use client';

import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useCallback, useMemo } from 'react';

export interface BrowserQuery {
    read: (key: string) => string | null;
    readList: (key: string) => string[];
    write: (changes: Record<string, string | string[] | null>) => void;
}

export function useBrowserQuery(): BrowserQuery {
    const params = useSearchParams();
    const search = params.toString();
    const values = useMemo(() => new URLSearchParams(search), [search]);
    const router = useRouter();
    const pathname = usePathname();

    const read = useCallback((key: string) => values.get(key), [values]);
    const readList = useCallback((key: string) => (values.get(key) ?? '').split(',').filter(Boolean), [values]);

    const write = useCallback(
        (changes: Record<string, string | string[] | null>) => {
            const next = new URLSearchParams(search);

            for (const [key, value] of Object.entries(changes)) {
                const text = Array.isArray(value) ? value.join(',') : value;

                if (text) next.set(key, text);
                else next.delete(key);
            }

            const query = next.toString();
            if (query === search) return;

            router.replace(query ? `${pathname}?${query}` : pathname, {
                scroll: false
            });
        },
        [pathname, router, search]
    );

    return { read, readList, write };
}
