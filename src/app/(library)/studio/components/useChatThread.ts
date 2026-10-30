'use client';

import { useEffect, useRef } from 'react';

export function useChatThread(turnCount: number) {
  const end = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (turnCount) end.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [turnCount]);

  return end;
}
