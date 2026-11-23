'use client';

import { cn } from '@/lib/utils';
import { getInAppInbox, type InAppCommunication } from '@/lib/api/auth';
import { useCommunications } from '@/components/shared/communications-provider';
import { Bell } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';

export function NotificationsBell({
  tone = 'light',
  viewAllHref = '/dashboard/notifications',
}: {
  tone?: 'light' | 'dark';
  viewAllHref?: string;
}) {
  const { summary } = useCommunications();
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<InAppCommunication[]>([]);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    getInAppInbox(0, 8, 'NOTIFICATION')
      .then((data) => setItems(data.filter((n) => !n.read).slice(0, 8)))
      .catch(() => {});
  }, [summary.unreadNotifications]);

  useEffect(() => {
    if (!open) return;
    function onPointerDown(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false);
    }
    document.addEventListener('mousedown', onPointerDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onPointerDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const unread = summary.unreadNotifications;

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        aria-label={`Notifications${unread > 0 ? `, ${unread} unread` : ''}`}
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className={cn(
          'relative transition-colors',
          tone === 'dark'
            ? 'text-white/70 hover:text-white'
            : 'text-brand-gray-500 hover:text-black',
        )}
      >
        <Bell className={tone === 'dark' ? 'size-5' : 'size-6'} />
        {unread > 0 && (
          <span className="absolute right-0 top-0 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-red-500 px-1 text-[9px] font-bold text-white">
            {unread > 99 ? '99+' : unread}
          </span>
        )}
      </button>

      {open && (
        <div
          role="menu"
          className={cn(
            'absolute right-0 top-[calc(100%+16px)] z-50 w-[380px] max-w-[calc(100vw-2rem)]',
            'rounded-[16px] border border-[#EDEDED] bg-white p-5 shadow-[0_12px_40px_rgba(0,0,0,0.12)]',
          )}
        >
          <div className="flex items-center justify-between">
            <h2 className="text-[18px] font-bold text-brand-blue">Notifications</h2>
            <Link
              href={viewAllHref}
              onClick={() => setOpen(false)}
              className="text-[12px] text-brand-blue hover:underline"
            >
              View all
            </Link>
          </div>

          <ul className="mt-3 flex flex-col">
            {items.length === 0 && (
              <li className="py-6 text-center text-[13px] text-brand-gray-400">
                No new notifications.
              </li>
            )}
            {items.map((n) => (
              <li
                key={n.id}
                className="flex items-start gap-3 rounded-[10px] bg-[#f6f6f6] px-3 py-3"
              >
                <span className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-full bg-[#e7f7ee]">
                  <Bell className="size-[18px] text-[#34a853]" />
                </span>
                <div className="flex flex-col gap-0.5">
                  <p className="text-[14px] font-bold text-[#1a1a1a]">
                    {n.subject || n.senderDisplayName}
                  </p>
                  <p className="text-[13px] leading-snug text-brand-gray-500">
                    {n.body}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
