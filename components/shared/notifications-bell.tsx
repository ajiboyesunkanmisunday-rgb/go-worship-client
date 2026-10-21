'use client';

import { cn } from '@/lib/utils';
import { Bell } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { api } from '@/lib/api/client';
import { USE_LIVE_API } from '@/lib/api/config';

type Notification = {
  title: string;
  body: string;
  unread?: boolean;
};

/** Matches Figma "All Notification" panel (114:6466). */
const NOTIFICATIONS: Notification[] = [
  {
    title: 'Upcoming Event Reminder',
    body: 'Midweek Recharge starts today at 6:00 PM.',
    unread: true,
  },
  {
    title: 'Event Registration Updates',
    body: "You're registered for Faith Conference 2025.",
  },
  {
    title: 'Group Meeting Reminders',
    body: 'Receive reminders for meetings in your groups.',
  },
  {
    title: 'Group Announcements',
    body: 'New announcement from the Youth Fellowship group.',
  },
  {
    title: 'Giving Confirmation',
    body: 'Thank you for your gift of ₦25,000. Your receipt is ready.',
  },
];

export function NotificationsBell({
  tone = 'light',
}: {
  tone?: 'light' | 'dark';
}) {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>(USE_LIVE_API ? [] : NOTIFICATIONS);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Both /self/notifications and /tenant/notifications returned 404 in localhost HAR.
    // Disabled until correct endpoint is confirmed from live DO.
    void USE_LIVE_API;
  }, []);

  useEffect(() => {
    if (!open) return;
    function onPointerDown(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
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

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        aria-label="Notifications"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className={cn(
          'relative transition-colors',
          tone === 'dark'
            ? 'text-white/70 hover:text-white'
            : 'text-brand-gray-500 hover:text-black'
        )}
      >
        <Bell className={tone === 'dark' ? 'size-5' : 'size-6'} />
        {notifications.some((n) => n.unread) && (
          <span className="absolute top-0 right-0 size-[7px] rounded-full bg-brand-red" />
        )}
      </button>

      {open && (
        <div
          role="menu"
          className={cn(
            'absolute right-0 top-[calc(100%+16px)] z-50 w-[380px] max-w-[calc(100vw-2rem)]',
            'rounded-[16px] border border-[#EDEDED] bg-white p-5 shadow-[0_12px_40px_rgba(0,0,0,0.12)]'
          )}
        >
          <h2 className="text-[20px] font-bold text-brand-blue">
            All Notification
          </h2>

          <ul className="mt-3 flex flex-col">
            {notifications.map((n, i) => (
              <li
                key={i}
                className={cn(
                  'flex items-start gap-3 rounded-[10px] px-3 py-3',
                  n.unread && 'bg-[#f6f6f6]'
                )}
              >
                <span className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-full bg-[#e7f7ee]">
                  <Bell className="size-[18px] text-[#34a853]" />
                </span>
                <div className="flex flex-col gap-0.5">
                  <p className="text-[14px] font-bold text-[#1a1a1a]">
                    {n.title}
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
