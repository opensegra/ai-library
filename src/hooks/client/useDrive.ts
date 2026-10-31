'use client';

import {
    connectDrive,
    disconnectDrive,
    DRIVE_CLIENT_ID,
    driveConnected,
    type DrivePreference,
    drivePreference,
    setDrivePreference,
    subscribeDrive
} from '@/lib/studio/googleDrive';
import { useSyncExternalStore } from 'react';

const snapshot = () => `${drivePreference()}|${driveConnected()}`;

export function useDrive() {
    const [preference, connected] = useSyncExternalStore(subscribeDrive, snapshot, () => 'ask|false').split('|') as [
        DrivePreference,
        string
    ];

    return {
        available: !!DRIVE_CLIENT_ID,
        preference,
        connected: connected === 'true',
        connect: connectDrive,
        disconnect: disconnectDrive,
        setPreference: setDrivePreference
    };
}
