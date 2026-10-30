import { DEFAULT_BASE_URLS, DEFAULT_MODELS } from '@/lib/studio/providerDefaults';
import type { AspectRatio, GeneratedImage, ImageProvider } from '@/lib/studio/types';

export interface ReferenceImage {
  mediaType: string;
  base64: string;
}

export interface ProviderCall {
  provider: ImageProvider;
  apiKey: string;
  baseURL: string;
  model: string;
  prompt: string;
  images: ReferenceImage[];
  aspectRatio: AspectRatio;
  signal: AbortSignal;
}

const OPENAI_SIZES: Record<AspectRatio, string> = { '1:1': '1024x1024', '3:4': '1024x1536', '9:16': '1024x1536', '4:3': '1536x1024', '16:9': '1536x1024' };
const SEEDREAM_SIZES: Record<AspectRatio, string> = { '1:1': '2048x2048', '3:4': '1728x2304', '9:16': '1600x2848', '4:3': '2304x1728', '16:9': '2848x1600' };

export class ProviderError extends Error {}

function hide(text: string, secret: string): string {
  return (secret ? text.split(secret).join('***') : text).slice(0, 600);
}

async function readJson(response: Response, secret: string): Promise<Record<string, unknown>> {
  const text = await response.text();

  try {
    return JSON.parse(text) as Record<string, unknown>;
  } catch {
    throw new ProviderError(hide(text || `The image service answered ${response.status} with no readable body.`, secret));
  }
}

function errorMessage(payload: Record<string, unknown>, response: Response, secret: string, fallback: string): ProviderError {
  const error = payload.error as { message?: string; status?: string } | undefined;

  return new ProviderError(hide(`${error?.message ?? error?.status ?? fallback} (${response.status})`, secret));
}

async function asDataUrl(item: { b64_json?: string; url?: string }, signal: AbortSignal): Promise<string> {
  if (item.b64_json) return `data:image/png;base64,${item.b64_json}`;
  if (!item.url) throw new ProviderError('The image service returned no image.');

  const response = await fetch(item.url, { signal });

  if (!response.ok) throw new ProviderError(`The generated image could not be downloaded (${response.status}).`);

  const type = response.headers.get('content-type')?.split(';')[0] ?? 'image/png';

  return `data:${type};base64,${Buffer.from(await response.arrayBuffer()).toString('base64')}`;
}

async function callGemini(call: ProviderCall): Promise<GeneratedImage> {
  const root = call.baseURL.replace(/\/$/, '');
  const endpoint = `${root.endsWith('/v1beta') ? root : `${root}/v1beta`}/models/${encodeURIComponent(call.model)}:generateContent`;
  const response = await fetch(endpoint, {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'x-goog-api-key': call.apiKey },
    body: JSON.stringify({
      contents: [{ role: 'user', parts: [{ text: `${call.prompt}\nAspect ratio: ${call.aspectRatio}.` }, ...call.images.map(image => ({ inline_data: { mime_type: image.mediaType, data: image.base64 } }))] }],
      generationConfig: { responseModalities: ['TEXT', 'IMAGE'], imageConfig: { aspectRatio: call.aspectRatio } }
    }),
    signal: call.signal
  });
  const payload = await readJson(response, call.apiKey);

  if (!response.ok) throw errorMessage(payload, response, call.apiKey, 'Gemini could not generate the image');

  const candidates = (payload.candidates as { content?: { parts?: { text?: string; inlineData?: { mimeType?: string; data?: string }; inline_data?: { mime_type?: string; data?: string } }[] }; finishReason?: string }[] | undefined) ?? [];
  const parts = candidates.flatMap(candidate => candidate.content?.parts ?? []);

  for (const part of parts) {
    const inline = part.inlineData ?? (part.inline_data ? { mimeType: part.inline_data.mime_type, data: part.inline_data.data } : undefined);

    if (inline?.data) return { dataUrl: `data:${inline.mimeType ?? 'image/png'};base64,${inline.data}`, model: call.model, referencesSent: call.images.length > 0 };
  }

  const text = parts.map(part => part.text).filter(Boolean).join(' ').trim();
  const reason = (payload.promptFeedback as { blockReason?: string } | undefined)?.blockReason ?? candidates[0]?.finishReason;

  throw new ProviderError(text || (reason ? `Gemini returned no image (${reason}).` : 'Gemini returned no image.'));
}

