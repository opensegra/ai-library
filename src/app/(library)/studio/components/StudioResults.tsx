'use client';

import { CopyIcon, DownloadIcon, Loader2Icon, RotateCcwIcon } from 'lucide-react';

import type { StudioResult } from '@/app/(library)/studio/components/useStudioScreen';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface StudioResultsProps {
  results: StudioResult[];
  onCopy: (prompt: string) => void;
  onRetry: (result: StudioResult) => void;
  onOpen: (result: StudioResult) => void;
  canRetry: (resultId: string) => boolean;
}

export function StudioResults({ results, onCopy, onRetry, onOpen, canRetry }: StudioResultsProps) {
  return (
    <div className={cn('grid gap-3', results.length === 1 ? 'max-w-sm grid-cols-1' : 'max-w-xl grid-cols-2 sm:grid-cols-3')}>
      {results.map(result => (
        <figure key={result.id} className="flex min-w-0 flex-col gap-2 rounded-xl border bg-card p-2">
          {result.state === 'done' && result.image ? (
            <button type="button" onClick={() => onOpen(result)} aria-label={`Open ${result.label} full size`} className="overflow-hidden rounded-lg bg-muted">
              <img src={result.image.dataUrl} alt={result.label} className="max-h-[22rem] w-full object-contain" />
            </button>
          ) : (
            <div className="flex aspect-[3/4] max-h-[22rem] overflow-y-auto rounded-lg bg-muted p-3 text-center text-xs text-muted-foreground [overflow-wrap:anywhere]">
              {result.state === 'waiting' ? <Loader2Icon className="m-auto size-5 animate-spin" /> : <p className="m-auto">{result.error}</p>}
            </div>
          )}
          <figcaption className="flex items-center gap-1 text-xs text-muted-foreground">
            <span className="min-w-0 flex-1 truncate">{result.label}</span>
            {result.image ? (
              <Button variant="ghost" size="icon-xs" aria-label="Download image" nativeButton={false} render={<a href={result.image.dataUrl} download={`${result.label}.png`} />}>
                <DownloadIcon />
              </Button>
            ) : null}
            {result.state === 'failed' && canRetry(result.id) ? (
              <Button variant="ghost" size="icon-xs" aria-label="Try again" onClick={() => onRetry(result)}>
                <RotateCcwIcon />
              </Button>
            ) : null}
            <Button variant="ghost" size="icon-xs" aria-label="Copy prompt" onClick={() => onCopy(result.prompt)}>
              <CopyIcon />
            </Button>
          </figcaption>
          {result.image?.warning ? <p className="text-xs text-amber-500">{result.image.warning}</p> : null}
          {result.note ? <p className="text-xs text-muted-foreground">{result.note}</p> : null}
        </figure>
      ))}
    </div>
  );
}
