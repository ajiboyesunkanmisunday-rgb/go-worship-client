import { SignInForm } from '@/components/auth/sign-in-form';

export default function GroupLeaderLoginPage() {
  return (
    <SignInForm redirectTo="/group-leader/dashboard" signupHref="/auth/signup" />
  );
}
