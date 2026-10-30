import type { ImageProtocol, ImageService, ServerProtocol, ServicePresetId } from '@/lib/studio/types';

export interface ServicePreset {
  id: ServicePresetId;
  label: string;
  protocol: ImageProtocol;
  baseURL: string;
  model: string;
  keyPage: string;
  negativeField?: boolean;
}

export const SERVICE_PRESETS: ServicePreset[] = [
  { id: 'puter', label: 'Puter (sign in, no key)', protocol: 'puter', baseURL: '', model: 'gemini-3.1-flash-image', keyPage: 'https://puter.com' },
  { id: 'gemini', label: 'Google Gemini', protocol: 'gemini', baseURL: 'https://generativelanguage.googleapis.com/v1beta', model: 'gemini-2.5-flash-image', keyPage: 'https://aistudio.google.com/apikey' },
  { id: 'openai', label: 'OpenAI', protocol: 'openai', baseURL: 'https://api.openai.com/v1', model: 'gpt-image-1', keyPage: 'https://platform.openai.com/api-keys' },
  { id: 'openrouter', label: 'OpenRouter', protocol: 'chat', baseURL: 'https://openrouter.ai/api/v1', model: 'google/gemini-2.5-flash-image', keyPage: 'https://openrouter.ai/keys' },
  { id: 'xai', label: 'xAI Grok', protocol: 'openai', baseURL: 'https://api.x.ai/v1', model: 'grok-2-image', keyPage: 'https://console.x.ai' },
  { id: 'together', label: 'Together AI', protocol: 'openai', baseURL: 'https://api.together.xyz/v1', model: 'black-forest-labs/FLUX.1-schnell', keyPage: 'https://api.together.ai/settings/api-keys', negativeField: true },
  { id: 'siliconflow', label: 'SiliconFlow', protocol: 'openai', baseURL: 'https://api.siliconflow.cn/v1', model: 'Kwai-Kolors/Kolors', keyPage: 'https://cloud.siliconflow.cn/account/ak', negativeField: true },
  { id: 'zhipu', label: 'Zhipu CogView', protocol: 'openai', baseURL: 'https://open.bigmodel.cn/api/paas/v4', model: 'cogview-4', keyPage: 'https://open.bigmodel.cn/usercenter/apikeys' },
  { id: 'seedream', label: 'Seedream (Volcengine Ark)', protocol: 'seedream', baseURL: 'https://ark.cn-beijing.volces.com/api/v3', model: 'doubao-seedream-4-0-250828', keyPage: 'https://console.volcengine.com/ark' },
  { id: 'byteplus', label: 'Seedream (BytePlus ModelArk)', protocol: 'seedream', baseURL: 'https://ark.ap-southeast.bytepluses.com/api/v3', model: 'seedream-4-0-250828', keyPage: 'https://console.byteplus.com/ark' },
  { id: 'custom', label: 'Custom OpenAI-compatible', protocol: 'openai', baseURL: '', model: '', keyPage: '' }
];

export function presetFor(id: ServicePresetId): ServicePreset {
  return SERVICE_PRESETS.find(preset => preset.id === id) ?? SERVICE_PRESETS[0];
}

export const SERVER_PROTOCOLS = new Set<ImageProtocol>(SERVICE_PRESETS.map(preset => preset.protocol).filter((protocol): protocol is ServerProtocol => protocol !== 'puter'));

export function needsKey(preset: ServicePresetId): boolean {
  return presetFor(preset).protocol !== 'puter';
}

export function isServiceReady(service: ImageService): boolean {
  return !needsKey(service.preset) || !!service.apiKey.trim();
}

export function serviceName(service: ImageService): string {
  return service.preset === 'custom' ? service.model || 'Custom service' : service.preset === 'puter' ? 'Puter' : presetFor(service.preset).label;
}
