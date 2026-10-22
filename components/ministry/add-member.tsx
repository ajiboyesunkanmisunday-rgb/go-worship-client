'use client';

import { FormAlert } from '@/components/ui/form-alert';

/**
 * Ministry → Members → Add member (TN-007).
 *
 * Authorized by go-worship-auth-endpoints.md:
 *   TN-007  POST /api/v1/tenant/admin/users/customers
 *   {email, displayName, sendInviteEmail, profile{fullName,email,phone}}
 *
 * INDIRECT provisioning: the admin creates the account and the backend
 * sends an invite email so the member sets their own password.
 */

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { SheetPage } from '@/components/ui/sheet-page';
import {
  StepUpMfaDialog,
  isStepUpChallenge,
  type StepUpMfaChallengeResponse,
} from '@/components/shared/step-up-mfa-dialog';
import { ArrowLeft, UserRound } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { provisionTenantMember } from '@/lib/api/tenant';
import { ApiError } from '@/lib/api/client';
import { USE_LIVE_API } from '@/lib/api/config';

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-[13px] font-medium text-[#333]">{label}</label>
      {children}
    </div>
  );
}

function SectionBar({ label }: { label: string }) {
  return (
    <div className="rounded-[6px] bg-[#eef3ff] px-3 py-2 text-[13px] font-semibold text-brand-blue">
      {label}
    </div>
  );
}

export function AddMember() {
  const router = useRouter();
  const back = '/ministry/members';

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');

  const [submitting, setSubmitting] = useState(false);
  const [enrollError, setEnrollError] = useState<string | null>(null);
  const [challenge, setChallenge] = useState<StepUpMfaChallengeResponse | null>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!USE_LIVE_API) {
      toast.success('Member added — invite email sent');
      router.push(back);
      return;
    }

    setEnrollError(null);
    setSubmitting(true);
    try {
      const data = await provisionTenantMember({
        email,
        displayName: fullName,
        sendInviteEmail: true,
        profile: { fullName, email, phone: phone || undefined },
      });

      if (isStepUpChallenge(data)) {
        setChallenge(data);
      } else {
        toast.success('Member added — invite email sent');
        router.push(back);
      }
    } catch (err) {
      if (err instanceof ApiError) {
        const code = (err.body as Record<string, string> | null)?.code ?? '';
        if (code === 'MFA_ENROLLMENT_REQUIRED') {
          setEnrollError('You must enable two-factor authentication before adding members. Go to Settings → Security.');
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
      title="Add new member"
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

        <h1 className="text-center text-[24px] font-bold">Add new member</h1>

        <div className="flex justify-center">
          <span className="flex size-[64px] items-center justify-center rounded-full bg-brand-blue">
            <UserRound className="size-8 text-white" />
          </span>
        </div>

        <SectionBar label="Member info:" />

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
          <Field label="Phone">
            <Input
              type="tel"
              placeholder="Enter phone number (optional)"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="h-[46px]"
            />
          </Field>
        </div>

        {enrollError && <FormAlert variant="error">{enrollError}</FormAlert>}

        <p className="text-[12px] text-brand-gray-500">
          An invite email will be sent to the member so they can set their password and complete their profile.
        </p>

        <div className="flex flex-col gap-3 pt-2">
          <Button size="lg" type="submit" disabled={submitting} className="h-[52px] w-full">
            {submitting ? 'Adding…' : 'Add member'}
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
            toast.success('Member added — invite email sent');
            router.push(back);
          }}
          onClose={() => setChallenge(null)}
        />
      )}
    </SheetPage>
  );
}
