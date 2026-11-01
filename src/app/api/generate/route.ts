import { generateImage, ProviderError, type ReferenceImage } from '@/lib/studio/generateImage';
import { safeBaseUrl } from '@/lib/studio/safeBaseUrl';
import { SERVER_PROTOCOLS, SERVICE_PRESETS } from '@/lib/studio/servicePresets';
import type { AspectRatio, ServerProtocol } from '@/lib/studio/types';

export const maxDuration = 60;

const RATIOS = new Set<AspectRatio>(['3:4', '1:1', '4:3', '9:16', '16:9']);
const DATA_URL = /^data:(image\/(?:png|jpeg|webp));base64,([A-Za-z0-9+/=]+)$/;
const MAX_PHOTO_BYTES = 3 * 1024 * 1024;

interface GenerateBody {
    protocol?: string;
    apiKey?: string;
    baseURL?: string;
    model?: string;
    prompt?: string;
    userPrompt?: string;
    negativePrompt?: string;
    accountId?: string;
    modelPhotos?: string[];
    scenePhoto?: string | null;
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

    return {
        mediaType: response.headers.get('content-type')?.split(';')[0] ?? 'image/webp',
        base64: Buffer.from(await response.arrayBuffer()).toString('base64')
    };
}

function isRender(path: unknown): path is string {
    const match = typeof path === 'string' ? DATA_URL.exec(path) : null;

    return !!match && (match[2].length * 3) / 4 <= MAX_PHOTO_BYTES;
}

function renderReference(path: string): ReferenceImage {
    const [, mediaType, base64] = DATA_URL.exec(path) ?? [];

    return { mediaType, base64 };
}

function isMediaPath(path: unknown): path is string {
    const base = process.env.NEXT_PUBLIC_MEDIA_BASE_URL?.replace(/\/$/, '') ?? '';

    return (
        typeof path === 'string' && (path.startsWith('/media/') || (!!base && path.startsWith(`${base}/media/`))) && !path.includes('..')
    );
}

export function GET() {
    const protocol = process.env.IMAGE_PROTOCOL || 'gemini';
    const preset = SERVICE_PRESETS.find((entry) => entry.protocol === protocol);

    if (!process.env.IMAGE_API_KEY || !preset) return Response.json({ server: null });

    return Response.json({ server: { preset: preset.id, model: process.env.IMAGE_MODEL || preset.model } });
}

export async function POST(request: Request) {
    let body: GenerateBody;

    try {
        body = (await request.json()) as GenerateBody;
    } catch {
        return refuse('The request is not JSON.');
    }

    const usesServerKey = !body.apiKey?.trim();
    const protocol = (usesServerKey ? process.env.IMAGE_PROTOCOL || 'gemini' : body.protocol) as ServerProtocol;
    const preset = SERVICE_PRESETS.find((entry) => entry.protocol === protocol);
    const apiKey = usesServerKey ? process.env.IMAGE_API_KEY || '' : body.apiKey!.trim();
    const accountId = ((usesServerKey ? process.env.IMAGE_ACCOUNT_ID : body.accountId) ?? '').trim();

    const baseURL = safeBaseUrl(
        (usesServerKey ? process.env.IMAGE_BASE_URL : body.baseURL) || preset?.baseURL || '',
        process.env.NODE_ENV === 'development'
    );

    const model = ((usesServerKey ? process.env.IMAGE_MODEL : body.model) || preset?.model || '').trim();
    const aspectRatio = (body.aspectRatio ?? '3:4') as AspectRatio;
    const photos = body.modelPhotos ?? [];
    const poses = body.poseImages ?? [];

    if (!apiKey) return refuse('Add an API key in Image settings first.');
    if (!SERVER_PROTOCOLS.has(protocol)) return refuse('That image service is not supported.');
    if (!baseURL)
        return refuse(baseURL === null ? 'The base URL must be a public http or https address.' : 'Add the base URL of the image service.');
    if (!model) return refuse('Add the model name of the image service.');
    if (protocol === 'cloudflare' && !/^[a-f0-9]{32}$/i.test(accountId))
        return refuse('Add the 32-character Cloudflare account ID, found on the Workers AI page of the Cloudflare dashboard.');
    if (protocol === 'cloudflare' && !/^@(cf|hf)\/[\w.-]+(\/[\w.-]+)*$/.test(model))
        return refuse('Cloudflare model names look like @cf/black-forest-labs/flux-2-klein-4b.');
    if (!RATIOS.has(aspectRatio)) return refuse('That aspect ratio is not supported.');
    if (!body.userPrompt?.trim() || !body.prompt?.trim() || body.prompt.length > 12000)
        return refuse('Describe the image you want to make.');
    if (photos.length > 3 || poses.length > 12) return refuse('Use up to three model photos and up to six poses.');
    if (
        !poses.every((path) => isMediaPath(path) || isRender(path)) ||
        (body.costumeImage != null && !isMediaPath(body.costumeImage) && !isRender(body.costumeImage))
    )
        return refuse('Poses and costumes must come from this library.');

    const photoImages: ReferenceImage[] = [];

    for (const photo of photos) {
        const match = DATA_URL.exec(photo);

        if (!match || (match[2].length * 3) / 4 > MAX_PHOTO_BYTES)
            return refuse('Model photos must be PNG, JPEG or WebP images under 3 MB.');
        photoImages.push({ mediaType: match[1], base64: match[2] });
    }

    const scene = body.scenePhoto ? DATA_URL.exec(body.scenePhoto) : null;

    if (body.scenePhoto && (!scene || (scene[2].length * 3) / 4 > MAX_PHOTO_BYTES))
        return refuse('The environment photo must be a PNG, JPEG or WebP image under 3 MB.');
    if (!photos.length && !scene && !body.costumeImage && !poses.length)
        return refuse('Add at least one reference image: a model photo, environment, pose or costume.');
    if (scene) photoImages.push({ mediaType: scene[1], base64: scene[2] });

    try {
        const references = [
            ...photoImages,
            ...(body.costumeImage
                ? [isRender(body.costumeImage) ? renderReference(body.costumeImage) : await mediaReference(body.costumeImage, request)]
                : []),
            ...(await Promise.all(poses.map((path) => (isRender(path) ? renderReference(path) : mediaReference(path, request)))))
        ];
        const image = await generateImage({
            protocol,
            apiKey,
            baseURL,
            model,
            accountId,
            prompt: body.prompt,
            negativePrompt: typeof body.negativePrompt === 'string' ? body.negativePrompt.trim().slice(0, 2000) || undefined : undefined,
            images: references,
            aspectRatio,
            signal: request.signal
        });

        return Response.json(image);
    } catch (error) {
        if (error instanceof ProviderError) return refuse(error.message, 502);
        if ((error as Error).name === 'AbortError') return refuse('The request was cancelled.', 499);
        if (error instanceof TypeError)
            return refuse(
                `The image service at ${new URL(baseURL).host} could not be reached. Check the base URL and your connection, then try again.`,
                502
            );

        return refuse('The image could not be generated.', 500);
    }
}
