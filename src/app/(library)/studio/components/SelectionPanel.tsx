'use client';

import { PlusIcon, XIcon } from 'lucide-react';

import { PickerDialog } from '@/app/(library)/studio/components/PickerDialog';
import type { ChosenPose } from '@/app/(library)/studio/components/useStudioScreen';
import { useSelectionPanel } from '@/app/(library)/studio/components/useSelectionPanel';
import { Button } from '@/components/ui/button';
import { ANGLES } from '@/lib/catalogue/angles';
import type { Costume } from '@/lib/catalogue/types';
import { cn } from '@/lib/utils';

interface SelectionPanelProps {
  poses: ChosenPose[];
  costume: Costume | null;
  onAddPose: (uid: string, angle: string) => void;
  onRemovePose: (uid: string) => void;
  onPoseAngle: (uid: string, angle: string) => void;
  onCostume: (uid: string | null) => void;
}

export function SelectionPanel({ poses, costume, onAddPose, onRemovePose, onPoseAngle, onCostume }: SelectionPanelProps) {
  const { picker, setPicker } = useSelectionPanel();

  return (
    <section className="flex flex-col gap-4 rounded-lg border p-4">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold">Poses</h2>
        <Button variant="outline" size="sm" onClick={() => setPicker('poses')} disabled={poses.length >= 6}>
          <PlusIcon />
          Add pose
        </Button>
      </div>
      {poses.length ? null : <p className="text-sm text-muted-foreground">Pick up to six poses. Each one becomes an image, or all of them share one sheet.</p>}
      <div className="flex flex-col gap-3">
        {poses.map(({ pose, angle }) => (
          <div key={pose.uid} className="flex gap-3">
            <img src={(pose.images[angle] ?? Object.values(pose.images)[0]).thumb} alt="" className="w-20 shrink-0 rounded-md border bg-white object-contain" />
            <div className="flex min-w-0 flex-1 flex-col gap-1.5">
              <div className="flex items-start gap-1">
                <div className="min-w-0 flex-1">
                  <p className="text-xs text-muted-foreground">{pose.code}</p>
                  <p className="line-clamp-2 text-sm">{pose.name}</p>
                </div>
                <Button variant="ghost" size="icon-xs" aria-label={`Remove ${pose.code}`} onClick={() => onRemovePose(pose.uid)}>
                  <XIcon />
                </Button>
              </div>
              <div className="flex flex-wrap gap-1">
                {ANGLES.filter(entry => pose.images[entry.jp]).map(entry => (
                  <button
                    key={entry.jp}
                    type="button"
                    onClick={() => onPoseAngle(pose.uid, entry.jp)}
                    className={cn('rounded border px-1.5 py-0.5 text-[11px]', entry.jp === angle ? 'border-primary bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-accent')}
                  >
                    {entry.en}
                  </button>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
      <div className="flex items-center justify-between border-t pt-4">
        <h2 className="text-sm font-semibold">Costume</h2>
        <div className="flex gap-1">
          {costume ? (
            <Button variant="ghost" size="sm" onClick={() => onCostume(null)}>
              Remove
            </Button>
          ) : null}
          <Button variant="outline" size="sm" onClick={() => setPicker('costumes')}>
            {costume ? 'Change' : 'Pick costume'}
          </Button>
        </div>
      </div>
      {costume ? (
        <div className="flex gap-3">
          <img src={costume.thumb} alt="" className="w-20 shrink-0 rounded-md border bg-white object-contain" />
          <div className="min-w-0 text-sm">
            <p className="text-xs text-muted-foreground">
              {costume.id} · {costume.catName}
            </p>
            <p className="line-clamp-3">{costume.words.join(', ')}</p>
          </div>
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">Optional. Without one, the model keeps the clothes from their photo.</p>
      )}
      <PickerDialog
        kind={picker}
        onOpenChange={open => !open && setPicker(null)}
        selectedPoses={poses.map(entry => entry.pose.uid)}
        selectedCostume={costume?.uid ?? null}
        onPickPose={uid => onAddPose(uid, ANGLES[0].jp)}
        onPickCostume={uid => {
          onCostume(uid);
          setPicker(null);
        }}
      />
    </section>
  );
}
