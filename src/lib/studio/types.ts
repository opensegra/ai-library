export type ImageProtocol = 'gemini' | 'openai' | 'seedream' | 'chat' | 'puter';

export type ServerProtocol = Exclude<ImageProtocol, 'puter'>;

export type ServicePresetId = 'puter' | 'gemini' | 'openai' | 'openrouter' | 'xai' | 'together' | 'siliconflow' | 'zhipu' | 'seedream' | 'byteplus' | 'custom';

export type AspectRatio = '3:4' | '1:1' | '4:3' | '9:16' | '16:9';

export type LayoutMode = 'each' | 'sheet';

export interface ImageService {
  id: string;
  preset: ServicePresetId;
  apiKey: string;
  baseURL: string;
  model: string;
}

export interface StudioSettings {
  services: ImageService[];
  selected: string[];
}

export interface StudioPose {
  uid: string;
  angle: string;
}

export interface StudioSelection {
  poses: StudioPose[];
  costume: string | null;
  modelPhotos: string[];
  description: string;
  extraPrompt: string;
  negativePrompt: string;
  aspectRatio: AspectRatio;
  mode: LayoutMode;
}

export interface PromptPose {
  code: string;
  name: string;
  group: string;
  angle: string;
  people: number;
  arrangement: string | null;
}

export interface PromptCostume {
  id: string;
  words: string[];
}

export interface GenerateRequest {
  protocol: ImageProtocol;
  apiKey: string;
  baseURL: string;
  model: string;
  prompt: string;
  negativePrompt?: string;
  modelPhotos: string[];
  costumeImage: string | null;
  poseImages: string[];
  aspectRatio: AspectRatio;
}

export interface GeneratedImage {
  dataUrl: string;
  model: string;
  referencesSent: boolean;
  warning?: string;
}
