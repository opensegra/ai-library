'use client';

import { DownloadIcon, Maximize2Icon, SparklesIcon, StarIcon } from 'lucide-react';
import Link from 'next/link';

import { BoardMenu } from '@/components/library/BoardMenu';
import { useCostumeInspector } from '@/components/library/useCostumeInspector';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import type { Costume, LibraryItem } from '@/lib/catalogue/types';

interface CostumeInspectorProps {
  costume: Costume;
  onZoom: () => void;
  onSelect: (item: LibraryItem) => void;
}

export function CostumeInspector({ costume, onZoom, onSelect }: CostumeInspectorProps) {
  const { favourite, toggleFavourite, similar, inStudio, toggleStudio } = useCostumeInspector(costume);

  return (
    <div className="flex flex-col gap-4">
      <button type="button" onClick={onZoom} className="overflow-hidden rounded-lg border bg-white" aria-label="View full screen">
        <img src={costume.mid} alt={costume.words.join(' ')} className="aspect-[2/3] w-full object-contain [filter:var(--image-filter)] [transform:var(--image-transform)]" />
      </button>
      <div>
        <p className="text-xs text-muted-foreground">
          {costume.id} · {costume.catName}
        </p>
        <div className="mt-2 flex flex-wrap gap-1.5">
          {costume.words.map(word => (
            <Badge key={word} variant="outline" render={<Link href={`/costumes?words=${encodeURIComponent(word)}`} />}>
              {word}
            </Badge>
          ))}
        </div>
      </div>
      <div className="flex flex-wrap gap-2">
        <Button variant="outline" size="sm" onClick={toggleFavourite}>
          <StarIcon className={favourite ? 'fill-amber-400 text-amber-400' : ''} />
          {favourite ? 'Favourite' : 'Add to favourites'}
        </Button>
        <BoardMenu uid={costume.uid} />
        <Button variant="outline" size="sm" onClick={toggleStudio}>
          <SparklesIcon />
          {inStudio ? 'In studio' : 'Use in studio'}
        </Button>
        <Button variant="outline" size="sm" onClick={onZoom}>
          <Maximize2Icon />
          Full screen
        </Button>
        <Button variant="outline" size="sm" nativeButton={false} render={<a href={costume.full} download={`${costume.id}.webp`} />}>
          <DownloadIcon />
          Download
        </Button>
      </div>
      <div>
        <p className="mb-2 text-xs font-medium text-muted-foreground">Similar costumes</p>
        <div className="grid grid-cols-3 gap-2">
          {similar.map(other => (
            <button key={other.uid} type="button" onClick={() => onSelect(other)} className="overflow-hidden rounded-md border bg-white" aria-label={other.id}>
              <img src={other.thumb} alt="" loading="lazy" className="aspect-[2/3] w-full object-contain" />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
