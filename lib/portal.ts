/**
 * Where to send a user after a successful login, based on the roles the auth
 * response returns (`claims.roles`).
 *
 * SUPER_SYSTEM_ADMIN → the System portal. Other roles fall back to the member
 * dashboard for now; add their exact mappings here once each role's real string
 * is confirmed from a live login (the backend's own naming, e.g. TENANT_ADMIN →
 * /ministry, SERMON_ADMIN → /sermon-admin, GROUP_LEADER → /group-leader).
 */
export function portalForRoles(roles?: string[] | null): string {
  const r = (roles ?? []).map((x) => String(x).toUpperCase());
  const has = (needle: string) => r.some((x) => x.includes(needle));

  if (has('SYSTEM')) return '/system'; // SUPER_SYSTEM_ADMIN / SYSTEM_ADMIN

  return '/dashboard';
}
