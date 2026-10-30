import type { AspectRatio, GeneratedImage } from '@/lib/studio/types';

const SCRIPT_URL = 'https://js.puter.com/v2/';

interface PuterImageOptions {
  model: string;
  input_images: (string | Blob)[];
  ratio: { w: number; h: number };
}

export interface PuterUser {
  username: string;
}

export interface PuterClient {
  ai: { txt2img: (prompt: string, options: PuterImageOptions) => Promise<HTMLImageElement> };
  auth: { isSignedIn: () => boolean; signIn: () => Promise<unknown>; signOut: () => void; getUser: () => Promise<PuterUser> };
}

export interface PuterImageCall {
  model: string;
  prompt: string;
  modelPhotos: string[];
  costumeImage: string | null;
  poseImages: string[];
  aspectRatio: AspectRatio;
  signal: AbortSignal;
}

let loading: Promise<PuterClient> | null = null;

export function loadPuter(): Promise<PuterClient> {
  loading ??= new Promise<PuterClient>((resolve, reject) => {
    const loaded = (window as Window & { puter?: PuterClient }).puter;

    if (loaded) {
      resolve(loaded);
      return;
    }

    const script = document.createElement('script');

    script.src = SCRIPT_URL;
    script.async = true;
    script.onload = () => {
      const client = (window as Window & { puter?: PuterClient }).puter;

      if (client) resolve(client);
      else reject(new Error('Puter loaded without its library.'));
    };
    script.onerror = () => {
      loading = null;
      script.remove();
      reject(new Error('Puter could not be reached. Check the connection and try again.'));
    };
    document.head.append(script);
  });

  return loading;
}

export function puterErrorMessage(error: unknown): string {
  const fields = (typeof error === 'object' && error ? error : {}) as { error?: unknown; code?: unknown; message?: unknown };

  if (typeof fields.error === 'object' && fields.error) return puterErrorMessage(fields.error);

  const code = String(fields.error ?? fields.code ?? '');
  const message = typeof fields.message === 'string' ? fields.message : error instanceof Error ? error.message : '';

  if (/insufficient_funds/i.test(`${code} ${message}`)) return 'Your Puter account has run out of credit. Add credit on puter.com, or use another service.';
  if (code === 'popup_blocked') return 'The browser blocked the Puter sign-in window. Sign in from Image settings, then try again.';
  if (code === 'auth_window_closed') return 'Puter sign-in was closed before it finished.';
  if (code === 'unsupported_origin') return 'Puter cannot sign in from this page.';

  return message || code || 'Puter could not generate the image.';
}

async function reference(path: string, signal: AbortSignal): Promise<string | Blob> {
  if (/^https?:\/\//.test(path)) return path;

  const response = await fetch(path, { signal });

  if (!response.ok) throw new Error(`A reference image could not be read (${response.status}).`);

  return response.blob();
}

async function asDataUrl(source: string): Promise<string> {
  if (source.startsWith('data:')) return source;

  try {
    const blob = await (await fetch(source)).blob();

    return await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();

      reader.onload = () => resolve(String(reader.result));
      reader.onerror = () => reject(reader.error);
      reader.readAsDataURL(blob);
    });
  } catch {
    return source;
  }
}

function untilAborted(signal: AbortSignal): Promise<never> {
  return new Promise((_, reject) => {
    if (signal.aborted) reject(new DOMException('Stopped.', 'AbortError'));
    signal.addEventListener('abort', () => reject(new DOMException('Stopped.', 'AbortError')), { once: true });
  });
}

export async function generateWithPuter(call: PuterImageCall): Promise<GeneratedImage> {
  const [width, height] = call.aspectRatio.split(':').map(Number);
  const media = [...(call.costumeImage ? [call.costumeImage] : []), ...call.poseImages];

  try {
    const puter = await loadPuter();
    const references = [...call.modelPhotos, ...(await Promise.all(media.map(path => reference(path, call.signal))))];
    const image = await Promise.race([puter.ai.txt2img(call.prompt, { model: call.model, input_images: references, ratio: { w: width, h: height } }), untilAborted(call.signal)]);

    return { dataUrl: await asDataUrl(image.src), model: call.model, referencesSent: references.length > 0 };
  } catch (error) {
    if ((error as Error).name === 'AbortError') throw error;

    throw new Error(puterErrorMessage(error));
  }
}
