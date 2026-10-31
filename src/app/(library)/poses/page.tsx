import { PosesScreen } from '@/app/(library)/poses/components/PosesScreen';
import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Poses' };

export default function PosesPage() {
    return <PosesScreen />;
}
