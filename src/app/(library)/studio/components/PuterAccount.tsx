'use client';

import { Loader2Icon, LogInIcon } from 'lucide-react';

import { usePuterAccount } from '@/app/(library)/studio/components/usePuterAccount';
import { Button } from '@/components/ui/button';

export function PuterAccount() {
  const { account, busy, signIn, signOut } = usePuterAccount();

  return (
    <div className="flex flex-col gap-2 rounded-md bg-muted/50 p-2.5 text-xs text-muted-foreground">
      <p>No key needed. You sign in with your own Puter account, and Puter charges that account for what you generate.</p>
      <div className="flex items-center gap-2">
        {account.status === 'loading' ? (
          <span className="flex items-center gap-1.5">
            <Loader2Icon className="size-3.5 animate-spin" />
            Connecting to Puter…
          </span>
        ) : account.status === 'signed-in' ? (
          <>
            <span className="min-w-0 flex-1 truncate">
              Signed in as <span className="text-foreground">{account.username}</span>
            </span>
            <Button variant="ghost" size="sm" onClick={() => void signOut()}>
              Sign out
            </Button>
          </>
        ) : (
          <>
            <span className="min-w-0 flex-1">{account.status === 'failed' ? account.message : 'Not signed in yet. Generating also asks you to sign in.'}</span>
            <Button variant="outline" size="sm" disabled={busy} onClick={() => void signIn()}>
              {busy ? <Loader2Icon className="animate-spin" /> : <LogInIcon />}
              Sign in with Puter
            </Button>
          </>
        )}
      </div>
    </div>
  );
}
