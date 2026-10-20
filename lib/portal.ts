/**
 * Where to send a user after a successful login, based on the roles the auth
 * response returns (`claims.roles`).
 *
 * Priority order (highest authority first):
 *   SYSTEM_*                                       → /system
 *   TENANT_OWNER | TENANT_ADMIN | TENANT_MANAGER
 *     | TENANT_STAFF | TENANT_SUPPORT
 *     | TENANT_AUDITOR                             → /ministry
 *   MINISTRY_ADMIN                                 → /ministry-admin
 *   SERMON_ADMIN | MEDIA_ADMIN                     → /sermon-admin
 *   GROUP_LEADER                                   → /group-leader
 *   CUSTOMER | CUSTOMER_GUEST | MEMBER | default   → /dashboard
 */
export function portalForRoles(roles?: string[] | null): string {
  const r = (roles ?? []).map((x) => String(x).toUpperCase());
  const has = (needle: string) => r.some((x) => x.includes(needle));

  if (has('SYSTEM'))          return '/system';
  // All tenant-level admin/staff roles route to the ministry portal.
  // TENANT_OWNER (higher than TENANT_ADMIN) and TENANT_SUPPORT/AUDITOR/MANAGER
  // are new roles confirmed in the backend v2.0 spec (go-worship-auth-endpoints).
  if (
    has('TENANT_OWNER')   ||
    has('TENANT_ADMIN')   ||
    has('TENANT_MANAGER') ||
    has('TENANT_STAFF')   ||
    has('TENANT_SUPPORT') ||
    has('TENANT_AUDITOR')
  ) return '/ministry';
  if (has('MINISTRY_ADMIN'))  return '/ministry-admin';
  if (has('SERMON_ADMIN') || has('MEDIA_ADMIN')) return '/sermon-admin';
  if (has('GROUP_LEADER'))    return '/group-leader';

  return '/dashboard';
}
