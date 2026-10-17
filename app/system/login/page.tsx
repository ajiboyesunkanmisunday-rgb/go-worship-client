import { SignInForm } from '@/components/auth/sign-in-form';

export default function SystemLoginPage() {
  return (
    <SignInForm redirectTo="/system/dashboard" signupHref="/auth/signup" />
  );
}
