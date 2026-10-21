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

/**
 * Which login portals a given role set is permitted to access.
 *
 *   system   → SYSTEM_* roles only
 *   ministry → TENANT_* / MINISTRY_ADMIN / SERMON_ADMIN / MEDIA_ADMIN / GROUP_LEADER
 *              (no system roles, no pure customer/member roles)
 *   member   → everyone except SYSTEM_* (customers, guests, and ministry roles
 *              that will be redirected to their own portal via portalForRoles)
 */
export type PortalKind = 'system' | 'ministry' | 'member';

type GateAllowed  = { allowed: true };
type GateDenied   = { allowed: false; message: string; hintPath?: string };
type GateResult   = GateAllowed | GateDenied;

export function isRoleAllowedForPortal(
  roles: string[] | null | undefined,
  portal: PortalKind
): GateResult {
  const r = (roles ?? []).map((x) => String(x).toUpperCase());
  const hasSystem  = r.some((x) => x.startsWith('SYSTEM_') || x === 'SYSTEM');
  const hasMinistry = r.some((x) =>
    x.startsWith('TENANT_') ||
    x === 'MINISTRY_ADMIN' ||
    x === 'SERMON_ADMIN'   ||
    x === 'MEDIA_ADMIN'    ||
    x === 'GROUP_LEADER'
  );

  if (portal === 'system') {
    if (hasSystem) return { allowed: true };
    return {
      allowed: false,
      message: hasMinistry
        ? 'Organization credentials cannot be used in the system portal. Please sign in through your organization\'s portal.'
        : 'These credentials are not authorized for the system portal.',
      hintPath: hasMinistry ? '/ministry/login' : '/auth/login',
    };
  }

  if (portal === 'ministry') {
    if (hasSystem) {
      return {
        allowed: false,
        message: 'System administrator credentials cannot be used in an organization portal.',
        hintPath: '/system/login',
      };
    }
    if (!hasMinistry) {
      return {
        allowed: false,
        message: 'Member credentials are not authorized for this portal. Please sign in as a member.',
        hintPath: '/auth/login',
      };
    }
    return { allowed: true };
  }

  // member portal
  if (hasSystem) {
    return {
      allowed: false,
      message: 'System administrator credentials cannot be used here.',
      hintPath: '/system/login',
    };
  }
  return { allowed: true };
}
