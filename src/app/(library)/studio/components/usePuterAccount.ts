'use client';

import { useEffect, useState } from 'react';

import { loadPuter, puterErrorMessage, type PuterClient } from '@/lib/studio/puterImage';

type PuterAccountState = { status: 'loading' } | { status: 'signed-out' } | { status: 'signed-in'; username: string } | { status: 'failed'; message: string };

async function readAccount(puter: PuterClient): Promise<PuterAccountState> {
  if (!puter.auth.isSignedIn()) return { status: 'signed-out' };

  try {
    return { status: 'signed-in', username: (await puter.auth.getUser()).username };
  } catch {
    return { status: 'signed-out' };
  }
}

export function usePuterAccount() {
  const [account, setAccount] = useState<PuterAccountState>({ status: 'loading' });
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let current = true;

    loadPuter()
      .then(readAccount)
      .then(next => current && setAccount(next))
      .catch((error: unknown) => current && setAccount({ status: 'failed', message: puterErrorMessage(error) }));

    return () => {
      current = false;
    };
  }, []);

  const signIn = async () => {
    setBusy(true);
    try {
      const puter = await loadPuter();

      await puter.auth.signIn();
      setAccount(await readAccount(puter));
    } catch (error) {
      setAccount({ status: 'failed', message: puterErrorMessage(error) });
    } finally {
      setBusy(false);
    }
  };

  const signOut = async () => {
    (await loadPuter()).auth.signOut();
    setAccount({ status: 'signed-out' });
  };

  return { account, busy, signIn, signOut };
}
