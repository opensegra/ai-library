import type { ImageProtocol, ImageService, ServerProtocol, ServicePresetId } from '@/lib/studio/types';

export interface ServicePreset {
  id: ServicePresetId;
  label: string;
  protocol: ImageProtocol;
  baseURL: string;
  model: string;
  models: string[];
  keyPage: string;
  negativeField?: boolean;
  maxReferences?: number;
  maxReferenceSide?: number;
  needsAccount?: boolean;
}

export const SERVICE_PRESETS: ServicePreset[] = [
  {
    id: 'puter',
    label: 'Puter (sign in, no key)',
    protocol: 'puter',
    baseURL: '',
    model: 'gemini-3.1-flash-image',
    models: ['gemini-3.1-flash-image', 'gemini-3-pro-image', 'gemini-nano-banana-2.1', 'gpt-image-2', 'gpt-image-2.5-flare', 'gpt-image-2.5-sunburst', 'grok-imagine-image', 'seedream-5-0-lite-260128'],
    keyPage: 'https://puter.com'
  },
  {
    id: 'cloudflare',
    label: 'Cloudflare Workers AI',
    protocol: 'cloudflare',
    baseURL: 'https://api.cloudflare.com/client/v4',
    model: '@cf/black-forest-labs/flux-2-klein-4b',
    models: ['@cf/black-forest-labs/flux-2-klein-4b', '@cf/black-forest-labs/flux-2-klein-9b', '@cf/black-forest-labs/flux-2-dev'],
    keyPage: 'https://dash.cloudflare.com/profile/api-tokens',
    maxReferences: 4,
    maxReferenceSide: 511,
    needsAccount: true
  },
  {
    id: 'gemini',
    label: 'Google Gemini',
    protocol: 'gemini',
    baseURL: 'https://generativelanguage.googleapis.com/v1beta',
    model: 'gemini-2.5-flash-image',
    models: ['gemini-2.5-flash-image', 'gemini-3.1-flash-image-preview', 'gemini-3-pro-image-preview'],
    keyPage: 'https://aistudio.google.com/apikey'
  },
  { id: 'openai', label: 'OpenAI', protocol: 'openai', baseURL: 'https://api.openai.com/v1', model: 'gpt-image-1', models: ['gpt-image-1', 'gpt-image-1-mini', 'gpt-image-2'], keyPage: 'https://platform.openai.com/api-keys' },
  {
    id: 'openrouter',
    label: 'OpenRouter',
    protocol: 'chat',
    baseURL: 'https://openrouter.ai/api/v1',
    model: 'google/gemini-2.5-flash-image',
    models: ['google/gemini-2.5-flash-image', 'google/gemini-3-pro-image-preview', 'openai/gpt-5-image'],
    keyPage: 'https://openrouter.ai/keys'
  },
  { id: 'xai', label: 'xAI Grok', protocol: 'openai', baseURL: 'https://api.x.ai/v1', model: 'grok-2-image', models: ['grok-2-image', 'grok-imagine-image'], keyPage: 'https://console.x.ai' },
  {
    id: 'together',
    label: 'Together AI',
    protocol: 'openai',
    baseURL: 'https://api.together.xyz/v1',
    model: 'black-forest-labs/FLUX.1-schnell',
    models: ['black-forest-labs/FLUX.1-schnell', 'black-forest-labs/FLUX.1-kontext-pro', 'black-forest-labs/FLUX.1-kontext-max'],
    keyPage: 'https://api.together.ai/settings/api-keys',
    negativeField: true
  },
  {
    id: 'siliconflow',
    label: 'SiliconFlow',
    protocol: 'openai',
    baseURL: 'https://api.siliconflow.cn/v1',
    model: 'Kwai-Kolors/Kolors',
    models: ['Kwai-Kolors/Kolors', 'Qwen/Qwen-Image', 'Qwen/Qwen-Image-Edit'],
    keyPage: 'https://cloud.siliconflow.cn/account/ak',
    negativeField: true
  },
  { id: 'zhipu', label: 'Zhipu CogView', protocol: 'openai', baseURL: 'https://open.bigmodel.cn/api/paas/v4', model: 'cogview-4', models: ['cogview-4', 'cogview-4-250304'], keyPage: 'https://open.bigmodel.cn/usercenter/apikeys' },
  {
    id: 'seedream',
    label: 'Seedream (Volcengine Ark)',
    protocol: 'seedream',
    baseURL: 'https://ark.cn-beijing.volces.com/api/v3',
    model: 'doubao-seedream-4-0-250828',
    models: ['doubao-seedream-4-0-250828'],
    keyPage: 'https://console.volcengine.com/ark'
  },
  {
    id: 'byteplus',
    label: 'Seedream (BytePlus ModelArk)',
    protocol: 'seedream',
    baseURL: 'https://ark.ap-southeast.bytepluses.com/api/v3',
    model: 'seedream-4-0-250828',
    models: ['seedream-4-0-250828'],
    keyPage: 'https://console.byteplus.com/ark'
  },
  { id: 'custom', label: 'Custom OpenAI-compatible', protocol: 'openai', baseURL: '', model: '', models: [], keyPage: '' }
];

export const CLOUDFLARE_COSTS: Record<string, string> = {
  '@cf/black-forest-labs/flux-2-klein-4b': 'about 125 Neurons an image, so roughly 80 a day on the free allowance',
  '@cf/black-forest-labs/flux-2-klein-9b': 'about 1,460 Neurons an image, so roughly 6 a day on the free allowance',
  '@cf/black-forest-labs/flux-2-dev': 'several thousand Neurons an image, so 1 or 2 a day on the free allowance'
};

export function presetFor(id: ServicePresetId): ServicePreset {
  return SERVICE_PRESETS.find(preset => preset.id === id) ?? SERVICE_PRESETS[0];
}

export const SERVER_PROTOCOLS = new Set<ImageProtocol>(SERVICE_PRESETS.map(preset => preset.protocol).filter((protocol): protocol is ServerProtocol => protocol !== 'puter'));

export function needsKey(preset: ServicePresetId): boolean {
  return presetFor(preset).protocol !== 'puter';
}

export function isServiceReady(service: ImageService): boolean {
  if (presetFor(service.preset).needsAccount && !service.accountId?.trim()) return false;

  return !needsKey(service.preset) || !!service.apiKey.trim();
}

export function serviceName(service: ImageService): string {
  return service.preset === 'custom' ? service.model || 'Custom service' : service.preset === 'puter' ? 'Puter' : service.preset === 'cloudflare' ? 'Cloudflare' : presetFor(service.preset).label;
}
