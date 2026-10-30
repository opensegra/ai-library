import type { Metadata } from 'next';

import { PoseFromImageScreen } from '@/app/(library)/pose-from-image/components/PoseFromImageScreen';

export const metadata: Metadata = { title: 'Pose from your image' };

export default function PoseFromImagePage() {
  return <PoseFromImageScreen />;
}
