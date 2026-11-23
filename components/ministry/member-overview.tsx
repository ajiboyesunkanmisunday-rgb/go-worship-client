'use client';

import { Button } from '@/components/ui/button';
import { SheetPage } from '@/components/ui/sheet-page';
import { cn } from '@/lib/utils';
import { ArrowLeft, ChevronDown } from 'lucide-react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useState, useEffect, useRef } from 'react';
import {
  getTenantMember,
  getTenantUserRoles,
  activateTenantUser,
  suspendTenantUser,
  unlockTenantUser,
  forcePasswordResetTenantUser,
  resetMfaTenantUser,
  revokeSessionsTenantUser,
  deleteTenantUser,
  migrateTenantUserToCustomer,
  type TenantMember,
} from '@/lib/api/tenant';
import { toast } from 'sonner';

function ReadonlyField({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-[13px] font-medium text-[#333]">{label}</label>
      <div className="flex min-h-[48px] items-center rounded-[6px] border border-[#e5e5e5] px-3 py-2 text-[13px] text-brand-gray-500">
        {value || '—'}
      </div>
    </div>
  );
}

type ActionItem = {
  label: string;
  handler: () => void;
  danger?: boolean;
};

function ActionsMenu({ items }: { items: ActionItem[] }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <div ref={ref} className="relative">
      <Button
        variant="outline"
        size="lg"
        className="h-[52px] w-full"
        onClick={() => setOpen((v) => !v)}
        type="button"
      >
        Actions
        <ChevronDown className="ml-2 size-4" />
      </Button>
      {open && (
        <div className="absolute bottom-full left-0 z-50 mb-1 w-full overflow-hidden rounded-[8px] border border-[#e5e5e5] bg-white shadow-lg">
          {items.map((item) => (
            <button
              key={item.label}
              type="button"
              onClick={() => { setOpen(false); item.handler(); }}
              className={cn(
                'w-full px-4 py-3 text-left text-[13px] transition-colors hover:bg-[#f5f5f5]',
                item.danger ? 'text-[#eb0000]' : 'text-[#333]',
              )}
            >
              {item.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/** Church Admin "Member Overview" slide-over. */
export function MemberOverview({ id }: { id?: string }) {
  const router = useRouter();
  const back = '/ministry/members';
  const [member, setMember] = useState<TenantMember>(
    { id: '', name: '', email: '', phone: '', status: 'Active', joinedAt: '', groups: [] }
  );
  const [roles, setRoles] = useState<string[]>([]);

  useEffect(() => {
    if (!id) return;
    getTenantMember(id).then((m: TenantMember | null) => { if (m) setMember(m); }).catch(() => {});
    getTenantUserRoles(id)
      .then((arr) => {
        const names = arr.map((r) => String(r['name'] ?? r['roleName'] ?? '')).filter(Boolean);
        setRoles(names);
      })
      .catch(() => {});
  }, [id]);

  function withToast(label: string, fn: () => Promise<unknown>, onSuccess?: () => void) {
    fn()
      .then(() => {
        toast.success(`${label} successful.`);
        onSuccess?.();
      })
      .catch((e: unknown) => {
        toast.error(e instanceof Error ? e.message : `${label} failed.`);
      });
  }

  const userId = id ?? member.id;
  const rawStatus = (member as unknown as { status: string }).status;
  const isActive = rawStatus === 'Active';
  const isLocked = rawStatus === 'Locked';

  const actions: ActionItem[] = [
    ...(isActive
      ? [{ label: 'Suspend member', handler: () => withToast('Suspend', () => suspendTenantUser(userId), () => setMember((m) => ({ ...m, status: 'Inactive' as const }))) }]
      : [{ label: 'Activate member', handler: () => withToast('Activate', () => activateTenantUser(userId), () => setMember((m) => ({ ...m, status: 'Active' as const }))) }]
    ),
    ...(isLocked
      ? [{ label: 'Unlock account', handler: () => withToast('Unlock', () => unlockTenantUser(userId), () => setMember((m) => ({ ...m, status: 'Active' as const }))) }]
      : []
    ),
    { label: 'Force password reset', handler: () => withToast('Password reset', () => forcePasswordResetTenantUser(userId)) },
    { label: 'Reset MFA', handler: () => withToast('MFA reset', () => resetMfaTenantUser(userId)) },
    { label: 'Revoke all sessions', handler: () => withToast('Revoke sessions', () => revokeSessionsTenantUser(userId)) },
    { label: 'Migrate to customer', handler: () => withToast('Migration', () => migrateTenantUserToCustomer(userId)) },
    { label: 'Delete member', danger: true, handler: () => withToast('Delete', () => deleteTenantUser(userId), () => router.push(back)) },
  ];

  return (
    <SheetPage
      className="w-full max-w-[665px]!"
      backLink={back}
      title="Member Overview"
    >
      <div className="flex h-full w-full flex-col gap-6 overflow-y-auto px-6 pt-[64px] pb-10 md:px-[60px]">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => router.push(back)}
            aria-label="Go back"
            className="text-black transition-opacity hover:opacity-70"
          >
            <ArrowLeft className="size-6" />
          </button>
          <h1 className="text-[20px] font-bold text-brand-blue">
            Member Overview
          </h1>
        </div>

        <div className="flex items-center gap-3">
          <Image
            src="/auth/infinity-blue.svg"
            alt="Member"
            width={44}
            height={44}
            className="size-11 rounded-full"
          />
          <div>
            <p className="text-[10px] text-brand-gray-500">Member Name:</p>
            <p className="text-[20px] font-bold text-brand-blue">
              {member.name}
            </p>
            <p className="flex items-center gap-1.5 text-[12px] text-brand-gray-500">
              {member.joinedAt ? `Joined ${member.joinedAt}` : ''}
              <span className="inline-flex items-center gap-1">
                <span className={cn(
                  'size-2 rounded-full',
                  member.status === 'Active' ? 'bg-[#34a853]' : 'bg-[#eb0000]'
                )} />
                {member.status}
              </span>
            </p>
          </div>
        </div>

        <div className="flex flex-col gap-5">
          <h2 className="text-[15px] font-bold">Member Information</h2>
          <ReadonlyField label="Full Name*" value={member.name} />
          <ReadonlyField label="Email Address*" value={member.email} />
          <ReadonlyField label="Phone Number" value={member.phone} />
          <ReadonlyField label="Status" value={member.status} />
          <ReadonlyField label="Date Joined" value={member.joinedAt} />
          <ReadonlyField
            label="Groups"
            value={member.groups.length > 0 ? member.groups.join(', ') : 'No groups'}
          />
          {roles.length > 0 && (
            <ReadonlyField label="Roles" value={roles.join(', ')} />
          )}
        </div>

        <div className="flex flex-col gap-3">
          <Button
            size="lg"
            className="h-[52px] w-full"
            onClick={() => router.push(`${back}/${userId}/edit`)}
          >
            Edit Member
          </Button>
          <ActionsMenu items={actions} />
          <Button asChild size="lg" variant="outline" className="h-[52px] w-full">
            <button type="button" onClick={() => router.push(back)}>
              Close
            </button>
          </Button>
        </div>
      </div>
    </SheetPage>
  );
}
