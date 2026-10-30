import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

import { CollectionScreen } from '@/app/(library)/collections/[collection]/components/CollectionScreen';
import { COLLECTIONS, type CollectionKind } from '@/app/(library)/collections/[collection]/content';

export async function generateMetadata({ params }: PageProps<'/collections/[collection]'>): Promise<Metadata> {
  const { collection } = await params;

  return { title: COLLECTIONS[collection as CollectionKind]?.title ?? 'Collection' };
}

export function generateStaticParams() {
  return Object.keys(COLLECTIONS).map(collection => ({ collection }));
}

export default async function CollectionPage({ params }: PageProps<'/collections/[collection]'>) {
  const { collection } = await params;

  if (!(collection in COLLECTIONS)) notFound();

  return <CollectionScreen kind={collection as CollectionKind} />;
}
