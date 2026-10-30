'use client';

import { ArrowUpIcon, BanIcon, CopyIcon, ImagePlusIcon, MountainIcon, PersonStandingIcon, PlusIcon, ShirtIcon, SlidersHorizontalIcon, SquareIcon, UserRoundIcon, XIcon } from 'lucide-react';

import type { ChosenPose } from '@/app/(library)/studio/components/useStudioScreen';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ANGLES } from '@/lib/catalogue/angles';
import type { Costume } from '@/lib/catalogue/types';
import type { AspectRatio, LayoutMode, StudioSelection } from '@/lib/studio/types';
import { cn } from '@/lib/utils';

const RATIOS: AspectRatio[] = ['3:4', '1:1', '4:3', '9:16', '16:9'];

interface ComposerProps {
  selection: StudioSelection;
  poses: ChosenPose[];
  costume: Costume | null;
  serviceLabel: string;
  imageCount: number;
  running: boolean;
  onChange: (change: Partial<StudioSelection>) => void;
  onAddPhotos: () => void;
  onAddScene: () => void;
  onOpenModel: () => void;
  onPickPoses: () => void;
  onPickCostume: () => void;
  onRemovePose: (uid: string) => void;
  onPoseAngle: (uid: string, angle: string) => void;
  onRemoveCostume: () => void;
  onOpenSettings: () => void;
  onEditNegative: () => void;
  onCopyPrompt: () => void;
  onSend: () => void;
  onStop: () => void;
}

