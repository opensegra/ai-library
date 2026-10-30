import type { Metadata } from 'next';

import { CostumesScreen } from '@/app/(library)/costumes/components/CostumesScreen';

export const metadata: Metadata = { title: 'Costumes' };

export default function CostumesPage() {
  return <CostumesScreen />;
}
