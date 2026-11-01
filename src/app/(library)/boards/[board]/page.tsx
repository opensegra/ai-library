import type { Metadata } from 'next';

import { BoardScreen } from '@/app/(library)/boards/[board]/components/BoardScreen';
import { Skeleton } from '@/components/ui/skeleton';
import { Suspense } from 'react';

export async function generateMetadata({ params }: PageProps<'/boards/[board]'>): Promise<Metadata> {
    return { title: decodeURIComponent((await params).board) };
}

export default function BoardPage({ params }: PageProps<'/boards/[board]'>) {
    return (
        <Suspense fallback={<BoardFallback />}>
            {params.then(({ board }) => (
                <BoardScreen board={decodeURIComponent(board)} />
            ))}
        </Suspense>
    );
}

function BoardFallback() {
    return (
        <div className="flex-1 space-y-4 p-4" aria-label="Loading board">
            <Skeleton className="h-7 w-40" />
            <Skeleton className="h-10 w-full" />
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-6">
                {Array.from({ length: 12 }, (_, index) => <Skeleton key={index} className="aspect-[3/4] rounded-lg" />)}
            </div>
        </div>
    );
}
