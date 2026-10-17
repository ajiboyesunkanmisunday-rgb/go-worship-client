import { SignInForm } from '@/components/auth/sign-in-form';

export default function GroupLeaderLoginPage() {
  return (
    <SignInForm
      redirectTo="/ministry-admin/dashboard"
      signupHref="/auth/signup"
    />
  );
}
