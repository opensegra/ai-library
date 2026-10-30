import { generateImage, ProviderError, type ReferenceImage, resolveCall } from '@/lib/studio/generateImage';
import { safeBaseUrl } from '@/lib/studio/safeBaseUrl';
import type { AspectRatio, ImageProvider } from '@/lib/studio/types';

export const maxDuration = 60;

const PROVIDERS = new Set<ImageProvider>(['gemini', 'openai', 'seedream']);
const RATIOS = new Set<AspectRatio>(['3:4', '1:1', '4:3', '9:16', '16:9']);
const DATA_URL = /^data:(image\/(?:png|jpeg|webp));base64,([A-Za-z0-9+/=]+)$/;
const MAX_PHOTO_BYTES = 3 * 1024 * 1024;

interface GenerateBody {
  provider?: string;
  apiKey?: string;
  baseURL?: string;
  model?: string;
  prompt?: string;
  modelPhotos?: string[];
  costumeImage?: string | null;
  poseImages?: string[];
  aspectRatio?: string;
}

function refuse(message: string, status = 400) {
  return Response.json({ error: message }, { status });
}

async function mediaReference(path: string, request: Request): Promise<ReferenceImage> {
  const base = process.env.NEXT_PUBLIC_MEDIA_BASE_URL?.replace(/\/$/, '');
  const url = base && path.startsWith(base) ? path : new URL(path.replace(/^https?:\/\/[^/]+/, ''), request.url).toString();
  const response = await fetch(url);

  if (!response.ok) throw new ProviderError(`A reference image could not be read (${response.status}).`);

  return { mediaType: response.headers.get('content-type')?.split(';')[0] ?? 'image/webp', base64: Buffer.from(await response.arrayBuffer()).toString('base64') };
}

function isMediaPath(path: unknown): path is string {
  const base = process.env.NEXT_PUBLIC_MEDIA_BASE_URL?.replace(/\/$/, '') ?? '';

  return typeof path === 'string' && (path.startsWith('/media/') || (!!base && path.startsWith(`${base}/media/`))) && !path.includes('..');
}

export async function POST(request: Request) {
  let body: GenerateBody;

  try {
    body = (await request.json()) as GenerateBody;
  } catch {
    return refuse('The request is not JSON.');
  }

  const provider = (body.provider || process.env.IMAGE_PROVIDER || 'gemini') as ImageProvider;
  const apiKey = body.apiKey?.trim() || process.env.IMAGE_API_KEY || '';
  const baseURL = safeBaseUrl(body.baseURL || process.env.IMAGE_BASE_URL || '');
  const aspectRatio = (body.aspectRatio ?? '3:4') as AspectRatio;
  const photos = body.modelPhotos ?? [];
  const poses = body.poseImages ?? [];

  if (!PROVIDERS.has(provider)) return refuse('Choose Gemini, an OpenAI-compatible service or Seedream.');
  if (!apiKey) return refuse('Add an API key in Image settings first.');
  if (baseURL === null) return refuse('The base URL must be a public http or https address.');
  if (!RATIOS.has(aspectRatio)) return refuse('That aspect ratio is not supported.');
  if (!body.prompt?.trim() || body.prompt.length > 12000) return refuse('The prompt is empty or too long.');
  if (photos.length > 3 || poses.length < 1 || poses.length > 6) return refuse('Use up to three model photos and one to six poses.');
  if (!poses.every(isMediaPath) || (body.costumeImage != null && !isMediaPath(body.costumeImage))) return refuse('Poses and costumes must come from this library.');

  const photoImages: ReferenceImage[] = [];

  for (const photo of photos) {
    const match = DATA_URL.exec(photo);

    if (!match || (match[2].length * 3) / 4 > MAX_PHOTO_BYTES) return refuse('Model photos must be PNG, JPEG or WebP images under 3 MB.');
    photoImages.push({ mediaType: match[1], base64: match[2] });
  }

  try {
    const references = [...photoImages, ...(body.costumeImage ? [await mediaReference(body.costumeImage, request)] : []), ...(await Promise.all(poses.map(path => mediaReference(path, request))))];
    const image = await generateImage(resolveCall({ provider, apiKey, baseURL: baseURL || undefined, model: body.model, prompt: body.prompt, images: references, aspectRatio, signal: request.signal }));

    return Response.json(image);
  } catch (error) {
    if (error instanceof ProviderError) return refuse(error.message, 502);
    if ((error as Error).name === 'AbortError') return refuse('The request was cancelled.', 499);

    return refuse('The image could not be generated.', 500);
  }
}
