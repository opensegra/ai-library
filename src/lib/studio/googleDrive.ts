const SCRIPT_URL = 'https://accounts.google.com/gsi/client';
const SCOPE = 'https://www.googleapis.com/auth/drive.file';
const PREFERENCE_KEY = 'ai-library.drive-upload';
const FOLDER_KEY = 'ai-library.drive-folder';
const FOLDER_NAME = 'AI Library';

export type DrivePreference = 'ask' | 'on' | 'off';

interface TokenResponse {
  access_token?: string;
  expires_in?: number;
  error?: string;
}

interface TokenClient {
  requestAccessToken: (options?: { prompt?: string }) => void;
}

interface GoogleIdentity {
  accounts: {
    oauth2: {
      initTokenClient: (config: { client_id: string; scope: string; callback: (response: TokenResponse) => void; error_callback?: (error: { type?: string; message?: string }) => void }) => TokenClient;
      revoke: (token: string, done: () => void) => void;
    };
  };
}

export const DRIVE_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ?? '';

let loading: Promise<GoogleIdentity> | null = null;
let token: { value: string; expiresAt: number } | null = null;
const listeners = new Set<() => void>();

function notify() {
  for (const listener of listeners) listener();
}

export function subscribeDrive(listener: () => void): () => void {
  listeners.add(listener);

  return () => listeners.delete(listener);
}

export function drivePreference(): DrivePreference {
  try {
    const stored = window.localStorage.getItem(PREFERENCE_KEY);

    return stored === 'on' || stored === 'off' ? stored : 'ask';
  } catch {
    return 'ask';
  }
}

export function setDrivePreference(preference: DrivePreference) {
  try {
    window.localStorage.setItem(PREFERENCE_KEY, preference);
  } catch {}
  notify();
}

export function driveConnected(): boolean {
  return !!token && token.expiresAt > Date.now() + 60_000;
}

function loadIdentity(): Promise<GoogleIdentity> {
  loading ??= new Promise<GoogleIdentity>((resolve, reject) => {
    const ready = (window as Window & { google?: GoogleIdentity }).google;

    if (ready?.accounts?.oauth2) {
      resolve(ready);
      return;
    }

    const script = document.createElement('script');

    script.src = SCRIPT_URL;
    script.async = true;
    script.onload = () => {
      const google = (window as Window & { google?: GoogleIdentity }).google;

      if (google?.accounts?.oauth2) resolve(google);
      else reject(new Error('Google sign-in did not load.'));
    };
    script.onerror = () => {
      loading = null;
      script.remove();
      reject(new Error('Google sign-in could not be reached. Check the connection and try again.'));
    };
    document.head.append(script);
  });

  return loading;
}

export async function connectDrive(): Promise<void> {
  if (!DRIVE_CLIENT_ID) throw new Error('Google Drive is not set up on this site yet.');

  const google = await loadIdentity();

  await new Promise<void>((resolve, reject) => {
    const client = google.accounts.oauth2.initTokenClient({
      client_id: DRIVE_CLIENT_ID,
      scope: SCOPE,
      callback: response => {
        if (!response.access_token) {
          reject(new Error(response.error === 'access_denied' ? 'Google Drive access was not allowed.' : 'Google Drive did not give access.'));
          return;
        }

        token = { value: response.access_token, expiresAt: Date.now() + (response.expires_in ?? 3600) * 1000 };
        notify();
        resolve();
      },
      error_callback: error => reject(new Error(error.type === 'popup_closed' ? 'The Google window was closed before access was given.' : error.type === 'popup_failed_to_open' ? 'The browser blocked the Google window. Allow pop-ups for this site and try again.' : error.message || 'Google Drive could not be connected.'))
    });

    client.requestAccessToken({ prompt: '' });
  });
}

export async function disconnectDrive() {
  const current = token?.value;

  token = null;
  notify();
  if (current) (await loadIdentity()).accounts.oauth2.revoke(current, () => {});
}

async function driveFetch(url: string, init: RequestInit): Promise<Response> {
  if (!driveConnected() || !token) throw new Error('Connect Google Drive again to keep saving images.');

  const response = await fetch(url, { ...init, headers: { ...init.headers, authorization: `Bearer ${token.value}` } });

  if (response.status === 401) {
    token = null;
    notify();
    throw new Error('Google Drive access expired. Connect again to keep saving images.');
  }
  if (!response.ok) throw new Error(`Google Drive answered ${response.status}.`);

  return response;
}

async function folderId(): Promise<string> {
  try {
    const stored = window.localStorage.getItem(FOLDER_KEY);

    if (stored) {
      const check = await driveFetch(`https://www.googleapis.com/drive/v3/files/${stored}?fields=id,trashed`, { method: 'GET' }).catch(() => null);
      const found = check ? ((await check.json()) as { id?: string; trashed?: boolean }) : null;

      if (found?.id && !found.trashed) return found.id;
    }
  } catch {}

  const created = await driveFetch('https://www.googleapis.com/drive/v3/files?fields=id', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ name: FOLDER_NAME, mimeType: 'application/vnd.google-apps.folder' })
  });
  const { id } = (await created.json()) as { id: string };

  try {
    window.localStorage.setItem(FOLDER_KEY, id);
  } catch {}

  return id;
}

export async function uploadToDrive(name: string, dataUrl: string): Promise<string> {
  const blob = await (await fetch(dataUrl)).blob();
  const parent = await folderId();
  const form = new FormData();

  form.append('metadata', new Blob([JSON.stringify({ name, parents: [parent] })], { type: 'application/json' }));
  form.append('file', blob, name);

  const response = await driveFetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id', { method: 'POST', body: form });
  const { id } = (await response.json()) as { id: string };

  return id;
}
