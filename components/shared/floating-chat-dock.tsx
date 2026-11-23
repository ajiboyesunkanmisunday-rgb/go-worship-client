'use client';

import { cn } from '@/lib/utils';
import {
  getInAppConversation,
  getInAppConversations,
  markInAppReceiptRead,
  sendInAppMessage,
  type InAppCommunication,
  type InAppConversation,
} from '@/lib/api/auth';
import { useCommunications } from '@/components/shared/communications-provider';
import {
  Maximize2,
  MessageSquare,
  Minimize2,
  Send,
  X,
} from 'lucide-react';
import {
  type FormEvent,
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react';

function formatTime(iso: string) {
  try {
    return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  } catch {
    return '';
  }
}

function ConversationList({
  conversations,
  selected,
  onSelect,
}: {
  conversations: InAppConversation[];
  selected: string | undefined;
  onSelect: (id: string) => void;
}) {
  return (
    <aside className="flex h-full w-[160px] shrink-0 flex-col border-r border-[#f0f0f0]">
      <p className="px-3 py-2 text-[11px] font-semibold uppercase tracking-wide text-brand-gray-400">
        Conversations
      </p>
      <div className="flex flex-1 flex-col gap-0.5 overflow-y-auto px-2">
        {conversations.length === 0 && (
          <p className="px-1 py-2 text-[12px] text-brand-gray-400">
            No conversations yet.
          </p>
        )}
        {conversations.map((c) => (
          <button
            key={c.id}
            type="button"
            onClick={() => onSelect(c.id)}
            className={cn(
              'flex w-full items-center justify-between gap-1 rounded-[6px] px-2 py-2 text-left text-[12px] transition-colors',
              selected === c.id
                ? 'bg-brand-blue text-white'
                : 'text-[#333] hover:bg-brand-blue/5',
            )}
          >
            <span className="truncate">{c.subject || 'Conversation'}</span>
            {c.unreadCount > 0 && (
              <span
                className={cn(
                  'flex h-4 min-w-[16px] items-center justify-center rounded-full px-1 text-[10px] font-bold',
                  selected === c.id
                    ? 'bg-white text-brand-blue'
                    : 'bg-brand-blue text-white',
                )}
              >
                {c.unreadCount > 99 ? '99+' : c.unreadCount}
              </span>
            )}
          </button>
        ))}
      </div>
    </aside>
  );
}

function MessageThread({
  messages,
  conversation,
  onSend,
  sending,
  error,
}: {
  messages: InAppCommunication[];
  conversation: InAppConversation | undefined;
  onSend: (body: string) => Promise<void>;
  sending: boolean;
  error: string;
}) {
  const [draft, setDraft] = useState('');
  const bottom = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottom.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!draft.trim() || sending) return;
    const text = draft.trim();
    setDraft('');
    await onSend(text);
  };

  if (!conversation) {
    return (
      <div className="flex flex-1 items-center justify-center text-[13px] text-brand-gray-400">
        Select a conversation
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      <div className="flex flex-1 flex-col gap-2 overflow-y-auto p-3">
        {messages.length === 0 && (
          <p className="text-center text-[12px] text-brand-gray-400">
            No messages yet.
          </p>
        )}
        {messages.map((msg) => (
          <div key={msg.id} className="flex flex-col gap-0.5">
            <p className="text-[11px] font-semibold text-brand-gray-500">
              {msg.senderDisplayName}
            </p>
            <div className="max-w-[90%] rounded-[8px] bg-[#f1f4ff] px-3 py-2 text-[12px] leading-snug text-[#1a1a1a]">
              {msg.body}
            </div>
            <p className="text-[10px] text-brand-gray-400">
              {formatTime(msg.createdAt)}
            </p>
          </div>
        ))}
        <div ref={bottom} />
      </div>

      {error && (
        <p className="px-3 pb-1 text-[11px] text-red-500">{error}</p>
      )}

      {conversation.closed ? (
        <p className="px-3 py-2 text-center text-[12px] text-brand-gray-400">
          This conversation is closed.
        </p>
      ) : (
        <form
          onSubmit={handleSubmit}
          className="flex items-center gap-2 border-t border-[#f0f0f0] p-2"
        >
          <input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="Type a message…"
            maxLength={8000}
            className="flex-1 rounded-[6px] border border-[#e0e0e0] px-2 py-1.5 text-[12px] outline-none focus:border-brand-blue"
          />
          <button
            type="submit"
            disabled={sending || !draft.trim()}
            className="flex size-7 items-center justify-center rounded-full bg-brand-blue text-white transition-opacity disabled:opacity-40"
            aria-label="Send"
          >
            <Send className="size-3.5" />
          </button>
        </form>
      )}
    </div>
  );
}

