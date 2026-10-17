'use client';
import { AccountDetailsForm } from '@/components/auth/sign-up/account-details-form';
import { WizardShell } from '@/components/auth/wizard-shell';
import { useRouter } from 'next/navigation';

export default function AccountDetailsPage() {
  const router = useRouter();

  return (
    <WizardShell step={1} backHref="/auth/signup/choose-account">
      <AccountDetailsForm
        onSuccess={() => router.push('/auth/signup/password')}
      />
    </WizardShell>
  );
}
