'use client';

import { cn } from '@/lib/utils';
import {
  archiveInAppReceipt,
  getInAppInbox,
  markInAppReceiptRead,
  markInAppReceiptUnread,
  type InAppCommunication,
} from '@/lib/api/auth';
import { useCommunications } from '@/components/shared/communications-provider';
import { Archive, Bell } from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

function formatDate(iso: string) {
  try {
    return new Date(iso).toLocaleString([], {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return iso;
  }
}

export default function NotificationsPage() {
  const { refresh } = useCommunications();
  const [items, setItems] = useState<InAppCommunication[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    try {
      const data = await getInAppInbox(0, 50, 'NOTIFICATION');
      setItems(data);
    } catch {
      toast.error('Could not load notifications.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
    const handler = () => void load();
    window.addEventListener('gw:communication', handler);
    return () => window.removeEventListener('gw:communication', handler);
  }, []);

  const toggleRead = async (item: InAppCommunication) => {
    if (!item.receiptId) return;
    try {
      if (item.read) {
        await markInAppReceiptUnread(item.receiptId);
      } else {
        await markInAppReceiptRead(item.receiptId);
      }
      await Promise.all([load(), refresh()]);
    } catch {
      toast.error('Failed to update notification.');
    }
  };

  const archive = async (item: InAppCommunication) => {
    if (!item.receiptId) return;
    try {
      await archiveInAppReceipt(item.receiptId);
      await Promise.all([load(), refresh()]);
    } catch {
      toast.error('Failed to archive notification.');
    }
  };

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center gap-3">
        <span className="flex size-10 items-center justify-center rounded-full bg-[#e7f7ee]">
          <Bell className="size-5 text-[#34a853]" />
        </span>
        <div>
          <h1 className="text-[22px] font-bold">Notifications</h1>
          <p className="text-[13px] text-brand-gray-500">
            {items.filter((i) => !i.read).length} unread
          </p>
        </div>
      </div>

      <div className="flex flex-col gap-2">
        {loading && (
          <div className="flex items-center justify-center py-16">
            <span className="size-6 animate-spin rounded-full border-2 border-brand-blue border-t-transparent" />
          </div>
        )}

        {!loading && items.length === 0 && (
          <div className="flex flex-col items-center justify-center gap-3 rounded-[14px] bg-white py-16">
            <Bell className="size-10 text-brand-gray-300" />
            <p className="text-[15px] text-brand-gray-400">No notifications yet.</p>
          </div>
        )}

        {items.map((item) => (
          <div
            key={item.id}
            className={cn(
              'flex items-start gap-4 rounded-[12px] border border-[#f0f0f0] bg-white p-4 transition-colors',
              !item.read && 'border-[#34a853]/20 bg-[#f4fdf7]',
            )}
          >
            <span
              className={cn(
                'mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-full',
                item.read ? 'bg-[#f4f4f4]' : 'bg-[#e7f7ee]',
              )}
            >
              <Bell
                className={cn(
                  'size-4',
                  item.read ? 'text-brand-gray-400' : 'text-[#34a853]',
                )}
              />
            </span>

            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2">
                <p className="text-[14px] font-semibold text-[#1a1a1a]">
                  {item.subject || item.senderDisplayName}
                </p>
                {!item.read && (
                  <span className="shrink-0 rounded-full bg-[#34a853] px-2 py-0.5 text-[10px] font-bold text-white">
                    New
                  </span>
                )}
              </div>
              <p className="mt-1 text-[13px] leading-snug text-brand-gray-500">
                {item.body}
              </p>
              <div className="mt-2 flex items-center gap-3">
                <span className="text-[11px] text-brand-gray-400">
                  {item.senderDisplayName} · {formatDate(item.createdAt)}
                </span>
                {item.actionUrl && (
                  <a
                    href={item.actionUrl}
                    className="text-[11px] text-brand-blue underline"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Open
                  </a>
                )}
              </div>
            </div>

            <div className="flex shrink-0 flex-col items-end gap-1.5">
              {item.receiptId && (
                <>
                  <button
                    type="button"
                    onClick={() => void toggleRead(item)}
                    className="text-[11px] text-brand-blue hover:underline"
                  >
                    Mark {item.read ? 'unread' : 'read'}
                  </button>
                  <button
                    type="button"
                    onClick={() => void archive(item)}
                    className="flex items-center gap-1 text-[11px] text-brand-gray-400 hover:text-brand-gray-600"
                  >
                    <Archive className="size-3" />
                    Archive
                  </button>
                </>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
