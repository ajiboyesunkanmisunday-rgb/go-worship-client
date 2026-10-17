import { SignInForm } from '@/components/auth/sign-in-form';

export default function SermonAdminLoginPage() {
  return (
    <SignInForm redirectTo="/sermon-admin/dashboard" signupHref="/auth/signup" />
  );
}
