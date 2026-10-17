import { GuestLoginForm } from '@/components/auth/guest-login-form';

export default function GuestLoginPage() {
  return <GuestLoginForm redirectTo="/dashboard" signInHref="/auth/login" signUpHref="/auth/signup" />;
}
