'use client';

import { useBoardScreen } from '@/app/(library)/boards/[board]/components/useBoardScreen';
import { ItemBrowser } from '@/components/library/ItemBrowser';

interface BoardScreenProps {
  board: string;
}

export function BoardScreen({ board }: BoardScreenProps) {
  const { items, showsPoses, exists } = useBoardScreen(board);

  return <ItemBrowser title={board} items={items} showsPoses={showsPoses} emptyText={exists ? 'Use Add to board on any pose or costume to collect it here.' : 'This board does not exist in this browser.'} />;
}
