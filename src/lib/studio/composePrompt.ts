import type { LayoutMode, PromptCostume, PromptPose } from '@/lib/studio/types';

const CAMERA: Record<string, string> = {
  Front: 'front view at chest height',
  Above: 'high angle, camera looking down',
  Below: 'low angle, camera looking up',
  Side: 'strict side profile',
  Diagonal: 'three-quarter view'
};

interface ComposePromptInput {
  poses: PromptPose[];
  costume: PromptCostume | null;
  modelPhotoCount: number;
  description: string;
  extraPrompt: string;
  mode: LayoutMode;
}

export function composePrompt({ poses, costume, modelPhotoCount, description, extraPrompt, mode }: ComposePromptInput): string {
  const order = [modelPhotoCount ? `${modelPhotoCount === 1 ? 'the first image is' : `the first ${modelPhotoCount} images are`} the model` : null, costume ? 'then an outfit shown with no person' : null, 'then the pose sketch'].filter(Boolean).join(', ');
  const lines = [
    `Create a finished, fully coloured illustration from the reference images: ${order}.`,
    'Take only the body posture, balance, limb positions and camera angle from the pose sketch. Never draw the sketch lines, joint circles or proportion guides into the result.',
    '',
    'Model:',
    modelPhotoCount ? 'Keep the face, hair, skin tone and body type of the person in the model reference exactly.' : 'No model photo is supplied, so invent one consistent person.',
    description.trim() ? description.trim() : 'An adult with natural proportions.',
    'The model is an adult. Never draw a child or teenager.',
    costume
      ? `Dress the model in the outfit from the outfit reference (${costume.id}: ${costume.words.join(', ')}), matching its colours, layers, shoes and accessories. Do not draw the mannequin or empty body from the outfit picture.`
      : modelPhotoCount
        ? 'Keep the clothes from the model reference. Do not copy the bare mannequin body from the pose sketch.'
        : 'Dress the model in simple, everyday clothes. Do not copy the bare mannequin body from the pose sketch.',
    '',
    mode === 'sheet' ? 'Draw every pose below in one image, one pose per panel, with space between panels and no text:' : 'Draw only this pose:'
  ];

  poses.forEach((pose, index) => {
    lines.push(`${index + 1}. ${pose.name} (${pose.code}, ${pose.group}), ${pose.angle.toLowerCase()} – ${CAMERA[pose.angle] ?? pose.angle}.`);
    if (pose.people > 1) lines.push('   This is a two-person pose: match the number of people and how they are placed. The second person is a fully dressed adult with a simple face.');
  });
  lines.push('', `Scene: ${extraPrompt.trim() || 'clean studio shot, soft daylight, light grey background'}.`, 'No watermark, no text, no captions.');

  return lines.join('\n');
}