export function Composer(props: ComposerProps) {
  const { selection, poses, costume, running, onChange } = props;
  const photos = selection.modelPhotos;
  const hasAttachments = photos.length > 0 || !!selection.scenePhoto || poses.length > 0 || !!costume;

  return (
    <div className="flex flex-col gap-2 rounded-3xl border bg-background p-2 shadow-sm focus-within:ring-1 focus-within:ring-ring">
      {hasAttachments ? (
        <div className="flex gap-2 overflow-x-auto px-1 pt-1 pb-0.5">
          {photos.map((photo, index) => (
            <div key={photo.slice(-40)} className="relative shrink-0">
              <button type="button" onClick={props.onOpenModel} aria-label={`Model photo ${index + 1}`}>
                <img src={photo} alt="" className="h-20 w-15 rounded-xl border object-cover" />
              </button>
              <RemoveButton label="Remove photo" onClick={() => onChange({ modelPhotos: photos.filter((_, other) => other !== index) })} />
            </div>
          ))}
          {selection.scenePhoto ? (
            <div className="relative shrink-0">
              <button type="button" onClick={props.onAddScene} aria-label="Change environment photo">
                <img src={selection.scenePhoto} alt="" className="h-20 w-15 rounded-xl border object-cover" />
                <span className="absolute inset-x-1 bottom-1 truncate rounded bg-black/60 px-1 text-[9px] text-white">Scene</span>
              </button>
              <RemoveButton label="Remove environment photo" onClick={() => onChange({ scenePhoto: null })} />
            </div>
          ) : null}
          {poses.map(({ pose, angle, image }) => (
            <div key={pose.uid} className="relative shrink-0">
              <Popover>
                <PopoverTrigger render={<button type="button" aria-label={`${pose.code} view angle`} />}>
                  <img src={image ?? (pose.images[angle] ?? Object.values(pose.images)[0]).thumb} alt="" className="h-20 w-15 rounded-xl border bg-white object-contain" />
                  <span className="absolute inset-x-1 bottom-1 truncate rounded bg-black/60 px-1 text-[9px] text-white">{image ? '3D' : ANGLES.find(entry => entry.jp === angle)?.en}</span>
                </PopoverTrigger>
                <PopoverContent side="top" align="start" className="w-64">
                  <div className="min-w-0">
                    <p className="text-xs text-muted-foreground">{pose.code}</p>
                    <p className="line-clamp-2 text-sm">{pose.name}</p>
                    {image ? <p className="mt-1 text-xs text-muted-foreground">Rendered from the 3D rig, with a depth map. Pick an angle to use the drawing instead.</p> : null}
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {ANGLES.filter(entry => pose.images[entry.jp]).map(entry => (
                      <button
                        key={entry.jp}
                        type="button"
                        onClick={() => props.onPoseAngle(pose.uid, entry.jp)}
                        className={cn('rounded-md border px-2 py-0.5 text-xs', !image && entry.jp === angle ? 'border-primary bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-accent')}
                      >
                        {entry.en}
                      </button>
                    ))}
                  </div>
                </PopoverContent>
              </Popover>
              <RemoveButton label={`Remove ${pose.code}`} onClick={() => props.onRemovePose(pose.uid)} />
            </div>
          ))}
          {costume ? (
            <div className="relative shrink-0">
              <button type="button" onClick={props.onPickCostume} aria-label={`Change costume ${costume.id}`}>
                <img src={costume.thumb} alt="" className="h-20 w-15 rounded-xl border bg-white object-contain" />
              </button>
              <RemoveButton label="Remove costume" onClick={props.onRemoveCostume} />
            </div>
          ) : null}
        </div>
      ) : null}
      <textarea
        value={selection.extraPrompt}
        onChange={event => onChange({ extraPrompt: event.target.value })}
        onKeyDown={event => {
          if (event.key !== 'Enter' || event.shiftKey || event.nativeEvent.isComposing) return;

          event.preventDefault();
          if (!running && poses.length) props.onSend();
        }}
        rows={1}
        placeholder={poses.length ? 'Describe the scene, mood or anything to change' : 'Add a pose with +, then describe the scene'}
        aria-label="Scene and direction"
        className="field-sizing-content max-h-48 min-h-11 w-full resize-none bg-transparent px-3 py-2 text-sm outline-none placeholder:text-muted-foreground"
      />
      <div className="flex items-center gap-1">
        <DropdownMenu>
          <DropdownMenuTrigger render={<Button variant="ghost" size="icon" className="rounded-full" aria-label="Add references" />}>
            <PlusIcon />
          </DropdownMenuTrigger>
          <DropdownMenuContent side="top" align="start" className="w-56">
            <DropdownMenuItem onClick={props.onAddPhotos} disabled={photos.length >= 3}>
              <ImagePlusIcon />
              Add model photo
            </DropdownMenuItem>
            <DropdownMenuItem onClick={props.onAddScene}>
              <MountainIcon />
              {selection.scenePhoto ? 'Change environment photo' : 'Add environment photo'}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={props.onPickPoses} disabled={poses.length >= 6}>
              <PersonStandingIcon />
              Add pose
            </DropdownMenuItem>
            <DropdownMenuItem onClick={props.onPickCostume}>
              <ShirtIcon />
              {costume ? 'Change costume' : 'Pick costume'}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={props.onOpenModel}>
              <UserRoundIcon />
              Describe the model
            </DropdownMenuItem>
            <DropdownMenuItem onClick={props.onCopyPrompt}>
              <CopyIcon />
              Copy prompt
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        <DropdownMenu>
          <DropdownMenuTrigger render={<Button variant="ghost" size="sm" className="rounded-full text-muted-foreground" />}>
            <SlidersHorizontalIcon />
            {selection.aspectRatio}
            {poses.length > 1 ? <span className="hidden sm:inline">· {selection.mode === 'sheet' ? 'One sheet' : 'One each'}</span> : null}
          </DropdownMenuTrigger>
          <DropdownMenuContent side="top" align="start" className="w-52">
            <DropdownMenuGroup>
              <DropdownMenuLabel>Aspect ratio</DropdownMenuLabel>
              <DropdownMenuRadioGroup value={selection.aspectRatio} onValueChange={value => onChange({ aspectRatio: value as AspectRatio })}>
                {RATIOS.map(ratio => (
                  <DropdownMenuRadioItem key={ratio} value={ratio}>
                    {ratio}
                  </DropdownMenuRadioItem>
                ))}
              </DropdownMenuRadioGroup>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuLabel>With several poses</DropdownMenuLabel>
              <DropdownMenuRadioGroup value={selection.mode} onValueChange={value => onChange({ mode: value as LayoutMode })}>
                <DropdownMenuRadioItem value="each">One image each</DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="sheet">One sheet</DropdownMenuRadioItem>
              </DropdownMenuRadioGroup>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={props.onEditNegative}>
              <BanIcon />
              Negative prompt…
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        <Button variant="ghost" size="sm" className="ml-auto min-w-0 rounded-full text-muted-foreground" onClick={props.onOpenSettings}>
          <span className="truncate">{props.serviceLabel}</span>
        </Button>
        {running ? (
          <Button size="icon" className="shrink-0 rounded-full" aria-label="Stop" onClick={props.onStop}>
            <SquareIcon className="fill-current" />
          </Button>
        ) : (
          <Button size="icon" className="shrink-0 rounded-full" aria-label={`Generate ${props.imageCount} ${props.imageCount === 1 ? 'image' : 'images'}`} disabled={!poses.length} onClick={props.onSend}>
            <ArrowUpIcon />
          </Button>
        )}
      </div>
    </div>
  );
}

interface RemoveButtonProps {
  label: string;
  onClick: () => void;
}

function RemoveButton({ label, onClick }: RemoveButtonProps) {
  return (
    <button type="button" aria-label={label} onClick={onClick} className="absolute -top-1.5 -right-1.5 flex size-5 items-center justify-center rounded-full border bg-background text-muted-foreground shadow-sm hover:text-foreground">
      <XIcon className="size-3" />
    </button>
  );
}
