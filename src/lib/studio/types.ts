export type ImageProvider = 'gemini' | 'openai' | 'seedream';

export type AspectRatio = '3:4' | '1:1' | '4:3' | '9:16' | '16:9';

export type LayoutMode = 'each' | 'sheet';

export interface StudioSettings {
  provider: ImageProvider;
  apiKey: string;
  baseURL: string;
  model: string;
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
  aspectRatio: AspectRatio;
  mode: LayoutMode;
}

export interface PromptPose {
  code: string;
  name: string;
  group: string;
  angle: string;
  people: number;
}

export interface PromptCostume {
  id: string;
  words: string[];
}

export interface GenerateRequest {
  settings: StudioSettings;
  prompt: string;
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