async function callOpenAI(call: ProviderCall): Promise<GeneratedImage> {
  const root = call.baseURL.replace(/\/$/, '');
  const size = OPENAI_SIZES[call.aspectRatio];

  if (call.images.length) {
    const form = new FormData();

    form.set('model', call.model);
    form.set('prompt', call.prompt);
    form.set('size', size);
    form.set('n', '1');
    call.images.forEach((image, index) => form.append('image[]', new Blob([Buffer.from(image.base64, 'base64')], { type: image.mediaType }), `reference-${index + 1}.${image.mediaType.split('/')[1] ?? 'png'}`));

    const response = await fetch(`${root}/images/edits`, { method: 'POST', headers: { authorization: `Bearer ${call.apiKey}` }, body: form, signal: call.signal });
    const payload = await readJson(response, call.apiKey);

    if (response.ok) return { dataUrl: await asDataUrl((payload.data as { b64_json?: string; url?: string }[])[0] ?? {}, call.signal), model: call.model, referencesSent: true };

    const message = (payload.error as { message?: string } | undefined)?.message ?? '';

    if (![404, 405, 415, 501].includes(response.status) && !/edits|not supported|unknown|multipart/i.test(message)) throw errorMessage(payload, response, call.apiKey, 'The image service could not edit the images');
  }

  const response = await fetch(`${root}/images/generations`, {
    method: 'POST',
    headers: { authorization: `Bearer ${call.apiKey}`, 'content-type': 'application/json' },
    body: JSON.stringify({ model: call.model, prompt: call.prompt, size, n: 1 }),
    signal: call.signal
  });
  const payload = await readJson(response, call.apiKey);

  if (!response.ok) throw errorMessage(payload, response, call.apiKey, 'The image service could not generate the image');

  return {
    dataUrl: await asDataUrl((payload.data as { b64_json?: string; url?: string }[])[0] ?? {}, call.signal),
    model: call.model,
    referencesSent: false,
    warning: call.images.length ? 'This service does not accept reference images, so the result follows the written prompt only.' : undefined
  };
}

async function callSeedream(call: ProviderCall): Promise<GeneratedImage> {
  const root = call.baseURL.replace(/\/$/, '');
  const response = await fetch(`${root}/images/generations`, {
    method: 'POST',
    headers: { authorization: `Bearer ${call.apiKey}`, 'content-type': 'application/json' },
    body: JSON.stringify({
      model: call.model,
      prompt: call.prompt,
      size: SEEDREAM_SIZES[call.aspectRatio],
      response_format: 'url',
      watermark: false,
      ...(call.images.length ? { image: call.images.map(image => `data:${image.mediaType};base64,${image.base64}`) } : {})
    }),
    signal: call.signal
  });
  const payload = await readJson(response, call.apiKey);

  if (!response.ok) throw errorMessage(payload, response, call.apiKey, 'Seedream could not generate the image');

  return { dataUrl: await asDataUrl((payload.data as { b64_json?: string; url?: string }[])[0] ?? {}, call.signal), model: call.model, referencesSent: call.images.length > 0 };
}

export function resolveCall(call: Omit<ProviderCall, 'baseURL' | 'model'> & { baseURL?: string; model?: string }): ProviderCall {
  return { ...call, baseURL: call.baseURL?.trim() || DEFAULT_BASE_URLS[call.provider], model: call.model?.trim() || DEFAULT_MODELS[call.provider] };
}

export function generateImage(call: ProviderCall): Promise<GeneratedImage> {
  if (call.provider === 'gemini') return callGemini(call);
  if (call.provider === 'seedream') return callSeedream(call);

  return callOpenAI(call);
}
