'use client';

import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';

interface DriveAskDialogProps {
  open: boolean;
  onAccept: () => void;
  onLater: () => void;
  onNever: () => void;
}

export function DriveAskDialog({ open, onAccept, onLater, onNever }: DriveAskDialogProps) {
  return (
    <Dialog open={open} onOpenChange={next => !next && onLater()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Save your images to Google Drive?</DialogTitle>
          <DialogDescription>
            Each new image is uploaded to an AI Library folder in your Google Drive as soon as it is made. Google asks you to allow access first. The site can only see the files it creates there, nothing else in your Drive. You can turn this off any time in Image settings.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="gap-2 sm:justify-between">
          <Button variant="ghost" onClick={onNever}>
            Don’t ask again
          </Button>
          <div className="flex gap-2">
            <Button variant="outline" onClick={onLater}>
              Not now
            </Button>
            <Button onClick={onAccept}>Connect Google Drive</Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
