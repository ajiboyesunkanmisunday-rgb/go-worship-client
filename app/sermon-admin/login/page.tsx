import { MinistrySignInForm } from '@/components/auth/sign-in-form';

export default function SermonAdminLoginPage() {
  return (
    <MinistrySignInForm redirectTo="/sermon-admin/dashboard" portalKind="ministry" />
  );
}
