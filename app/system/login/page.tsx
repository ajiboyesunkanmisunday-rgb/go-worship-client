import { SignInForm } from '@/components/auth/sign-in-form';

export default function SystemLoginPage() {
  return (
    <SignInForm
      redirectTo="/system/dashboard"
      imgSrc="/auth/system-bg.svg"
      imgAlt="Go-Worship platform"
      imgClassName="object-cover opacity-[0.12]"
      logoSrc="/leadremit-logo-white.svg"
      subtitle="Go-Worship church administration and giving platform."
      disableGoogle
    />
  );
}
