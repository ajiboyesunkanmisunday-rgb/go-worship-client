'use client';
import { OtpForm } from '@/components/auth/otp-form';
import { WizardShell } from '@/components/auth/wizard-shell';
import { useRouter } from 'next/navigation';
import { useSessionStorage } from 'usehooks-ts';

export default function OTPVerifyPage() {
  const router = useRouter();
  const [accountDetails] = useSessionStorage<{ email?: string }>(
    'signup-account-details',
    {}
  );

  return (
    <WizardShell step={3} backHref="/auth/signup/password">
      <OtpForm
        email={accountDetails.email}
        verifyLabel="Continue"
        footer={null}
        onVerify={() => router.push('/auth/signup/success')}
      />
    </WizardShell>
  );
}
