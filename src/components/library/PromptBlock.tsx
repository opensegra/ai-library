'use client';

import { usePromptBlock } from '@/components/library/usePromptBlock';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { CheckIcon, CopyIcon } from 'lucide-react';

interface PromptBlockProps {
    title: string;
    text: string;
    note?: string;
    compact?: boolean;
}

export function PromptBlock({ title, text, note, compact }: PromptBlockProps) {
    const { copied, copy } = usePromptBlock(text);

    return (
        <section className="flex flex-col gap-2 rounded-lg border bg-muted/40 p-3">
            <div className="flex items-center justify-between gap-2">
                <h3 className="text-xs font-medium text-muted-foreground">{title}</h3>
                <Button variant="outline" size="xs" aria-label={`Copy ${title.toLowerCase()}`} onClick={() => void copy()}>
                    {copied ? <CheckIcon /> : <CopyIcon />}
                    {copied ? 'Copied' : 'Copy'}
                </Button>
            </div>
            <p className={cn('whitespace-pre-line', compact ? 'line-clamp-3 text-xs text-muted-foreground' : 'text-sm leading-relaxed')}>
                {text}
            </p>
            {note ? <p className="text-[11px] text-muted-foreground">{note}</p> : null}
        </section>
    );
}
