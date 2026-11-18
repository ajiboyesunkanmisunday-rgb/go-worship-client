'use client';

import { ConfirmModal } from '@/components/shared/confirm-modal';
import { cn } from '@/lib/utils';
import { MoreHorizontal } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { deleteSystemUser } from '@/lib/api/system';
import { forgotPassword } from '@/lib/api/auth';
import { executeRecaptcha } from '@/lib/recaptcha';
import { USE_LIVE_API } from '@/lib/api/config';

type Props = {
  userId: string;
  userEmail: string;
  userName: string;
  onRefresh?: () => void;
};

/** Row "⋯" menu on Platform Users (System board). */
export function UserRowMenu({ userId, userEmail, userName, onRefresh }: Props) {
  const [open, setOpen] = useState(false);
  const [confirm, setConfirm] = useState(false);
  const [busy, setBusy] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(() => {
    if (!open) return;
    function onDown(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, [open]);

  const ITEMS = [
    { key: 'view',       label: 'View details' },
    { key: 'edit',       label: 'Edit User' },
    { key: 'reset',      label: 'Reset Password' },
    { key: 'deactivate', label: 'Deactivate', danger: true },
  ];

  async function handleReset() {
    if (!USE_LIVE_API) {
      toast.success('Password reset email sent (mock mode).');
      return;
    }
    setBusy(true);
    try {
      const captchaToken = await executeRecaptcha('forgot_password');
      if (!captchaToken) {
        toast.error('Security check failed. Please try again.');
        return;
      }
      await forgotPassword(userEmail, captchaToken);
      toast.success(`Password reset email sent to ${userEmail}.`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Could not send password reset email.');
    } finally {
      setBusy(false);
    }
  }

  async function handleDeactivate() {
    if (!USE_LIVE_API) {
      toast.success('User deactivated (mock mode).');
      setConfirm(false);
      onRefresh?.();
      return;
    }
    setBusy(true);
    try {
      await deleteSystemUser(userId);
      toast.success(`${userName} has been deactivated.`);
      setConfirm(false);
      onRefresh?.();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Action failed. Please try again.');
    } finally {
      setBusy(false);
    }
  }

  function handleClick(key: string) {
    setOpen(false);
    switch (key) {
      case 'view':
        router.push(`/system/platform-users/${encodeURIComponent(userId)}`);
        break;
      case 'edit':
        router.push(`/system/platform-users/${encodeURIComponent(userId)}/edit`);
        break;
      case 'reset':
        void handleReset();
        break;
      case 'deactivate':
        setConfirm(true);
        break;
    }
  }

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        aria-label="Row actions"
        disabled={busy}
        onClick={() => setOpen((v) => !v)}
        className="flex size-7 items-center justify-center rounded-[6px] text-brand-gray-500 transition-colors hover:bg-[#f2f2f2] disabled:opacity-50"
      >
        <MoreHorizontal className="size-4" />
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 top-[calc(100%+4px)] z-40 w-[160px] rounded-[10px] border border-[#ededed] bg-white p-1.5 shadow-[0_10px_30px_rgba(0,0,0,0.14)]"
        >
          {ITEMS.map((it) => (
            <button
              key={it.key}
              type="button"
              role="menuitem"
              onClick={() => handleClick(it.key)}
              className={cn(
                'block w-full rounded-[6px] px-3 py-2 text-left text-[12px] transition-colors hover:bg-[#f4f7ff]',
                it.danger ? 'text-[#eb0000]' : 'text-[#333]'
              )}
            >
              {it.label}
            </button>
          ))}
        </div>
      )}

      <ConfirmModal
        open={confirm}
        onOpenChange={setConfirm}
        onConfirm={() => void handleDeactivate()}
      />
    </div>
  );
}
