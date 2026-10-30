'use client';

import { CopyIcon, DownloadIcon, Loader2Icon, RotateCcwIcon } from 'lucide-react';

import type { StudioResult } from '@/app/(library)/studio/components/useStudioScreen';
import { Button } from '@/components/ui/button';

interface StudioResultsProps {
  results: StudioResult[];
  onCopy: (prompt: string) => void;
  onRetry: (result: StudioResult) => void;
}

export function StudioResults({ results, onCopy, onRetry }: StudioResultsProps) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
      {results.map(result => (
        <figure key={result.id} className="flex min-w-0 flex-col gap-2 rounded-xl border bg-card p-2">
          {result.state === 'done' && result.image ? (
            <img src={result.image.dataUrl} alt={result.label} className="w-full rounded-lg bg-muted object-contain" />
          ) : (
            <div className="flex aspect-[3/4] overflow-y-auto rounded-lg bg-muted p-3 text-center text-xs text-muted-foreground [overflow-wrap:anywhere]">
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
            {result.state === 'failed' ? (
              <Button variant="ghost" size="icon-xs" aria-label="Try again" onClick={() => onRetry(result)}>
                <RotateCcwIcon />
              </Button>
            ) : null}
            <Button variant="ghost" size="icon-xs" aria-label="Copy prompt" onClick={() => onCopy(result.prompt)}>
              <CopyIcon />
            </Button>
          </figcaption>
          {result.image?.warning ? <p className="text-xs text-amber-500">{result.image.warning}</p> : null}
        </figure>
      ))}
    </div>
  );
}
