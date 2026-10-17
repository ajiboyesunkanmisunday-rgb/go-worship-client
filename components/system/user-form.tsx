'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  NativeSelect,
  NativeSelectOption,
} from '@/components/ui/native-select';
import { SheetPage } from '@/components/ui/sheet-page';
import { ResultModal } from '@/components/system/result-modal';
import { StepUpMfaDialog, isStepUpChallenge } from '@/components/shared/step-up-mfa-dialog';
import type { StepUpMfaChallengeResponse } from '@/components/shared/step-up-mfa-dialog';
import { ArrowLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { provisionSystemUser, type SystemUserType } from '@/lib/api/system';
import { ApiError } from '@/lib/api/client';
import { USE_LIVE_API } from '@/lib/api/config';

/** Maps the form's role selector value to the backend userType + roleCodes. */
const ROLE_MAP: Record<string, { userType: SystemUserType; roleCodes: string[] }> = {
  admin:   { userType: 'SYSTEM_ADMIN',   roleCodes: ['SYSTEM_ADMIN'] },
  support: { userType: 'SYSTEM_SUPPORT', roleCodes: ['SYSTEM_SUPPORT'] },
  super:   { userType: 'SYSTEM_ADMIN',   roleCodes: ['SYSTEM_ADMIN'] },
};

function Field({
  label,
  children,
}: {
  label: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-[13px] font-medium text-[#333]">{label}</label>
      {children}
    </div>
  );
}

/** System → Platform Users → Add new user (board 778:38441). */
export function UserForm() {
  const router = useRouter();
  const back = '/system/platform-users';

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('admin');

  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<'success' | null>(null);
  const [challenge, setChallenge] = useState<StepUpMfaChallengeResponse | null>(null);
  const [enrollError, setEnrollError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!USE_LIVE_API) {
      setResult('success');
      return;
    }

    setEnrollError(null);
    setSubmitting(true);
    const { userType, roleCodes } = ROLE_MAP[role] ?? ROLE_MAP.admin;
    try {
      const data = await provisionSystemUser({
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
        setResult('success');
      }
    } catch (e) {
      if (e instanceof ApiError && e.status === 403) {
        const code = (e.body as Record<string, unknown>)?.code;
        if (code === 'MFA_ENROLLMENT_REQUIRED') {
          setEnrollError(
            'Two-factor authentication is required to add platform users. Go to Settings → Security to enable 2FA first.'
          );
          return;
        }
      }
      toast.error(e instanceof Error ? e.message : 'Failed to create user');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SheetPage
      className="w-full max-w-[665px]!"
      backLink={back}
      title="Add new user"
    >
      {/* Step-up MFA dialog */}
      {challenge && (
        <StepUpMfaDialog
          challenge={challenge}
          onSuccess={() => {
            setChallenge(null);
            setResult('success');
          }}
          onClose={() => setChallenge(null)}
        />
      )}

      <div className="flex h-full w-full flex-col gap-6 overflow-y-auto px-6 pt-[64px] pb-10 md:px-[60px]">
        <button
          type="button"
          onClick={() => router.push(back)}
          aria-label="Go back"
          className="w-fit text-black transition-opacity hover:opacity-70"
        >
          <ArrowLeft className="size-6" />
        </button>

        <div>
          <h1 className="text-[22px] font-bold text-brand-blue">Add new user</h1>
          <p className="mt-1 text-[13px] text-brand-gray-500">
            Invite a new user to the admin platform
          </p>
        </div>

        <form className="flex flex-col gap-5" onSubmit={handleSubmit}>
          <Field label={<>Full Name&#42;</>}>
            <Input
              className="h-[48px]"
              placeholder="Enter user full name"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required
            />
          </Field>

          <Field label={<>Email Address&#42;</>}>
            <Input
              type="email"
              className="h-[48px]"
              placeholder="Enter user email address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </Field>

          <Field label={<>Role&#42;</>}>
            <NativeSelect
              className="h-[48px]"
              value={role}
              onChange={(e) => setRole(e.target.value)}
            >
              <NativeSelectOption value="">Select a role</NativeSelectOption>
              <NativeSelectOption value="admin">Admin</NativeSelectOption>
              <NativeSelectOption value="support">Support Admin</NativeSelectOption>
              <NativeSelectOption value="super">Super Admin</NativeSelectOption>
            </NativeSelect>
          </Field>

          {enrollError && (
            <div className="rounded-[10px] border border-amber-200 bg-amber-50 px-4 py-3 text-[14px] text-amber-700">
              {enrollError}
            </div>
          )}

          <Button
            size="lg"
            type="submit"
            disabled={submitting}
            className="mt-1 h-[52px] w-full"
          >
            {submitting ? 'Sending invite…' : 'Send Invite'}
          </Button>
        </form>

        <ResultModal
          variant="success"
          open={result === 'success'}
          onOpenChange={(v) => {
            if (!v) {
              setResult(null);
              router.push(back);
            }
          }}
          message="You have successfully created a new platform user"
        />
      </div>
    </SheetPage>
  );
}
