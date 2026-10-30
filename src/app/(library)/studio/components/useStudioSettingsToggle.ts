'use client';

import { useState } from 'react';

export function useStudioSettingsToggle() {
  const [open, setOpen] = useState(false);

  return { open, setOpen };
}
