'use client';

import { BoxesIcon, ClockIcon, DownloadIcon, ImageUpIcon, LayoutGridIcon, MoonIcon, PencilRulerIcon, PersonStandingIcon, PlusIcon, ShirtIcon, SparklesIcon, StarIcon, SunIcon, UploadIcon } from 'lucide-react';
import Link from 'next/link';

import { GithubMark } from '@/components/library/GithubMark';
import { NewBoardDialog } from '@/components/library/NewBoardDialog';
import { type SidebarLink, useLibrarySidebar } from '@/components/library/useLibrarySidebar';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { cn } from '@/lib/utils';

interface LibrarySidebarProps {
  onNavigate?: () => void;
}

interface SidebarRowProps {
  link: SidebarLink;
  onNavigate?: () => void;
}

const ICONS = { pose: PersonStandingIcon, costume: ShirtIcon, star: StarIcon, clock: ClockIcon, rig: BoxesIcon, board: LayoutGridIcon, image: ImageUpIcon, studio: SparklesIcon, mine: PencilRulerIcon };

function SidebarRow({ link, onNavigate }: SidebarRowProps) {
  const Icon = link.icon ? ICONS[link.icon] : null;

  return (
    <Link
      href={link.href}
      onClick={onNavigate}
      aria-current={link.active ? 'page' : undefined}
      className={cn(
        'flex items-center gap-2 rounded-md px-2 py-1.5 text-sm text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground',
        link.depth === 1 && 'pl-8',
        link.depth === 2 && 'pl-11 text-xs',
        link.active && 'bg-sidebar-primary text-sidebar-primary-foreground hover:bg-sidebar-primary hover:text-sidebar-primary-foreground'
      )}
    >
      {Icon ? <Icon className="size-4 shrink-0" /> : null}
      {link.swatch ? <span className="size-3 shrink-0 rounded-full ring-1 ring-black/20" style={{ background: link.swatch }} /> : null}
      <span className="min-w-0 flex-1 truncate">{link.label}</span>
      {link.count != null ? <span className="text-xs tabular-nums opacity-60">{link.count.toLocaleString()}</span> : null}
    </Link>
  );
}

export function LibrarySidebar({ onNavigate }: LibrarySidebarProps) {
  const { sections, boardDialogOpen, setBoardDialogOpen, createBoard, exportLibrary, importLibrary, theme, toggleTheme, showAdult, setShowAdult } = useLibrarySidebar();

  return (
    <nav aria-label="Library" className="flex h-full flex-col">
      <div className="flex items-center gap-2 px-4 py-4 text-sm font-semibold">
        <PersonStandingIcon className="size-5" />
        AI Library
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto px-2 pb-4">
        {sections.map(section => (
          <div key={section.title} className="mb-4">
            <div className="flex items-center justify-between px-2 pb-1 text-xs font-medium text-muted-foreground">
              {section.title}
              {section.title === 'Boards' ? (
                <Button variant="ghost" size="icon-xs" aria-label="New board" onClick={() => setBoardDialogOpen(true)}>
                  <PlusIcon />
                </Button>
              ) : null}
            </div>
            {section.links.map(link => (
              <SidebarRow key={link.href + link.label} link={link} onNavigate={onNavigate} />
            ))}
            {section.empty ? <p className="px-2 text-xs text-muted-foreground">{section.empty}</p> : null}
          </div>
        ))}
      </div>
      <label className="flex items-center justify-between gap-2 border-t px-4 py-2.5 text-xs text-muted-foreground">
        Show adult categories
        <Switch checked={showAdult} onCheckedChange={setShowAdult} aria-label="Show adult categories" />
      </label>
      <div className="flex items-center gap-1 border-t p-2">
        <Button variant="ghost" size="sm" onClick={exportLibrary}>
          <DownloadIcon />
          Export
        </Button>
        <Button variant="ghost" size="sm" onClick={importLibrary}>
          <UploadIcon />
          Import
        </Button>
        <Button variant="ghost" size="icon-sm" className="ml-auto" aria-label="Source code on GitHub" nativeButton={false} render={<a href="https://github.com/opensegra/ai-library" target="_blank" rel="noreferrer" />}>
          <GithubMark />
        </Button>
        <Button variant="ghost" size="icon-sm" aria-label="Switch theme" onClick={toggleTheme}>
          {theme === 'dark' ? <SunIcon /> : <MoonIcon />}
        </Button>
      </div>
      <NewBoardDialog open={boardDialogOpen} onOpenChange={setBoardDialogOpen} onCreate={createBoard} />
    </nav>
  );
}
