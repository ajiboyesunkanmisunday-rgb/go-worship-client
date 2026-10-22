'use client';

import { FormAlert } from '@/components/ui/form-alert';

/**
 * Ministry → Admin Management → Add new account (Figma 640:34373).
 *
 * Authorized by go-worship-auth-endpoints.md:
 *   TN-006  POST /api/v1/tenant/admin/users/provision
 *   {email, displayName, userType, roleCodes, sendInviteEmail, profile{fullName,email}}
 *
 * Password field is shown per Figma but NOT forwarded to the backend — the
 * backend sends a first-login invite email (sendInviteEmail: true). The matrix
 * is a visual preview of what the selected role can do; actual permissions are
 * enforced server-side by roleCodes.
 */

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { NativeSelect, NativeSelectOption } from '@/components/ui/native-select';
import { SheetPage } from '@/components/ui/sheet-page';
import {
  StepUpMfaDialog,
  isStepUpChallenge,
  type StepUpMfaChallengeResponse,
} from '@/components/shared/step-up-mfa-dialog';
import { ArrowLeft, UserRound } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { provisionTenantUser, type TenantUserType } from '@/lib/api/tenant';
import { ApiError } from '@/lib/api/client';
import { USE_LIVE_API } from '@/lib/api/config';
import { cn } from '@/lib/utils';

/** Maps the form role selector → backend userType + roleCodes. */
const ROLE_MAP: Record<string, { userType: TenantUserType; roleCodes: string[] }> = {
  sub_admin:     { userType: 'TENANT_ADMIN',   roleCodes: ['TENANT_ADMIN'] },
  group_admin:   { userType: 'TENANT_MANAGER', roleCodes: ['TENANT_MANAGER'] },
  finance_admin: { userType: 'TENANT_STAFF',   roleCodes: ['TENANT_MANAGER'] },
  event_admin:   { userType: 'TENANT_STAFF',   roleCodes: ['TENANT_STAFF'] },
};

const PERMS = ['View', 'Create', 'Edit', 'Delete', 'Export'] as const;

/** Permission matrix per role — mirrors the design's orange checkboxes. */
const PERM_MATRIX: Record<string, boolean[][]> = {
  sub_admin: [
    [true,  false, false, false, false], // Members
    [true,  true,  true,  true,  true],  // Finance
    [false, true,  false, true,  false], // Events
    [true,  false, true,  false, false], // Groups
    [true,  true,  false, false, false], // Check in
    [true,  false, true,  false, false], // Transactions
    [true,  true,  false, false, false], // Analytics
    [false, true,  false, true,  false], // Settings
    [true,  false, false, false, false], // Billing
    [true,  false, false, false, false], // Support
  ],
  group_admin: [
    [true,  false, false, false, false],
    [false, false, false, false, false],
    [true,  true,  true,  false, false],
    [true,  true,  true,  true,  false],
    [true,  true,  false, false, false],
    [false, false, false, false, false],
    [true,  false, false, false, false],
    [false, false, false, false, false],
    [false, false, false, false, false],
    [false, false, false, false, false],
  ],
  finance_admin: [
    [true,  false, false, false, true],
    [true,  true,  true,  true,  true],
    [false, false, false, false, false],
    [false, false, false, false, false],
    [false, false, false, false, false],
    [true,  false, true,  false, true],
    [true,  true,  false, false, false],
    [false, false, false, false, false],
    [true,  false, false, false, false],
    [false, false, false, false, false],
  ],
  event_admin: [
    [true,  false, false, false, false],
    [false, false, false, false, false],
    [true,  true,  true,  true,  false],
    [false, false, false, false, false],
    [true,  true,  true,  false, false],
    [false, false, false, false, false],
    [true,  false, false, false, false],
    [false, false, false, false, false],
    [false, false, false, false, false],
    [false, false, false, false, false],
  ],
};

const MODULES = ['Members', 'Finance', 'Events', 'Groups', 'Check in', 'Transactions', 'Analytics', 'Settings', 'Billing', 'Support'] as const;

