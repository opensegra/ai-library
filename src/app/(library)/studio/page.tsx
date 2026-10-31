import { StudioScreen } from '@/app/(library)/studio/components/StudioScreen';
import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Studio' };

export default function StudioPage() {
    return <StudioScreen />;
}
