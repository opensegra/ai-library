'use client';

import { BoardMenu } from '@/components/library/BoardMenu';
import { PromptBlock } from '@/components/library/PromptBlock';
import { usePoseInspector } from '@/components/library/usePoseInspector';
import { Button } from '@/components/ui/button';
import { ANGLES } from '@/lib/catalogue/angles';
import { posePrompt } from '@/lib/catalogue/describePose';
import { DEFAULT_NEGATIVE_PROMPT } from '@/lib/catalogue/negativePrompt';
import type { LibraryItem, Pose } from '@/lib/catalogue/types';
import { cn } from '@/lib/utils';
import { BoxesIcon, DownloadIcon, Maximize2Icon, SparklesIcon, StarIcon } from 'lucide-react';

interface PoseInspectorProps {
    pose: Pose;
    list: LibraryItem[];
    angle: string;
    onAngle: (angle: string) => void;
    onZoom: () => void;
}

export function PoseInspector({ pose, list, angle, onAngle, onZoom }: PoseInspectorProps) {
    const { image, favourite, toggleFavourite, openRig, opening, saved, inStudio, toggleStudio } = usePoseInspector(pose, list, angle);

    return (
        <div className="flex flex-col gap-4">
            <button type="button" onClick={onZoom} className="overflow-hidden rounded-lg border bg-white" aria-label="View full screen">
                <img
                    src={image.full}
                    alt={pose.name}
                    className="aspect-[3/4] w-full object-contain [filter:var(--image-filter)] [transform:var(--image-transform)]"
                />
            </button>
            <div className="grid grid-cols-5 gap-1.5">
                {ANGLES.filter((entry) => pose.images[entry.jp]).map((entry) => (
                    <button
                        key={entry.jp}
                        type="button"
                        onClick={() => onAngle(entry.jp)}
                        aria-pressed={entry.jp === angle}
                        className={cn(
                            'flex flex-col items-center gap-1 text-[11px] text-muted-foreground',
                            entry.jp === angle && 'text-foreground'
                        )}
                    >
                        <img
                            src={pose.images[entry.jp].thumb}
                            alt=""
                            className={cn(
                                'aspect-[3/4] w-full rounded-md border bg-white object-contain',
                                entry.jp === angle && 'ring-2 ring-primary'
                            )}
                        />
                        {entry.en}
                    </button>
                ))}
            </div>
            <div>
                <p className="text-xs text-muted-foreground">
                    {pose.code} · {pose.lineName} · {pose.cls}
                </p>
                <h2 className="text-lg font-semibold leading-snug">{pose.name}</h2>
            </div>
            <PromptBlock title="Description" text={posePrompt(pose, angle)} note="The camera line follows the angle picked above." />
            <PromptBlock title="Negative prompt" text={DEFAULT_NEGATIVE_PROMPT} compact />
            <div className="flex flex-wrap gap-2">
                <Button size="sm" onClick={() => void openRig()} disabled={opening}>
                    <BoxesIcon />
                    {opening ? 'Opening…' : '3D rig & export'}
                </Button>
                <Button variant="outline" size="sm" onClick={toggleFavourite}>
                    <StarIcon className={favourite ? 'fill-amber-400 text-amber-400' : ''} />
                    {favourite ? 'Favourite' : 'Add to favourites'}
                </Button>
                <BoardMenu uid={pose.uid} />
                <Button variant="outline" size="sm" onClick={toggleStudio}>
                    <SparklesIcon />
                    {inStudio ? 'In studio' : 'Add to studio'}
                </Button>
                <Button variant="outline" size="sm" onClick={onZoom}>
                    <Maximize2Icon />
                    Full screen
                </Button>
                <Button variant="outline" size="sm" nativeButton={false} render={<a href={image.full} download={`${pose.code}.webp`} />}>
                    <DownloadIcon />
                    Download
                </Button>
            </div>
            <p className="text-xs text-muted-foreground">
                {saved ? 'Rig saved. ' : ''}Open 3D rig & export to see this pose on the mannequin, compare it with the drawing, adjust any
                joint, resize the body and download it as .glb or .bvh.
            </p>
        </div>
    );
}
