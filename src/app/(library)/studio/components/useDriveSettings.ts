'use client';

import { useDrive } from '@/hooks/client/useDrive';
import { useState } from 'react';
import { toast } from 'sonner';

export function useDriveSettings() {
    const drive = useDrive();
    const [busy, setBusy] = useState(false);

    const toggleConnection = async () => {
        setBusy(true);
        try {
            if (drive.connected) await drive.disconnect();
            else await drive.connect();
        } catch (error) {
            toast.error((error as Error).message);
        } finally {
            setBusy(false);
        }
    };

    return {
        available: drive.available,
        connected: drive.connected,
        automatic: drive.preference === 'on',
        busy,
        toggleAutomatic: (on: boolean) => drive.setPreference(on ? 'on' : 'off'),
        toggleConnection
    };
}
