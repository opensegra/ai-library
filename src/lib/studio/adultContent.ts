import type { Costume, Pose } from '@/lib/catalogue/types';

export const ADULT_POSE_LINES = new Set(['全身1人・セクシー系', '2人絡み']);
export const ADULT_COSTUME_CATEGORIES = new Set(['ランジェリー', '水着', 'セクシー']);

export function isAdultPose(pose: Pose): boolean {
  return ADULT_POSE_LINES.has(pose.line);
}

export function isAdultCostume(costume: Costume): boolean {
  return ADULT_COSTUME_CATEGORIES.has(costume.cat);
}
