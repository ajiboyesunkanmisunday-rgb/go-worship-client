'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import {
  getSystemUser,
  getSystemUserRoles,
  deleteSystemUser,
  type SystemUser,
} from '@/lib/api/system';
import { forgotPassword } from '@/lib/api/auth';
import { executeRecaptcha } from '@/lib/recaptcha';
import { ArrowLeft, Mail, Shield, UserRound } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ConfirmModal } from '@/components/shared/confirm-modal';
import { toast } from 'sonner';
import Link from 'next/link';

const ROLE_STYLE: Record<string, string> = {
  'Super Admin': 'bg-[#fde8e8] text-[#eb0000]',
  Admin:         'bg-[#fff4e5] text-[#ff8d28]',
  Support:       'bg-[#e9f0ff] text-brand-blue',
  Auditor:       'bg-[#f2f2f2] text-[#555]',
};

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-[#f2f2f2] py-3 last:border-0">
      <span className="text-[13px] text-brand-gray-500">{label}</span>
      <span className="text-right text-[13px] font-medium text-[#333]">{value || '—'}</span>
    </div>
  );
}

export default function SystemPlatformUserDetailPage() {
  const router = useRouter();
  const { id } = useParams<{ id: string }>();
  const back = '/system/platform-users';
  const [user, setUser] = useState<SystemUser | null>(null);
  const [roles, setRoles] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    Promise.all([
      getSystemUser(id).catch(() => null),
      getSystemUserRoles(id).catch(() => []),
    ]).then(([u, r]) => {
      if (u) setUser(u as SystemUser);
      if (Array.isArray(r)) setRoles(r.map((x) => String((x as Record<string,unknown>).name ?? (x as Record<string,unknown>).code ?? x)));
    }).finally(() => setLoading(false));
  }, [id]);

  const handleResetPassword = async () => {
    if (!user?.email) return;
    setBusy(true);
    try {
      const token = await executeRecaptcha('forgot_password');
      if (!token) { toast.error('Security check failed.'); return; }
      await forgotPassword(user.email, token);
      toast.success(`Password reset email sent to ${user.email}.`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Could not send reset email.');
    } finally {
      setBusy(false);
    }
  };

  const handleDeactivate = async () => {
    if (!id) return;
    setBusy(true);
    try {
      await deleteSystemUser(id);
      toast.success('User deactivated.');
      router.push(back);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Action failed.');
    } finally {
      setBusy(false);
      setConfirmDelete(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col gap-5">
        <p className="py-20 text-center text-[14px] text-brand-gray-500">Loading…</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex flex-col gap-5">
        <button type="button" onClick={() => router.push(back)} className="flex items-center gap-2 text-[13px] text-brand-gray-500 hover:opacity-70">
          <ArrowLeft className="size-4" /> Back
        </button>
        <p className="py-10 text-center text-[14px] text-brand-gray-500">User not found.</p>
      </div>
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-[720px] flex-col gap-6">
      <div className="flex items-center gap-3">
        <button type="button" onClick={() => router.push(back)} aria-label="Go back" className="text-black transition-opacity hover:opacity-70">
          <ArrowLeft className="size-6" />
        </button>
        <h1 className="text-[22px] font-bold">Platform User Details</h1>
      </div>

      <div className="rounded-[16px] bg-white p-6 shadow-sm">
        <div className="mb-6 flex items-center gap-4">
          <span className="flex size-14 items-center justify-center rounded-full bg-[#e9f0ff] text-[22px] font-bold text-brand-blue">
            {(user.name || user.email || '?').slice(0, 1).toUpperCase()}
          </span>
          <div>
            <p className="text-[18px] font-bold">{user.name || '—'}</p>
            <p className="text-[13px] text-brand-gray-500">{user.email}</p>
          </div>
          <span className={cn('ml-auto rounded-full px-3 py-1 text-[12px] font-medium', ROLE_STYLE[user.role] ?? 'bg-[#f2f2f2] text-[#555]')}>
            {user.role}
          </span>
        </div>

        <div className="flex flex-col">
          <InfoRow label="Status" value={user.status} />
          <InfoRow label="Email" value={user.email} />
          <InfoRow label="Last Login" value={user.lastLogin || 'Never'} />
          <InfoRow label="Account Created" value={user.createdAt} />
          {roles.length > 0 && (
            <div className="flex items-start justify-between gap-4 border-b border-[#f2f2f2] py-3 last:border-0">
              <span className="text-[13px] text-brand-gray-500">Roles</span>
              <div className="flex flex-wrap justify-end gap-1.5">
                {roles.map((r) => (
                  <span key={r} className="rounded-full bg-[#e9f0ff] px-2 py-0.5 text-[11px] text-brand-blue">{r}</span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="flex flex-wrap gap-3">
        <Link
          href={`/system/platform-users/${id}/edit`}
          className="flex h-[42px] items-center gap-2 rounded-[8px] bg-brand-blue px-5 text-[13px] font-medium text-white no-underline transition-colors hover:bg-brand-blue/90"
        >
          <UserRound className="size-4" />
          Edit User
        </Link>
        <button
          type="button"
          disabled={busy}
          onClick={() => void handleResetPassword()}
          className="flex h-[42px] items-center gap-2 rounded-[8px] border border-[#ddd] px-5 text-[13px] font-medium text-[#333] transition-colors hover:bg-[#f5f5f5] disabled:opacity-50"
        >
          <Mail className="size-4" />
          Reset Password
        </button>
        <button
          type="button"
          disabled={busy}
          onClick={() => setConfirmDelete(true)}
          className="flex h-[42px] items-center gap-2 rounded-[8px] border border-[#fde8e8] bg-[#fde8e8] px-5 text-[13px] font-medium text-[#eb0000] transition-colors hover:bg-[#f9d5d5] disabled:opacity-50"
        >
          <Shield className="size-4" />
          Deactivate
        </button>
      </div>

      <ConfirmModal
        open={confirmDelete}
        onOpenChange={setConfirmDelete}
        onConfirm={() => void handleDeactivate()}
      />
    </div>
  );
}
