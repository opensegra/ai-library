import type { Metadata } from 'next';

import { BoardScreen } from '@/app/(library)/boards/[board]/components/BoardScreen';

export async function generateMetadata({ params }: PageProps<'/boards/[board]'>): Promise<Metadata> {
    return { title: decodeURIComponent((await params).board) };
}

export default async function BoardPage({ params }: PageProps<'/boards/[board]'>) {
    return <BoardScreen board={decodeURIComponent((await params).board)} />;
}
