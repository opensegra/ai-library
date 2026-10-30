'use client';

import { useState } from 'react';
import { toast } from 'sonner';

import { copyText } from '@/lib/copyText';

export function usePromptBlock(text: string) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    if (!(await copyText(text))) {
      toast.error('The browser blocked copying.');
      return;
    }

    setCopied(true);
    toast.success('Prompt copied.');
    window.setTimeout(() => setCopied(false), 1500);
  };

  return { copied, copy };
}
