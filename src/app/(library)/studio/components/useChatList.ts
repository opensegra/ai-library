'use client';

import { useState } from 'react';

export function useChatList(onDelete: (chatId: string) => void) {
  const [confirming, setConfirming] = useState<string | null>(null);

  const remove = (chatId: string) => {
    if (confirming !== chatId) {
      setConfirming(chatId);
      return;
    }

    setConfirming(null);
    onDelete(chatId);
  };

  return { confirming, remove };
}
