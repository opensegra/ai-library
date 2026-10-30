'use client';

import { SparklesIcon } from 'lucide-react';

import { StudioResults } from '@/app/(library)/studio/components/StudioResults';
import type { StudioResult, StudioTurn } from '@/app/(library)/studio/components/useStudioScreen';

interface ChatTurnProps {
  turn: StudioTurn;
  onCopy: (prompt: string) => void;
  onRetry: (result: StudioResult) => void;
  onOpen: (result: StudioResult) => void;
  canRetry: (resultId: string) => boolean;
}

export function ChatTurn({ turn, onCopy, onRetry, onOpen, canRetry }: ChatTurnProps) {
  const waiting = turn.results.filter(result => result.state === 'waiting').length;
  const made = turn.results.filter(result => result.state === 'done').length;
  const status = waiting ? `Making ${turn.results.length === 1 ? 'the image' : `${turn.results.length} images`}…` : `Made ${made} of ${turn.results.length} with ${turn.services}.`;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col items-end gap-2">
        <div className="flex max-w-[85%] flex-wrap justify-end gap-1.5">
          {turn.photos.map((photo, index) => (
            <img key={photo.slice(-40)} src={photo} alt={`Model photo ${index + 1}`} className="h-16 w-12 rounded-lg border object-cover" />
          ))}
          {turn.attachments.map(attachment => (
            <img key={attachment.key} src={attachment.thumb} alt={attachment.label} title={attachment.label} className="h-16 w-12 rounded-lg border bg-white object-contain" />
          ))}
        </div>
        <div className="max-w-[85%] rounded-3xl bg-muted px-4 py-2.5 text-sm whitespace-pre-wrap">{turn.message || 'Generate with these references.'}</div>
        <p className="text-[11px] text-muted-foreground">
          {turn.attachments.map(attachment => attachment.label).join(', ')} · {turn.details}
        </p>
      </div>
      <div className="flex gap-3">
        <div className="flex size-7 shrink-0 items-center justify-center rounded-full border">
          <SparklesIcon className="size-3.5" />
        </div>
        <div className="flex min-w-0 flex-1 flex-col gap-3">
          <p className="pt-1 text-sm text-muted-foreground">{status}</p>
          <StudioResults results={turn.results} onCopy={onCopy} onRetry={onRetry} onOpen={onOpen} canRetry={canRetry} />
        </div>
      </div>
    </div>
  );
}