function SectionBar({ label }: { label: string }) {
  return (
    <div className="rounded-[6px] bg-[#eef3ff] px-3 py-2 text-[13px] font-semibold text-brand-blue">
      {label}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-[13px] font-medium text-[#333]">{label}</label>
      {children}
    </div>
  );
}

export function AddAccount() {
  const router = useRouter();
  const back = '/ministry/admin-management';

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('sub_admin');

  const [submitting, setSubmitting] = useState(false);
  const [enrollError, setEnrollError] = useState<string | null>(null);
  const [challenge, setChallenge] = useState<StepUpMfaChallengeResponse | null>(null);

  const matrix = PERM_MATRIX[role] ?? PERM_MATRIX.sub_admin;

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!USE_LIVE_API) {
      toast.success('Account created');
      router.push(back);
      return;
    }

    setEnrollError(null);
    setSubmitting(true);
    const { userType, roleCodes } = ROLE_MAP[role] ?? ROLE_MAP.sub_admin;
    try {
      const data = await provisionTenantUser({
        email,
        username: email,
        displayName: fullName,
        userType,
        roleCodes,
        sendInviteEmail: true,
        profile: { fullName, email },
      });

      if (isStepUpChallenge(data)) {
        setChallenge(data);
      } else {
        toast.success('Account created — invite email sent');
        router.push(back);
      }
    } catch (err) {
      if (err instanceof ApiError) {
        const code = (err.body as Record<string, string> | null)?.code ?? '';
        if (code === 'MFA_ENROLLMENT_REQUIRED') {
          setEnrollError('You must enable two-factor authentication before creating accounts. Go to Settings → Security.');
        } else {
          setEnrollError(err.message);
        }
      } else {
        setEnrollError('Something went wrong. Please try again.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SheetPage
      className="w-full max-w-[665px]!"
      backLink={back}
      title="Add new account"
    >
      <form
        onSubmit={handleSubmit}
        className="flex h-full w-full flex-col gap-6 overflow-y-auto px-6 pt-[64px] pb-10 md:px-[60px]"
      >
        <button
          type="button"
          onClick={() => router.push(back)}
          aria-label="Go back"
          className="w-fit text-black transition-opacity hover:opacity-70"
        >
          <ArrowLeft className="size-6" />
        </button>

        <h1 className="text-center text-[24px] font-bold">Add new account</h1>

        <div className="flex justify-center">
          <span className="flex size-[64px] items-center justify-center rounded-full bg-[#ff8d28]">
            <UserRound className="size-8 text-white" />
          </span>
        </div>

        <SectionBar label="Account info:" />

        <div className="flex flex-col gap-4">
          <Field label="Full name*">
            <Input
              required
              placeholder="Enter full name"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="h-[46px]"
            />
          </Field>
          <Field label="Email*">
            <Input
              required
              type="email"
              placeholder="Enter email address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="h-[46px]"
            />
          </Field>
          <Field label="Role*">
            <NativeSelect
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="h-[46px]"
            >
              <NativeSelectOption value="sub_admin">Sub Admin</NativeSelectOption>
              <NativeSelectOption value="group_admin">Group Admin</NativeSelectOption>
              <NativeSelectOption value="finance_admin">Finance Admin</NativeSelectOption>
              <NativeSelectOption value="event_admin">Event Admin</NativeSelectOption>
            </NativeSelect>
          </Field>
        </div>

        <SectionBar label="Permissions Matrix:" />
        <div className="overflow-x-auto">
          <table className="w-full min-w-[420px] border-collapse">
            <thead>
              <tr className="text-left text-[12px] text-[#333]">
                <th className="py-2 font-medium">Module</th>
                {PERMS.map((p) => (
                  <th key={p} className="py-2 text-center font-medium">
                    {p}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {MODULES.map((mod, ri) => (
                <tr key={mod} className="border-t border-[#f2f2f2]">
                  <td className="py-2.5 text-[12px] text-[#333]">{mod}</td>
                  {(matrix[ri] ?? [false, false, false, false, false]).map((on, ci) => (
                    <td key={ci} className="py-2.5 text-center">
                      <span
                        className={cn(
                          'inline-block size-4 rounded-[3px]',
                          on ? 'bg-[#ff8d28]' : 'bg-[#e2e2e2]'
                        )}
                      />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {enrollError && <FormAlert variant="error">{enrollError}</FormAlert>}

        <div className="flex flex-col gap-3 pt-2">
          <Button size="lg" type="submit" disabled={submitting} className="h-[52px] w-full">
            {submitting ? 'Creating…' : 'Create account'}
          </Button>
          <Button
            size="lg"
            variant="outline"
            type="button"
            className="h-[52px] w-full"
            onClick={() => router.push(back)}
          >
            Cancel
          </Button>
        </div>
      </form>

      {challenge && (
        <StepUpMfaDialog
          challenge={challenge}
          onSuccess={() => {
            setChallenge(null);
            toast.success('Account created — invite email sent');
            router.push(back);
          }}
          onClose={() => setChallenge(null)}
        />
      )}
    </SheetPage>
  );
}