export function FloatingChatDock() {
  const { summary, refresh } = useCommunications();
  const [open, setOpen] = useState(false);
  const [large, setLarge] = useState(false);
  const [conversations, setConversations] = useState<InAppConversation[]>([]);
  const [selected, setSelected] = useState<string>();
  const [messages, setMessages] = useState<InAppCommunication[]>([]);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const mounted = useRef(true);

  const loadConversations = useCallback(async () => {
    try {
      const data = await getInAppConversations();
      if (!mounted.current) return;
      setConversations(data);
      setSelected((prev) =>
        data.some((c) => c.id === prev) ? prev : data[0]?.id,
      );
    } catch {
      // Keep existing state
    }
  }, []);

  const loadMessages = useCallback(async (convId: string) => {
    try {
      const data = await getInAppConversation(convId);
      if (!mounted.current) return;
      setMessages(data);
      const unread = data.filter((m) => m.receiptId && !m.read);
      if (unread.length) {
        await Promise.all(
          unread.map((m) => markInAppReceiptRead(m.receiptId!)),
        );
        await refresh();
      }
    } catch {
      // Keep existing state
    }
  }, [refresh]);

  useEffect(() => {
    mounted.current = true;
    return () => { mounted.current = false; };
  }, []);

  useEffect(() => {
    if (!open) return;
    void loadConversations();
  }, [open, loadConversations]);

  useEffect(() => {
    if (!selected) return;
    setMessages([]);
    void loadMessages(selected);
  }, [selected, loadMessages]);

  useEffect(() => {
    const handler = () => {
      if (!open) return;
      void loadConversations();
      if (selected) void loadMessages(selected);
    };
    window.addEventListener('gw:communication', handler);
    return () => window.removeEventListener('gw:communication', handler);
  }, [open, selected, loadConversations, loadMessages]);

  const handleSend = async (body: string) => {
    if (!selected) return;
    setSending(true);
    setError('');
    try {
      await sendInAppMessage(selected, { body });
      await loadMessages(selected);
    } catch {
      setError('Failed to send message.');
    } finally {
      setSending(false);
    }
  };

  const unreadChats = summary.unreadChats;
  const selectedConv = conversations.find((c) => c.id === selected);

  return (
    <div
      className={cn(
        'fixed bottom-6 right-6 z-50 flex flex-col items-end gap-2',
      )}
    >
      {open && (
        <div
          className={cn(
            'flex flex-col overflow-hidden rounded-[16px] border border-[#e8e8e8] bg-white shadow-[0_8px_32px_rgba(0,0,0,0.14)]',
            large
              ? 'h-[520px] w-[600px] max-w-[calc(100vw-3rem)]'
              : 'h-[380px] w-[420px] max-w-[calc(100vw-3rem)]',
          )}
        >
          {/* Header */}
          <header className="flex items-center justify-between gap-2 border-b border-[#f0f0f0] bg-brand-blue px-3 py-2.5">
            <p className="text-[13px] font-semibold text-white">Chat</p>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                aria-label={large ? 'Collapse' : 'Expand'}
                onClick={() => setLarge((v) => !v)}
                className="rounded p-0.5 text-white/80 transition-colors hover:text-white"
              >
                {large ? (
                  <Minimize2 className="size-3.5" />
                ) : (
                  <Maximize2 className="size-3.5" />
                )}
              </button>
              <button
                type="button"
                aria-label="Close chat"
                onClick={() => setOpen(false)}
                className="rounded p-0.5 text-white/80 transition-colors hover:text-white"
              >
                <X className="size-3.5" />
              </button>
            </div>
          </header>

          {/* Body */}
          <div className="flex flex-1 overflow-hidden">
            <ConversationList
              conversations={conversations}
              selected={selected}
              onSelect={(id) => setSelected(id)}
            />
            <MessageThread
              messages={messages}
              conversation={selectedConv}
              onSend={handleSend}
              sending={sending}
              error={error}
            />
          </div>
        </div>
      )}

      {/* Launcher button */}
      <button
        type="button"
        aria-label={`Open chat${unreadChats > 0 ? `, ${unreadChats} unread` : ''}`}
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className="relative flex size-14 items-center justify-center rounded-full bg-brand-blue text-white shadow-[0_4px_16px_rgba(0,117,255,0.4)] transition-transform hover:scale-105 active:scale-95"
      >
        {open ? (
          <X className="size-5" />
        ) : (
          <MessageSquare className="size-5" />
        )}
        {!open && unreadChats > 0 && (
          <span className="absolute right-0.5 top-0.5 flex h-5 min-w-[20px] items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
            {unreadChats > 99 ? '99+' : unreadChats}
          </span>
        )}
      </button>
    </div>
  );
}
