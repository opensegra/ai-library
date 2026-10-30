import type { Metadata } from 'next';

import { PosesScreen } from '@/app/(library)/poses/components/PosesScreen';

export const metadata: Metadata = { title: 'Poses' };

export default function PosesPage() {
  return <PosesScreen />;
}
