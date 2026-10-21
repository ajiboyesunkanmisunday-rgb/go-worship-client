import { SignInForm } from '@/components/auth/sign-in-form';

export default function SystemLoginPage() {
  return (
    <SignInForm
      redirectTo="/system/dashboard"
      imgSrc="/auth/system-bg.svg"
      imgAlt=""
      imgClassName="object-cover"
      logoSrc="/leadremit-logo-white.svg"
      subtitle="Go-Worship church administration and giving platform."
      disableGoogle
      hideBrandLogo
      mfaBasePath="/system"
      flat
      portalKind="system"
    />
  );
}
