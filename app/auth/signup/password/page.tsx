'use client';
import { PasswordForm } from '@/components/auth/sign-up/password-form';
import { WizardShell } from '@/components/auth/wizard-shell';
import { useRouter } from 'next/navigation';

export default function PasswordPage() {
  const router = useRouter();

  return (
    <WizardShell step={2} backHref="/auth/signup/account-details">
      <PasswordForm onSuccess={() => router.push('/auth/signup/otp-verify')} />
    </WizardShell>
  );
}
