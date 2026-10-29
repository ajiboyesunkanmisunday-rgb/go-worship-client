import { redirect } from 'next/navigation';

/** The backend reset-password email links to /auth/reset-password?token=...
 *  The actual page lives at /auth/set-password — redirect preserving the query. */
export default function ResetPasswordRedirectPage({
  searchParams,
}: {
  searchParams: Record<string, string | string[] | undefined>;
}) {
  const token = searchParams['token'];
  const qs = token ? `?token=${encodeURIComponent(String(token))}` : '';
  redirect(`/auth/set-password${qs}`);
}
