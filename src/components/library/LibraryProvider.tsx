'use client';

import { createContext, type ReactNode } from 'react';

import { type LibraryContextValue, useLibraryProvider } from '@/components/library/useLibraryProvider';
import type { Catalogue } from '@/lib/catalogue/types';

export const LibraryContext = createContext<LibraryContextValue | null>(null);

interface LibraryProviderProps {
  catalogue: Catalogue;
  children: ReactNode;
}

export function LibraryProvider({ catalogue, children }: LibraryProviderProps) {
  const value = useLibraryProvider(catalogue);

  return <LibraryContext.Provider value={value}>{children}</LibraryContext.Provider>;
}
