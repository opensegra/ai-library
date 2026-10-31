'use client';

import { useLibrary } from '@/hooks/client/useLibrary';
import { imageFilter } from '@/lib/library/libraryState';
import { type CSSProperties, useMemo, useState } from 'react';

export function useLibraryShell() {
    const { state } = useLibrary();
    const [menuOpen, setMenuOpen] = useState(false);
    const imageStyle = useMemo(
        () =>
            ({
                '--image-filter': imageFilter(state.adjustments),
                '--image-transform': state.adjustments.flip ? 'scaleX(-1)' : 'none'
            }) as CSSProperties,
        [state.adjustments]
    );

    return { menuOpen, setMenuOpen, imageStyle };
}
