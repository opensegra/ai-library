'use client';

import { useMediaQuery } from '@/hooks/client/useMediaQuery';

export function useItemInspector() {
  return { narrow: !useMediaQuery('(min-width: 768px)') };
}
