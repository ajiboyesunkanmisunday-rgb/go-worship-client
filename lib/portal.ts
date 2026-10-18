/**
 * Where to send a user after a successful login, based on the roles the auth
 * response returns (`claims.roles`).
 *
 * Priority order (highest authority first):
 *   SYSTEM_*        → /system
 *   TENANT_ADMIN    → /ministry
 *   MINISTRY_ADMIN  → /ministry-admin
 *   SERMON_ADMIN    → /sermon-admin
 *   MEDIA_ADMIN     → /sermon-admin  (alias)
 *   GROUP_LEADER    → /group-leader
 *   CUSTOMER / MEMBER / default → /dashboard
 */
export function portalForRoles(roles?: string[] | null): string {
  const r = (roles ?? []).map((x) => String(x).toUpperCase());
  const has = (needle: string) => r.some((x) => x.includes(needle));

  if (has('SYSTEM'))          return '/system';
  if (has('TENANT_ADMIN'))    return '/ministry';
  if (has('MINISTRY_ADMIN'))  return '/ministry-admin';
  if (has('SERMON_ADMIN') || has('MEDIA_ADMIN')) return '/sermon-admin';
  if (has('GROUP_LEADER'))    return '/group-leader';

  return '/dashboard';
}
