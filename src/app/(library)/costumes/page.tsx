import { CostumesScreen } from '@/app/(library)/costumes/components/CostumesScreen';
import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Costumes' };

export default function CostumesPage() {
    return <CostumesScreen />;
}
