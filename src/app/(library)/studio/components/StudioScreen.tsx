'use client';

import { CopyIcon, DownloadIcon, Loader2Icon, SettingsIcon, SparklesIcon, Trash2Icon } from 'lucide-react';

import { ImageSettingsDialog } from '@/app/(library)/studio/components/ImageSettingsDialog';
import { ModelPanel } from '@/app/(library)/studio/components/ModelPanel';
import { SelectionPanel } from '@/app/(library)/studio/components/SelectionPanel';
import { useStudioScreen } from '@/app/(library)/studio/components/useStudioScreen';
import { useStudioSettingsToggle } from '@/app/(library)/studio/components/useStudioSettingsToggle';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { PROVIDER_LABELS } from '@/lib/studio/providerDefaults';
import type { AspectRatio, LayoutMode } from '@/lib/studio/types';

const RATIOS: AspectRatio[] = ['3:4', '1:1', '4:3', '9:16', '16:9'];

export function StudioScreen() {
  const studio = useStudioScreen();
  const { open, setOpen } = useStudioSettingsToggle();
  const { selection, settings, jobs, results, running } = studio;

  return (
    <div className="min-h-0 flex-1 overflow-y-auto">
      <div className="flex flex-wrap items-center gap-2 border-b px-4 py-3">
        <h1 className="text-base font-semibold">Studio</h1>
        <span className="text-sm text-muted-foreground">Put your model into any pose and costume with an image model.</span>
        <Button variant="outline" size="sm" className="ml-auto" onClick={() => setOpen(true)}>
          <SettingsIcon />
          Image settings
        </Button>
      </div>
      <div className="grid gap-4 p-4 lg:grid-cols-[280px_minmax(0,1fr)_minmax(0,1.1fr)]">
        <ModelPanel photos={selection.modelPhotos} description={selection.description} onPhotos={modelPhotos => studio.patch({ modelPhotos })} onDescription={description => studio.patch({ description })} />
        <SelectionPanel poses={studio.poses} costume={studio.costume} onAddPose={studio.addPose} onRemovePose={studio.removePose} onPoseAngle={studio.setPoseAngle} onCostume={studio.setCostume} />
        <section className="flex flex-col gap-4 rounded-lg border p-4">
          <h2 className="text-sm font-semibold">Generate</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="grid gap-1.5">
              <Label>Aspect ratio</Label>
              <Select value={selection.aspectRatio} onValueChange={value => studio.patch({ aspectRatio: value as AspectRatio })}>
                <SelectTrigger size="sm" className="w-full">
                  <SelectValue>{selection.aspectRatio}</SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {RATIOS.map(ratio => (
                    <SelectItem key={ratio} value={ratio}>
                      {ratio}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-1.5">
              <Label>With several poses</Label>
              <ToggleGroup value={[selection.mode]} onValueChange={value => value[0] && studio.patch({ mode: value[0] as LayoutMode })} variant="outline" size="sm">
                <ToggleGroupItem value="each">One image each</ToggleGroupItem>
                <ToggleGroupItem value="sheet">One sheet</ToggleGroupItem>
              </ToggleGroup>
            </div>
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="scene">Scene</Label>
            <Textarea id="scene" value={selection.extraPrompt} onChange={event => studio.patch({ extraPrompt: event.target.value })} placeholder="Clean studio shot, soft daylight, light grey background" rows={2} />
          </div>
          <p className="text-xs text-muted-foreground">
            {studio.hasKey ? `Uses ${PROVIDER_LABELS[settings.provider]} · ${settings.model}.` : 'No API key in this browser. Generate uses the server key if one is set; otherwise copy a prompt below into your own image tool.'}
          </p>
          <div className="flex flex-wrap gap-2">
            <Button onClick={() => void studio.generate()} disabled={!jobs.length || running}>
              {running ? <Loader2Icon className="animate-spin" /> : <SparklesIcon />}
              {running ? 'Generating…' : `Generate ${jobs.length || ''} ${jobs.length === 1 ? 'image' : 'images'}`}
            </Button>
            {jobs.length ? (
              <Button variant="outline" onClick={() => void studio.copyPrompt(jobs.map(job => job.prompt).join('\n\n---\n\n'))}>
                <CopyIcon />
                Copy prompt
              </Button>
            ) : null}
            {results.length ? (
              <Button variant="ghost" onClick={studio.clearResults}>
                <Trash2Icon />
                Clear results
              </Button>
            ) : null}
          </div>
          {!jobs.length ? <p className="text-sm text-muted-foreground">Pick at least one pose to start.</p> : null}
          <div className="grid gap-3 sm:grid-cols-2">
            {results.map(result => (
              <figure key={result.id} className="flex flex-col gap-2 rounded-md border p-2">
                {result.state === 'done' && result.image ? (
                  <img src={result.image.dataUrl} alt={result.label} className="w-full rounded bg-muted object-contain" />
                ) : (
                  <div className="flex aspect-[3/4] items-center justify-center rounded bg-muted p-3 text-center text-xs text-muted-foreground">
                    {result.state === 'waiting' ? <Loader2Icon className="size-5 animate-spin" /> : result.error}
                  </div>
                )}
                <figcaption className="flex items-center gap-1 text-xs text-muted-foreground">
                  <span className="min-w-0 flex-1 truncate">{result.label}</span>
                  {result.image ? (
                    <Button variant="ghost" size="icon-xs" aria-label="Download image" nativeButton={false} render={<a href={result.image.dataUrl} download={`${result.label}.png`} />}>
                      <DownloadIcon />
                    </Button>
                  ) : null}
                  <Button variant="ghost" size="icon-xs" aria-label="Copy prompt" onClick={() => void studio.copyPrompt(result.prompt)}>
                    <CopyIcon />
                  </Button>
                </figcaption>
                {result.image?.warning ? <p className="text-xs text-amber-500">{result.image.warning}</p> : null}
              </figure>
            ))}
          </div>
        </section>
      </div>
      <ImageSettingsDialog open={open} onOpenChange={setOpen} settings={settings} onSave={studio.saveSettings} onClear={studio.clearSettings} />
    </div>
  );
}
