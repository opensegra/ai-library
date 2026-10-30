import type { AspectRatio, GeneratedImage, ServerProtocol } from '@/lib/studio/types';

export interface ReferenceImage {
  mediaType: string;
  base64: string;
}

export interface ProviderCall {
  protocol: ServerProtocol;
  apiKey: string;
  baseURL: string;
  model: string;
  prompt: string;
  negativePrompt?: string;
  accountId?: string;
  images: ReferenceImage[];
  aspectRatio: AspectRatio;
  signal: AbortSignal;
}

const OPENAI_SIZES: Record<AspectRatio, string> = { '1:1': '1024x1024', '3:4': '1024x1536', '9:16': '1024x1536', '4:3': '1536x1024', '16:9': '1536x1024' };
const CLOUDFLARE_SIZES: Record<AspectRatio, [number, number]> = { '1:1': [1024, 1024], '3:4': [768, 1024], '9:16': [720, 1280], '4:3': [1024, 768], '16:9': [1280, 720] };
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

function quotaMessage(message: string, status: number): string | null {
  if (/free_tier/i.test(message) && /limit:\s*0\b/.test(message)) return 'This key\'s free tier includes no image generation for this model. Turn on billing for the key\'s project, or use another service.';
  if (status === 429 || /quota|rate.?limit|RESOURCE_EXHAUSTED/i.test(message)) return 'This key has run out of quota for now. Wait and try again, check the service\'s plan and billing, or use another service.';

  return null;
}

function errorMessage(payload: Record<string, unknown>, response: Response, secret: string, fallback: string): ProviderError {
  const error = payload.error as { message?: string; status?: string } | undefined;
  const message = error?.message ?? error?.status ?? fallback;

  return new ProviderError(hide(`${quotaMessage(message, response.status) ?? message} (${response.status})`, secret));
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
    if (call.negativePrompt) form.set('negative_prompt', call.negativePrompt);
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
    body: JSON.stringify({ model: call.model, prompt: call.prompt, size, n: 1, ...(call.negativePrompt ? { negative_prompt: call.negativePrompt } : {}) }),
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

async function callChat(call: ProviderCall): Promise<GeneratedImage> {
  const root = call.baseURL.replace(/\/$/, '');
  const response = await fetch(`${root}/chat/completions`, {
    method: 'POST',
    headers: { authorization: `Bearer ${call.apiKey}`, 'content-type': 'application/json' },
    body: JSON.stringify({
      model: call.model,
      modalities: ['image', 'text'],
      messages: [{ role: 'user', content: [{ type: 'text', text: `${call.prompt}\nAspect ratio: ${call.aspectRatio}.` }, ...call.images.map(image => ({ type: 'image_url', image_url: { url: `data:${image.mediaType};base64,${image.base64}` } }))] }]
    }),
    signal: call.signal
  });
  const payload = await readJson(response, call.apiKey);

  if (!response.ok) throw errorMessage(payload, response, call.apiKey, 'The image service could not generate the image');

  const message = (payload.choices as { message?: { content?: string; images?: { image_url?: { url?: string } }[] } }[] | undefined)?.[0]?.message;
  const url = message?.images?.[0]?.image_url?.url;

  if (!url) throw new ProviderError(message?.content?.trim() || 'The model answered without an image. Pick a model that can output images.');

  return { dataUrl: url.startsWith('data:') ? url : await asDataUrl({ url }, call.signal), model: call.model, referencesSent: call.images.length > 0 };
}

function cloudflareMessage(payload: Record<string, unknown>, status: number, secret: string): ProviderError {
  const errors = (payload.errors as { message?: string; code?: number }[] | undefined) ?? [];
  const message = errors.map(error => error.message).filter(Boolean).join(' ') || `Cloudflare answered ${status}.`;

  if (status === 401 || status === 403 || /authentication|unauthori[sz]ed|token/i.test(message)) return new ProviderError(hide(`Cloudflare did not accept the API token for this account. Check the account ID and that the token has Workers AI permission. (${status})`, secret));
  if (status === 429 || /neuron|quota|capacity|daily|limit/i.test(message)) return new ProviderError(hide(`This Cloudflare account has used its free Workers AI allowance for today, which resets at 00:00 UTC, or is sending too fast. (${status}: ${message})`, secret));

  return new ProviderError(hide(`${message} (${status})`, secret));
}

async function callCloudflare(call: ProviderCall): Promise<GeneratedImage> {
  const [width, height] = CLOUDFLARE_SIZES[call.aspectRatio];
  const form = new FormData();

  form.set('prompt', call.prompt);
  form.set('width', String(width));
  form.set('height', String(height));
  call.images.slice(0, 4).forEach((image, index) => form.append(`input_image_${index}`, new Blob([Buffer.from(image.base64, 'base64')], { type: image.mediaType }), `reference-${index + 1}.${image.mediaType.split('/')[1] ?? 'jpeg'}`));

  const response = await fetch(`${call.baseURL.replace(/\/$/, '')}/accounts/${call.accountId}/ai/run/${call.model}`, { method: 'POST', headers: { authorization: `Bearer ${call.apiKey}` }, body: form, signal: call.signal });
  const payload = await readJson(response, call.apiKey);

  if (!response.ok || payload.success === false) throw cloudflareMessage(payload, response.status, call.apiKey);

  const image = ((payload.result as { image?: string } | undefined)?.image ?? (payload.image as string | undefined)) || '';

  if (!image) throw new ProviderError('Cloudflare answered without an image. Pick a FLUX.2 model, which accepts reference images.');

  return { dataUrl: image.startsWith('data:') ? image : `data:image/${image.startsWith('iVBOR') ? 'png' : 'jpeg'};base64,${image}`, model: call.model, referencesSent: call.images.length > 0 };
}

export function generateImage(call: ProviderCall): Promise<GeneratedImage> {
  if (call.protocol === 'cloudflare') return callCloudflare(call);
  if (call.protocol === 'gemini') return callGemini(call);
  if (call.protocol === 'seedream') return callSeedream(call);
  if (call.protocol === 'chat') return callChat(call);

  return callOpenAI(call);
}
