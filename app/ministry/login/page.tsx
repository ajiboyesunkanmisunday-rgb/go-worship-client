import { MinistrySignInForm } from '@/components/auth/sign-in-form';

/**
 * Ministry (Tenant Admin) login page.
 *
 * Per go-worship-frontend-spec.md: TENANT admin/staff = username/password ONLY.
 * Google login must NEVER appear here. MinistrySignInForm enforces disableGoogle.
 */
export default function MinistryLoginPage() {
  return (
    <MinistrySignInForm
      redirectTo="/ministry/dashboard"
      signupHref="/auth/signup"
    />
  );
}
