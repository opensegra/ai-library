'use client';

import { MenuIcon } from 'lucide-react';
import { type ReactNode, Suspense } from 'react';

import { LibrarySidebar } from '@/components/library/LibrarySidebar';
import { useLibraryShell } from '@/components/library/useLibraryShell';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTitle } from '@/components/ui/sheet';

interface LibraryShellProps {
  children: ReactNode;
}

export function LibraryShell({ children }: LibraryShellProps) {
  const { menuOpen, setMenuOpen, imageStyle } = useLibraryShell();

  return (
    <div className="flex h-dvh min-h-0" style={imageStyle}>
      <aside className="hidden w-60 shrink-0 border-r bg-sidebar md:block">
        <Suspense>
          <LibrarySidebar />
        </Suspense>
      </aside>
      <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
        <SheetContent side="left" className="w-72 bg-sidebar p-0">
          <SheetTitle className="sr-only">Library</SheetTitle>
          <Suspense>
            <LibrarySidebar onNavigate={() => setMenuOpen(false)} />
          </Suspense>
        </SheetContent>
      </Sheet>
      <main className="flex min-w-0 flex-1 flex-col">
        <div className="flex items-center gap-2 border-b px-3 py-2 md:hidden">
          <Button variant="ghost" size="icon" aria-label="Open library menu" onClick={() => setMenuOpen(true)}>
            <MenuIcon />
          </Button>
          <span className="text-sm font-medium">AI Library</span>
        </div>
        <Suspense>{children}</Suspense>
      </main>
    </div>
  );
}
