import { MinistrySignInForm } from '@/components/auth/sign-in-form';

export default function MinistryAdminLoginPage() {
  return (
    <MinistrySignInForm redirectTo="/ministry-admin/dashboard" mfaBasePath="/ministry-admin" portalKind="ministry" />
  );
}
