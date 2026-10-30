'use client';

import { Loader2Icon, SquarePenIcon, Trash2Icon } from 'lucide-react';

import { useChatList } from '@/app/(library)/studio/components/useChatList';
import type { ChatSummary } from '@/app/(library)/studio/components/useStudioScreen';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface ChatListProps {
  chats: ChatSummary[];
  currentId: string;
  onOpen: (chatId: string) => void;
  onNew: () => void;
  onDelete: (chatId: string) => void;
}

export function ChatList({ chats, currentId, onOpen, onNew, onDelete }: ChatListProps) {
  const { confirming, remove } = useChatList(onDelete);
  const current = chats.some(chat => chat.id === currentId);

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-2">
      <Button variant="outline" size="sm" className="justify-start" onClick={onNew}>
        <SquarePenIcon />
        New chat
      </Button>
      <div className="flex min-h-0 flex-1 flex-col gap-0.5 overflow-y-auto">
        {current ? null : <div className="rounded-md bg-accent px-2 py-2 text-sm">New chat</div>}
        {chats.map(chat => (
          <div key={chat.id} className={cn('group flex items-center gap-1 rounded-md pr-1 hover:bg-accent', chat.id === currentId && 'bg-accent')}>
            <button type="button" onClick={() => onOpen(chat.id)} className="flex min-w-0 flex-1 flex-col items-start px-2 py-1.5 text-left" aria-current={chat.id === currentId}>
              <span className="w-full truncate text-sm">{chat.title}</span>
              <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
                {chat.running ? <Loader2Icon className="size-3 animate-spin" /> : null}
                {chat.running ? 'Generating · ' : ''}
                {chat.images} {chat.images === 1 ? 'image' : 'images'} · {new Date(chat.updatedAt).toLocaleDateString()}
              </span>
            </button>
            <Button
              variant="ghost"
              size={confirming === chat.id ? 'xs' : 'icon-xs'}
              aria-label={`Delete chat ${chat.title}`}
              className={cn('text-muted-foreground', confirming === chat.id ? 'text-destructive' : 'opacity-0 group-hover:opacity-100 focus-visible:opacity-100')}
              onClick={() => remove(chat.id)}
            >
              <Trash2Icon />
              {confirming === chat.id ? 'Delete?' : null}
            </Button>
          </div>
        ))}
        {chats.length ? null : <p className="px-2 py-1 text-xs text-muted-foreground">Your chats appear here, saved in this browser.</p>}
      </div>
    </div>
  );
}
