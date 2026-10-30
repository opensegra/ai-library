'use client';

import { useState } from 'react';

export const CUSTOM_MODEL = '__custom__';

export function useModelField(models: string[], value: string, onChange: (model: string) => void) {
  const [picked, setPicked] = useState(false);
  const [listKey, setListKey] = useState(models.join('|'));

  if (listKey !== models.join('|')) {
    setListKey(models.join('|'));
    setPicked(false);
  }

  const custom = !models.length || picked || (!!value && !models.includes(value));

  const choose = (choice: string | null) => {
    if (!choice) return;
    if (choice === CUSTOM_MODEL) {
      setPicked(true);
      return;
    }

    setPicked(false);
    onChange(choice);
  };

  return { custom, choose };
}
