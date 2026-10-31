import { MyPosesScreen } from '@/app/(library)/my-poses/components/MyPosesScreen';
import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'My poses' };

export default function MyPosesPage() {
    return <MyPosesScreen />;
}
