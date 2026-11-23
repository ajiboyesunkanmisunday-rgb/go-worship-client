'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import {
  getSystemUser,
  getSystemUserRoles,
  updateSystemUser,
  setSystemUserRoles,
  getSystemRoles,
  type SystemUser,
  type SystemUserType,
} from '@/lib/api/system';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { NativeSelect, NativeSelectOption } from '@/components/ui/native-select';
import { ResultModal } from '@/components/system/result-modal';
import { toast } from 'sonner';

function Field({ label, children }: { label: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-[13px] font-medium text-[#333]">{label}</label>
      {children}
    </div>
  );
}

const ROLE_OPTIONS = [
  { label: 'Super Admin', value: 'super',   userType: 'SYSTEM_ADMIN' as SystemUserType, roleCode: 'SUPER_SYSTEM_ADMIN' },
  { label: 'Admin',       value: 'admin',   userType: 'SYSTEM_ADMIN' as SystemUserType, roleCode: 'SYSTEM_ADMIN' },
  { label: 'Support',     value: 'support', userType: 'SYSTEM'       as SystemUserType, roleCode: 'SYSTEM_SUPPORT' },
  { label: 'Auditor',     value: 'auditor', userType: 'SYSTEM'       as SystemUserType, roleCode: 'SYSTEM_AUDITOR' },
];

function mapRoleCodesToValue(codes: string[]): string {
  if (codes.some((c) => c.toUpperCase().includes('SUPER'))) return 'super';
  if (codes.some((c) => c.toUpperCase().includes('SUPPORT'))) return 'support';
  if (codes.some((c) => c.toUpperCase().includes('AUDITOR'))) return 'auditor';
  return 'admin';
}

export default function SystemPlatformUserEditPage() {
  const router = useRouter();
  const { id } = useParams<{ id: string }>();
  const back = `/system/platform-users/${id}`;

  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<SystemUser | null>(null);
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('admin');
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (!id) return;
    Promise.all([
      getSystemUser(id).catch(() => null),
      getSystemUserRoles(id).catch(() => []),
      getSystemRoles().catch(() => []),
    ]).then(([u, userRoles]) => {
      if (u) {
        setUser(u as SystemUser);
        const su = u as SystemUser;
        setFullName(su.name || '');
        setEmail(su.email || '');
      }
      const codes = (Array.isArray(userRoles) ? userRoles : []).map(
        (r) => String((r as Record<string, unknown>).code ?? (r as Record<string, unknown>).name ?? r)
      );
      setRole(mapRoleCodesToValue(codes));
    }).finally(() => setLoading(false));
  }, [id]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!id) return;
    const opt = ROLE_OPTIONS.find((o) => o.value === role) ?? ROLE_OPTIONS[1];
    setSubmitting(true);
    try {
      await updateSystemUser(id, {
        displayName: fullName,
        userType: opt.userType,
        roleCodes: [opt.roleCode],
        profile: { fullName, email },
      });
      await setSystemUserRoles(id, { roleIds: [opt.roleCode] }).catch(() => {});
      setDone(true);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Save failed.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <p className="py-20 text-center text-[14px] text-brand-gray-500">Loading…</p>;
  }

  return (
    <div className="mx-auto flex w-full max-w-[560px] flex-col gap-6 px-4 pb-10 pt-6">
      <button type="button" onClick={() => router.push(back)} aria-label="Go back" className="w-fit text-black transition-opacity hover:opacity-70">
        <ArrowLeft className="size-6" />
      </button>

      <div>
        <h1 className="text-[22px] font-bold text-brand-blue">Edit Platform User</h1>
        {user && <p className="mt-1 text-[13px] text-brand-gray-500">{user.email}</p>}
      </div>

      <form className="flex flex-col gap-5" onSubmit={(e) => void handleSubmit(e)}>
        <Field label={<>Full Name<span className="text-destructive">*</span></>}>
          <Input
            className="h-[48px]"
            placeholder="Full name"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            required
          />
        </Field>

        <Field label="Email">
          <Input
            type="email"
            className="h-[48px]"
            value={email}
            readOnly
            disabled
          />
        </Field>

        <Field label={<>Role<span className="text-destructive">*</span></>}>
          <NativeSelect
            className="h-[48px]"
            value={role}
            onChange={(e) => setRole(e.target.value)}
          >
            {ROLE_OPTIONS.map((o) => (
              <NativeSelectOption key={o.value} value={o.value}>{o.label}</NativeSelectOption>
            ))}
          </NativeSelect>
        </Field>

        <Button
          size="lg"
          type="submit"
          disabled={submitting}
          className="mt-2 h-[52px] w-full"
        >
          {submitting ? 'Saving…' : 'Save Changes'}
        </Button>
      </form>

      <ResultModal
        variant="success"
        open={done}
        onOpenChange={(v) => { if (!v) { setDone(false); router.push(back); } }}
        message="Platform user updated successfully."
      />
    </div>
  );
}
