'use client';

import { cn } from '@/lib/utils';
import { ChevronDown, House } from 'lucide-react';
import { useRouter, usePathname } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';

/**
 * Role switcher — matches the Figma design exactly: the button shows the
 * CURRENT role name, and the dropdown offers the three account categories
 * (Member / Staff · Volunteer / Church Admin) with the active one highlighted.
 */

/** Specific portal -> label shown on the button + which category it belongs to. */
const PORTALS = [
  { match: '/dashboard', label: 'Member', category: 'member' },
  { match: '/group-leader', label: 'Group Leader', category: 'staff' },
  { match: '/ministry-admin', label: 'Ministry Admin', category: 'staff' },
  { match: '/sermon-admin', label: 'Sermon Admin', category: 'staff' },
  { match: '/ministry', label: 'Church Admin', category: 'church-admin' },
] as const;

const CATEGORIES = [
  { key: 'member', label: 'Member', href: '/dashboard' },
  { key: 'staff', label: 'Staff / Volunteer', href: '/ministry-admin/dashboard' },
  { key: 'church-admin', label: 'Church Admin', href: '/ministry/dashboard' },
] as const;

function currentPortal(pathname: string) {
  // Longest match first so /ministry-admin doesn't collide with /ministry.
  const sorted = [...PORTALS].sort((a, b) => b.match.length - a.match.length);
  return sorted.find((p) => pathname.startsWith(p.match)) ?? PORTALS[0];
}

export function RoleSwitcher() {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const portal = currentPortal(pathname);

  useEffect(() => {
    if (!open) return;
    function onDown(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false);
    }
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        aria-label="Switch role"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center gap-2 rounded-[8px] border border-[#ededed] p-1.5 transition-colors hover:bg-[#f4f7ff]"
      >
        <span className="flex size-9 shrink-0 items-center justify-center rounded-[8px] bg-[#c7c4ff]">
          <House className="size-[18px] text-[#3f44c0]" />
        </span>
        <span className="flex-1 text-left text-[13px] font-medium text-[#1a1a1a]">
          {portal.label}
        </span>
        <ChevronDown
          className={cn(
            'size-4 shrink-0 text-brand-gray-500 transition-transform',
            open && 'rotate-180'
          )}
        />
      </button>

      {open && (
        <div
          role="menu"
          className="absolute left-2 top-[calc(100%+4px)] z-50 w-[190px] rounded-[12px] bg-white p-2 shadow-[0_10px_36px_rgba(0,0,0,0.16)]"
        >
          {CATEGORIES.map((c) => {
            const isActive = c.key === portal.category;
            return (
              <button
                key={c.key}
                type="button"
                role="menuitem"
                onClick={() => {
                  setOpen(false);
                  if (!isActive) router.push(c.href);
                }}
                className={cn(
                  'flex w-full items-center rounded-[8px] px-3 py-2.5 text-left text-[14px] transition-colors',
                  isActive
                    ? 'bg-[#dbe4f5] font-medium text-[#3f5b9c]'
                    : 'text-[#1a1a1a] hover:bg-[#f4f7ff]'
                )}
              >
                {c.label}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
