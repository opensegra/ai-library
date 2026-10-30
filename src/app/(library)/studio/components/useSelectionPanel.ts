'use client';

import { useState } from 'react';

export type PickerKind = 'poses' | 'costumes' | null;

export function useSelectionPanel() {
  const [picker, setPicker] = useState<PickerKind>(null);

  return { picker, setPicker };
}
