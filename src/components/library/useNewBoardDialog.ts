'use client';

import { type SubmitEvent, useState } from 'react';

export function useNewBoardDialog(open: boolean, onCreate: (name: string) => void) {
    const [name, setName] = useState('');
    const [wasOpen, setWasOpen] = useState(open);

    if (open !== wasOpen) {
        setWasOpen(open);
        if (open) setName('');
    }

    const submit = (event: SubmitEvent) => {
        event.preventDefault();
        onCreate(name);
    };

    return { name, setName, submit };
}
