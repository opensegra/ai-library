'use client';

import { useState } from 'react';

export function useNegativePromptDialog(open: boolean, value: string) {
    const [draft, setDraft] = useState(value);
    const [wasOpen, setWasOpen] = useState(open);

    if (open !== wasOpen) {
        setWasOpen(open);
        if (open) setDraft(value);
    }

    return { draft, setDraft };
}
