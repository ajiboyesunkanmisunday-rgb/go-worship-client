'use client';

import { ConfirmModal } from '@/components/shared/confirm-modal';
import { cn } from '@/lib/utils';
import { LogOut, UserRound, UserRoundX } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { getProfile } from '@/lib/api/auth';
import { USE_LIVE_API } from '@/lib/api/config';

/**
 * Avatar menu in the member top bar — surfaces the Profile page actions
 * (view profile / deactivate / log out) without navigating first.
 */
export function ProfileMenu({
  name: nameProp,
  email: emailProp,
  profileHref = '/dashboard/profile',
}: {
  name?: string;
  email?: string;
  profileHref?: string;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [deactivate, setDeactivate] = useState(false);
  const [logout, setLogout] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const [displayName, setDisplayName] = useState(nameProp ?? 'Natashia Khalerira');
  const [displayEmail, setDisplayEmail] = useState(emailProp ?? 'Khalerira002@gmail.com');

  useEffect(() => {
    if (!USE_LIVE_API) return;
    getProfile().then((p) => {
      if (!p) return;
      const full = [p.firstName, p.lastName].filter(Boolean).join(' ');
      if (full) setDisplayName(full);
      if (p.email) setDisplayEmail(p.email);
    }).catch(() => {});
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

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        aria-label="Account menu"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className={cn(
          'size-9 shrink-0 overflow-hidden rounded-full border-[1.5px] border-white bg-brand-gray-200 ring-1 ring-[#EDEDED]',
          'transition-shadow hover:ring-brand-blue/40'
        )}
      >
        <Image
          src="/User.svg"
          alt="Profile"
          width={36}
          height={36}
          className="size-full object-cover"
        />
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 top-[calc(100%+12px)] z-50 w-[248px] overflow-hidden rounded-[12px] border border-[#ededed] bg-white shadow-[0_12px_40px_rgba(0,0,0,0.14)]"
        >
          <div className="flex items-center gap-3 border-b border-[#f0f0f0] px-4 py-3">
            <span className="size-9 shrink-0 overflow-hidden rounded-full bg-brand-gray-200">
              <Image
                src="/User.svg"
                alt=""
                width={36}
                height={36}
                className="size-full object-cover"
              />
            </span>
            <span className="min-w-0">
              <span className="block truncate text-[13px] font-semibold text-[#1a1a1a]">
                {displayName}
              </span>
              <span className="block truncate text-[11px] text-brand-gray-500">
                {displayEmail}
              </span>
            </span>
          </div>

          <div className="p-1.5">
            <Link
              href={profileHref}
              onClick={() => setOpen(false)}
              className="flex items-center gap-2.5 rounded-[8px] px-3 py-2.5 text-[13px] text-[#343434] no-underline transition-colors hover:bg-[#f4f7ff]"
            >
              <UserRound className="size-4" />
              View Profile
            </Link>

            <button
              type="button"
              onClick={() => {
                setOpen(false);
                setDeactivate(true);
              }}
              className="flex w-full items-center gap-2.5 rounded-[8px] px-3 py-2.5 text-left text-[13px] text-[#343434] transition-colors hover:bg-[#f4f7ff]"
            >
              <UserRoundX className="size-4" />
              Deactivate account
            </button>

            <button
              type="button"
              onClick={() => {
                setOpen(false);
                setLogout(true);
              }}
              className="flex w-full items-center gap-2.5 rounded-[8px] px-3 py-2.5 text-left text-[13px] text-[#eb0000] transition-colors hover:bg-[#fde8e8]"
            >
              <LogOut className="size-4" />
              Log out
            </button>
          </div>
        </div>
      )}

      <ConfirmModal
        open={deactivate}
        onOpenChange={setDeactivate}
        onConfirm={() => {
          setDeactivate(false);
          router.push('/auth/login');
        }}
      />
      <ConfirmModal
        open={logout}
        onOpenChange={setLogout}
        onConfirm={() => {
          setLogout(false);
          router.push('/auth/login');
        }}
      />
    </div>
  );
}
