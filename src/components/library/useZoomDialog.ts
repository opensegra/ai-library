'use client';

import { type PointerEvent, useRef, useState, type WheelEvent } from 'react';

export function useZoomDialog(open: boolean) {
    const [scale, setScale] = useState(1);
    const [offset, setOffset] = useState({ x: 0, y: 0 });
    const drag = useRef<{ x: number; y: number } | null>(null);
    const [wasOpen, setWasOpen] = useState(open);

    if (open !== wasOpen) {
        setWasOpen(open);
        setScale(1);
        setOffset({ x: 0, y: 0 });
    }

    return {
        scale,
        offset,
        onWheel: (event: WheelEvent) => setScale((current) => Math.min(8, Math.max(0.5, current * (event.deltaY < 0 ? 1.12 : 0.89)))),
        onPointerDown: (event: PointerEvent) => {
            drag.current = { x: event.clientX - offset.x, y: event.clientY - offset.y };
            (event.currentTarget as HTMLElement).setPointerCapture(event.pointerId);
        },
        onPointerMove: (event: PointerEvent) => {
            if (drag.current) setOffset({ x: event.clientX - drag.current.x, y: event.clientY - drag.current.y });
        },
        onPointerUp: () => {
            drag.current = null;
        },
        fit: () => {
            setScale(1);
            setOffset({ x: 0, y: 0 });
        },
        actualSize: () => setScale(2)
    };
}
