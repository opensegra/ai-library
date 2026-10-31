import { PoseFromImageScreen } from '@/app/(library)/pose-from-image/components/PoseFromImageScreen';
import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Pose from your image' };

export default function PoseFromImagePage() {
    return <PoseFromImageScreen />;
}
