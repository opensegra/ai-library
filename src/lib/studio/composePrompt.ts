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
  hasScene: boolean;
  description: string;
  extraPrompt: string;
  mode: LayoutMode;
}

function images(first: number, count: number): string {
  return count > 1 ? `Images ${first}–${first + count - 1}` : `Image ${first}`;
}

export function composePrompt({ poses, costume, modelPhotoCount, hasScene, description, extraPrompt, mode }: ComposePromptInput): string {
  const sheet = mode === 'sheet' && poses.length > 1;
  const roles: string[] = [];
  let next = 1;

  if (modelPhotoCount) {
    roles.push(`* ${images(next, modelPhotoCount)} – Model: Keep this person's face, hair, skin tone and body type exactly.`);
    next += modelPhotoCount;
  }
  if (hasScene) {
    roles.push(`* ${images(next, 1)} – Environment and photography: Use the background, lighting, atmosphere, camera aesthetics, and overall photographic style.`);
    next += 1;
  }
  if (costume) {
    roles.push(`* ${images(next, 1)} – Outfit and accessories: Reproduce the clothing design, fabric, pattern, colors, accessories, footwear, and styling as accurately as possible (${costume.id}: ${costume.words.join(', ')}).`);
    next += 1;
  }
  roles.push(`* ${images(next, poses.length)} – Pose and body positioning: Follow the mannequin's pose, including limb placement, body orientation, posture, and camera-facing direction.`);

  const subject = modelPhotoCount ? `Replace the mannequin with the person from ${images(1, modelPhotoCount)}, an adult.` : 'Replace the mannequin with a realistic adult female fashion model.';
  const lines = [
    'Create a highly realistic fashion editorial photograph using the provided reference images.',
    'Reference image roles:',
    ...roles,
    '',
    'Subject and composition:',
    `${subject} Preserve the reference pose and anatomical proportions while making the posture look natural and physically plausible.`
  ];

  if (description.trim()) lines.push(`The model: ${description.trim()}`);
  lines.push(sheet ? 'Show every pose below in one image, one pose per panel, with space between panels:' : 'The pose:');
  poses.forEach((pose, index) => {
    lines.push(`${index + 1}. ${pose.name} (${pose.code}, ${pose.group}), ${CAMERA[pose.angle] ? `${pose.angle.toLowerCase()} – ${CAMERA[pose.angle]}` : 'camera angle as in the 3D mannequin render'}.`);
    if (pose.people > 1) lines.push(`   This is a two-person pose: the model is the woman, posed with one adult man. ${pose.arrangement ?? 'The two are posed close together.'} Match the number of people and how they are placed. The man is fully dressed, with a simple face.`);
  });
  lines.push(
    '',
    'Clothing accuracy:',
    costume
      ? 'Reproduce the outfit faithfully. Preserve its silhouette, neckline, straps, waistline, ruffles, fabric texture, patterns, and decorative details. Include all matching accessories and footwear.'
      : modelPhotoCount
        ? 'Keep the clothes from the model photo, with realistic fit and natural fabric folds.'
        : 'Dress the model in simple, everyday clothes, with realistic fit and natural fabric folds.'
  );
  if (extraPrompt.trim() || !hasScene) lines.push('', 'Scene and direction:', `${extraPrompt.trim() || 'Clean studio shot, soft daylight, light grey background'}.`);
  lines.push(
    '',
    'Photography style:',
    'Professional fashion photography, photorealistic skin texture, realistic fabric physics, natural anatomy, detailed hair, soft cinematic lighting, realistic shadows, depth of field, accurate perspective, and high-resolution details.',
    '',
    'Important constraints:',
    "* Preserve the identity of each reference image's intended role.",
    costume ? '* Do not redesign or substitute the outfit.' : '* Do not copy the bare mannequin body from the pose drawing.',
    '* Do not unnecessarily alter the pose.',
    '* Never draw the sketch lines, joint circles or proportion guides from the pose drawing.',
    '* Avoid distorted hands, feet, fingers, limbs, or facial features.',
    '* Avoid artificial-looking skin, excessive retouching, or CGI aesthetics.',
    '* Maintain realistic garment fitting and natural fabric folds.',
    '* The model is an adult. Never draw a child or teenager. No watermark, text or captions.',
    '',
    'The final output should look like a professionally photographed fashion editorial, not an AI-generated composite.'
  );

  return lines.join('\n');
}
