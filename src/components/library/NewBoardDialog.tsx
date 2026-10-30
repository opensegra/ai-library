'use client';

import { useNewBoardDialog } from '@/components/library/useNewBoardDialog';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';

interface NewBoardDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreate: (name: string) => void;
}

export function NewBoardDialog({ open, onOpenChange, onCreate }: NewBoardDialogProps) {
  const { name, setName, submit } = useNewBoardDialog(open, onCreate);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <form onSubmit={submit} className="grid gap-4">
          <DialogHeader>
            <DialogTitle>New board</DialogTitle>
            <DialogDescription>Collect the poses and costumes for one character.</DialogDescription>
          </DialogHeader>
          <Input autoFocus value={name} onChange={event => setName(event.target.value)} placeholder="Board name" aria-label="Board name" />
          <DialogFooter>
            <Button type="submit" disabled={!name.trim()}>
              Create board
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
