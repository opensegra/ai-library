'use client';

import { usePosesScreen } from '@/app/(library)/poses/components/usePosesScreen';
import { ItemBrowser } from '@/components/library/ItemBrowser';

export function PosesScreen() {
    const { title, poses } = usePosesScreen();

    return <ItemBrowser title={title} items={poses} showsPoses emptyText="No pose matches. Clear the search or pick another group." />;
}
