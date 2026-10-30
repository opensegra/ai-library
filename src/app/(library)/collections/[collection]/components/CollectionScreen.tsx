'use client';

import { useCollectionScreen } from '@/app/(library)/collections/[collection]/components/useCollectionScreen';
import type { CollectionKind } from '@/app/(library)/collections/[collection]/content';
import { ItemBrowser } from '@/components/library/ItemBrowser';

interface CollectionScreenProps {
  kind: CollectionKind;
}

export function CollectionScreen({ kind }: CollectionScreenProps) {
  const { title, items, empty, showsPoses } = useCollectionScreen(kind);

  return <ItemBrowser title={title} items={items} showsPoses={showsPoses} emptyText={empty} />;
}
