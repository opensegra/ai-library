import { CollectionScreen } from '@/app/(library)/collections/[collection]/components/CollectionScreen';
import { COLLECTIONS, type CollectionKind } from '@/app/(library)/collections/[collection]/content';
import { Skeleton } from '@/components/ui/skeleton';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { Suspense } from 'react';

export async function generateMetadata({ params }: PageProps<'/collections/[collection]'>): Promise<Metadata> {
    const { collection } = await params;

    return { title: COLLECTIONS[collection as CollectionKind]?.title ?? 'Collection' };
}

export function generateStaticParams() {
    return Object.keys(COLLECTIONS).map((collection) => ({ collection }));
}

export default function CollectionPage({ params }: PageProps<'/collections/[collection]'>) {
    return (
        <Suspense fallback={<CollectionFallback />}>
            {params.then(({ collection }) => (
                <CollectionDetails collection={collection} />
            ))}
        </Suspense>
    );
}

function CollectionDetails({ collection }: { collection: string }) {
    if (!(collection in COLLECTIONS)) notFound();

    return <CollectionScreen kind={collection as CollectionKind} />;
}

function CollectionFallback() {
    return (
        <div className="flex-1 space-y-4 p-4" aria-label="Loading collection">
            <Skeleton className="h-7 w-40" />
            <Skeleton className="h-10 w-full" />
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-6">
                {Array.from({ length: 12 }, (_, index) => <Skeleton key={index} className="aspect-[3/4] rounded-lg" />)}
            </div>
        </div>
    );
}
