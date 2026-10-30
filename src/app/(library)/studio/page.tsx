import type { Metadata } from 'next';

import { StudioScreen } from '@/app/(library)/studio/components/StudioScreen';

export const metadata: Metadata = { title: 'Studio' };

export default function StudioPage() {
  return <StudioScreen />;
}
