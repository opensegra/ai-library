import type { ImageProvider } from '@/lib/studio/types';

export const PROVIDER_LABELS: Record<ImageProvider, string> = {
  gemini: 'Google Gemini',
  openai: 'OpenAI-compatible',
  seedream: 'Seedream (Volcengine Ark)'
};

export const DEFAULT_MODELS: Record<ImageProvider, string> = {
  gemini: 'gemini-2.5-flash-image',
  openai: 'gpt-image-1',
  seedream: 'doubao-seedream-4-0-250828'
};

export const DEFAULT_BASE_URLS: Record<ImageProvider, string> = {
  gemini: 'https://generativelanguage.googleapis.com/v1beta',
  openai: 'https://api.openai.com/v1',
  seedream: 'https://ark.cn-beijing.volces.com/api/v3'
};
