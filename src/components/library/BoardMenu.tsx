'use client';

import { CheckIcon, LayoutGridIcon, PlusIcon } from 'lucide-react';

import { NewBoardDialog } from '@/components/library/NewBoardDialog';
import { useBoardMenu } from '@/components/library/useBoardMenu';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';

interface BoardMenuProps {
  uid: string;
}

export function BoardMenu({ uid }: BoardMenuProps) {
  const { boards, toggle, dialogOpen, setDialogOpen, createAndAdd } = useBoardMenu(uid);

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger render={<Button variant="outline" size="sm" />}>
          <LayoutGridIcon />
          Add to board
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-56">
          {boards.map(board => (
            <DropdownMenuItem key={board.name} onClick={() => toggle(board.name)}>
              <CheckIcon className={board.holds ? 'opacity-100' : 'opacity-0'} />
              {board.name}
            </DropdownMenuItem>
          ))}
          {boards.length ? <DropdownMenuSeparator /> : null}
          <DropdownMenuItem onClick={() => setDialogOpen(true)}>
            <PlusIcon />
            New board…
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <NewBoardDialog open={dialogOpen} onOpenChange={setDialogOpen} onCreate={createAndAdd} />
    </>
  );
}
