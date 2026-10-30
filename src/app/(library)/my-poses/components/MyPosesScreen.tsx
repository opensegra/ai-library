'use client';

import { BoxesIcon, DownloadIcon, SparklesIcon, Trash2Icon, XIcon } from 'lucide-react';
import Link from 'next/link';

import { useMyPosesScreen } from '@/app/(library)/my-poses/components/useMyPosesScreen';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export function MyPosesScreen() {
  const screen = useMyPosesScreen();
  const { selected, view } = screen;

  return (
    <div className="flex min-h-0 flex-1">
      <section className="flex min-w-0 flex-1 flex-col">
        <div className="flex items-baseline gap-2 border-b px-4 py-3">
          <h1 className="text-base font-semibold">My poses</h1>
          <span className="text-sm text-muted-foreground">{screen.poses.length}</span>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto p-4">
          {screen.poses.length ? (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4">
              {screen.poses.map(pose => (
                <button
                  key={pose.id}
                  type="button"
                  onClick={() => screen.select(pose)}
                  className={cn('flex flex-col gap-1.5 text-left', selected?.id === pose.id && '[&>img]:ring-2 [&>img]:ring-primary')}
                >
                  <img src={pose.views[0].full} alt={pose.name} loading="lazy" className="aspect-[3/4] w-full rounded-lg border bg-white object-contain" />
                  <span className="font-mono text-[11px] text-muted-foreground">{pose.code}</span>
                  <span className="line-clamp-2 text-xs">{pose.name}</span>
                </button>
              ))}
            </div>
          ) : (
            <div className="mx-auto max-w-md py-16 text-center text-sm text-muted-foreground">
              <p className="font-medium text-foreground">No poses of your own yet</p>
              <p className="mt-1">
                Open any pose with <span className="font-medium">3D rig & export</span>, change it with Pose, Mirror pose or Vary pose, then choose{' '}
                <span className="font-medium">Save as new pose</span>. It is drawn from all five angles, with a depth map for each, and kept in this browser.
              </p>
              <Button variant="outline" size="sm" className="mt-4" nativeButton={false} render={<Link href="/poses" />}>
                Browse poses
              </Button>
            </div>
          )}
        </div>
      </section>
      {selected && view ? (
        <aside className="fixed inset-0 z-40 flex flex-col gap-4 overflow-y-auto bg-background p-4 lg:static lg:z-auto lg:w-[380px] lg:shrink-0 lg:border-l">
          <div className="flex items-start gap-2">
            <div className="min-w-0 flex-1">
              <p className="font-mono text-xs text-muted-foreground">{selected.code}</p>
              <h2 className="text-lg leading-snug font-semibold">{selected.name}</h2>
              <p className="text-xs text-muted-foreground">
                Based on{' '}
                <Link href={`/poses?item=${encodeURIComponent(selected.basedOn.uid)}`} className="underline underline-offset-2">
                  {selected.basedOn.code}
                </Link>
                {' · '}
                {new Date(selected.createdAt).toLocaleDateString()}
              </p>
            </div>
            <Button variant="ghost" size="icon-sm" aria-label="Close" onClick={screen.close}>
              <XIcon />
            </Button>
          </div>
          <img src={screen.showDepth ? view.depth : view.full} alt={`${selected.name}, ${view.label}${screen.showDepth ? ' depth map' : ''}`} className="aspect-[3/4] w-full rounded-lg border bg-white object-contain" />
          <div className="flex flex-wrap items-center gap-1">
            {selected.views.map(entry => (
              <Button key={entry.jp} variant={entry.jp === view.jp ? 'default' : 'outline'} size="xs" onClick={() => screen.pickAngle(entry.jp)}>
                {entry.label}
              </Button>
            ))}
            <Button variant={screen.showDepth ? 'default' : 'outline'} size="xs" className="ml-auto" aria-pressed={screen.showDepth} onClick={() => screen.setShowDepth(!screen.showDepth)}>
              Depth
            </Button>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button size="sm" onClick={() => screen.sendToStudio(selected)}>
              <SparklesIcon />
              {screen.inStudio ? 'In studio' : 'Use in studio'}
            </Button>
            <Button variant="outline" size="sm" onClick={() => screen.openInRig(selected)}>
              <BoxesIcon />
              Open in 3D rig
            </Button>
            <Button variant="outline" size="sm" nativeButton={false} render={<a href={view.full} download={`${selected.code}-${view.label.toLowerCase()}.jpg`} />}>
              <DownloadIcon />
              Drawing
            </Button>
            <Button variant="outline" size="sm" nativeButton={false} render={<a href={view.depth} download={`${selected.code}-${view.label.toLowerCase()}-depth.jpg`} />}>
              <DownloadIcon />
              Depth map
            </Button>
            <Button variant="ghost" size="sm" className="text-destructive" onClick={() => screen.remove(selected)}>
              <Trash2Icon />
              {screen.confirming === selected.id ? 'Click again to delete' : 'Delete'}
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">Kept in this browser only. In the studio, the chosen angle is sent as the pose drawing together with its depth map.</p>
        </aside>
      ) : null}
    </div>
  );
}
