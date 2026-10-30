'use client';

import { useDriveSettings } from '@/app/(library)/studio/components/useDriveSettings';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';

export function DriveSettings() {
  const { available, connected, automatic, busy, toggleAutomatic, toggleConnection } = useDriveSettings();

  return (
    <section className="grid gap-2 rounded-lg border p-3">
      <div className="flex items-center gap-2">
        <h3 className="flex-1 text-sm font-medium">Google Drive</h3>
        {available ? (
          <Button variant="outline" size="xs" disabled={busy} onClick={() => void toggleConnection()}>
            {connected ? 'Disconnect' : 'Connect'}
          </Button>
        ) : null}
      </div>
      {available ? (
        <>
          <label className="flex items-center justify-between gap-2 text-sm">
            Save new images to Drive automatically
            <Switch checked={automatic} onCheckedChange={toggleAutomatic} aria-label="Save new images to Google Drive automatically" />
          </label>
          <p className="text-xs text-muted-foreground">
            {connected ? 'Connected for this visit.' : 'Not connected.'} Images go into an AI Library folder, and the site can only see the files it creates there.
          </p>
        </>
      ) : (
        <p className="text-xs text-muted-foreground">Saving to Google Drive is not set up on this site.</p>
      )}
    </section>
  );
}
