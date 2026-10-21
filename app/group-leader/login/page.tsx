import { MinistrySignInForm } from '@/components/auth/sign-in-form';

export default function GroupLeaderLoginPage() {
  return (
    <MinistrySignInForm redirectTo="/group-leader/dashboard" mfaBasePath="/group-leader" portalKind="ministry" />
  );
}
