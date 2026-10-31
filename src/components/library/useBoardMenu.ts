'use client';

import { useState } from 'react';
import { toast } from 'sonner';

import { useLibrary } from '@/hooks/client/useLibrary';

export function useBoardMenu(uid: string) {
    const { state, toggleBoardItem, createBoard } = useLibrary();
    const [dialogOpen, setDialogOpen] = useState(false);
    const boards = Object.entries(state.boards).map(([name, uids]) => ({ name, holds: uids.includes(uid) }));

    const toggle = (name: string) => {
        const holds = state.boards[name]?.includes(uid);

        toggleBoardItem(name, uid);
        toast.success(holds ? `Removed from ${name}.` : `Added to ${name}.`);
    };

    const createAndAdd = (name: string) => {
        if (!createBoard(name)) return;

        toggleBoardItem(name.trim(), uid);
        setDialogOpen(false);
        toast.success(`Board “${name.trim()}” created.`);
    };

    return { boards, toggle, dialogOpen, setDialogOpen, createAndAdd };
}
