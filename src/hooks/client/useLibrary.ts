'use client';

import { LibraryContext } from '@/components/library/LibraryProvider';
import type { LibraryContextValue } from '@/components/library/useLibraryProvider';
import { useContext } from 'react';

export function useLibrary(): LibraryContextValue {
    const value = useContext(LibraryContext);

    if (!value) throw new Error('useLibrary must be used inside LibraryProvider');

    return value;
}
