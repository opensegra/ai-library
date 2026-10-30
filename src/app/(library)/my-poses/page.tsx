import type { Metadata } from 'next';

import { MyPosesScreen } from '@/app/(library)/my-poses/components/MyPosesScreen';

export const metadata: Metadata = { title: 'My poses' };

export default function MyPosesPage() {
  return <MyPosesScreen />;
}
