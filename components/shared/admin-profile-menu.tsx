'use client';

import { cn } from '@/lib/utils';
import { LogOut, Settings, UserRound } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { getProfile, logout } from '@/lib/api/auth';
import { USE_LIVE_API } from '@/lib/api/config';

function roleLabel(roles: string[] | undefined): string {
  if (!roles?.length) return 'Admin';
  const r = roles[0];
  const map: Record<string, string> = {
    SUPER_ADMIN: 'Super Admin',
    SYSTEM_ADMIN: 'System Admin',
    CHURCH_ADMIN: 'Church Admin',
    SERMON_ADMIN: 'Sermon Admin',
    GROUP_LEADER: 'Group Leader',
    MINISTRY_ADMIN: 'Ministry Admin',
    ADMIN: 'Admin',
  };
  return map[r] ?? r.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

export function AdminProfileMenu({
  profileHref,
  settingsHref,
  tone = 'light',
}: {
  profileHref: string;
  settingsHref: string;
  tone?: 'light' | 'dark';
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const [displayName, setDisplayName] = useState('Admin');
  const [displayRole, setDisplayRole] = useState('Admin');

  useEffect(() => {
    if (!USE_LIVE_API) return;
    getProfile()
      .then((p) => {
        if (!p) return;
        const full = p.displayName ?? [p.firstName, p.lastName].filter(Boolean).join(' ');
        if (full) setDisplayName(full);
        setDisplayRole(roleLabel(p.roles));
      })
      .catch(() => {});
  }, []);

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

  const handleLogout = async () => {
    setOpen(false);
    if (USE_LIVE_API) {
      try { await logout(); } catch { /* fall through */ }
    }
    router.push('/auth/login');
  };

  const initials = displayName
    .split(' ')
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? '')
    .join('');

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        aria-label="Account menu"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className={cn(
          'flex items-center gap-2 rounded-full py-1 pl-1 pr-2 transition-colors',
          tone === 'dark'
            ? 'hover:bg-white/10'
            : 'hover:bg-[#f4f4f4]'
        )}
      >
        <span
          className={cn(
            'flex size-8 shrink-0 items-center justify-center rounded-full text-[12px] font-bold',
            tone === 'dark'
              ? 'bg-white/20 text-white'
              : 'bg-brand-blue/15 text-brand-blue'
          )}
        >
          {initials || <UserRound className="size-4" />}
        </span>
        <span
          className={cn(
            'hidden text-[13px] font-medium md:inline',
            tone === 'dark' ? 'text-white' : 'text-[#1a1a1a]'
          )}
        >
          {displayName}
        </span>
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 top-[calc(100%+10px)] z-50 w-[260px] overflow-hidden rounded-[14px] border border-[#e8e8e8] bg-white shadow-[0_16px_48px_rgba(0,0,0,0.16)]"
        >
          {/* Leadremit branded header */}
          <div className="flex items-center gap-3 bg-[#152242] px-4 py-3">
            <Image
              src="/leadremit-logo-white.svg"
              alt="Leadremit"
              width={90}
              height={28}
              className="h-[22px] w-auto"
            />
            <span className="text-[12px] font-semibold text-white/80">Account</span>
          </div>

          {/* User identity */}
          <div className="flex items-center gap-3 border-b border-[#f0f0f0] px-4 py-3">
            <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-brand-blue/15 text-[12px] font-bold text-brand-blue">
              {initials || <UserRound className="size-4 text-brand-blue" />}
            </span>
            <span className="min-w-0">
              <span className="block truncate text-[13px] font-semibold text-[#1a1a1a]">
                {displayName}
              </span>
              <span className="block truncate text-[11px] text-brand-gray-500">
                {displayRole}
              </span>
            </span>
          </div>

          {/* Menu items */}
          <div className="p-1.5">
            <Link
              href={profileHref}
              onClick={() => setOpen(false)}
              className="flex items-center gap-2.5 rounded-[8px] px-3 py-2.5 text-[13px] text-[#343434] no-underline transition-colors hover:bg-[#f4f7ff]"
            >
              <UserRound className="size-4" />
              Profile
            </Link>

            <Link
              href={settingsHref}
              onClick={() => setOpen(false)}
              className="flex items-center gap-2.5 rounded-[8px] px-3 py-2.5 text-[13px] text-[#343434] no-underline transition-colors hover:bg-[#f4f7ff]"
            >
              <Settings className="size-4" />
              Settings
            </Link>

            <button
              type="button"
              onClick={handleLogout}
              className="flex w-full items-center gap-2.5 rounded-[8px] px-3 py-2.5 text-left text-[13px] text-[#eb0000] transition-colors hover:bg-[#fde8e8]"
            >
              <LogOut className="size-4" />
              Log out
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
