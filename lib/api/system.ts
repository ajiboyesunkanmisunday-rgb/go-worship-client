/**
 * System-Owner portal API helpers (Bearer via /bff/gw).
 *
 * Provisioning calls are MFA-gated by the backend:
 *  - 200 {ok:false, code:"MFA_REQUIRED", ...}  → step-up challenge (use StepUpMfaDialog)
 *  - 403 {code:"MFA_ENROLLMENT_REQUIRED", ...}  → admin must enrol MFA first
 *
 * Endpoints (SO-006…009 from the Postman collection):
 *   POST /system/tenants/indirect   — provision tenant + first admin via invite email (QA v2.0 SO-009; path confirmed indirect, not /provision)
 *   POST /system/users/provision    — provision SO platform user
 *   GET  /system/users              — platform user list (confirmed from live DO HAR)
 *   GET  /system/billing/plans      — billing plan list (confirmed from live DO HAR)
 *   GET  /system/dashboard          — aggregate stats
 *
 * Response parsing:
 *   Dashboard endpoints return a wrapper (PageResponse / table format). `fieldOf` +
 *   `findTableRows` extract data resiliently from any nesting or field-name variant.
 *   (Reproduced from the original lost session — go-worship-auth-endpoints.md.)
 */

import { api } from './client';

/* -------- Resilient response helpers -------- */

type R = Record<string, unknown>;

/** Read the first truthy value from obj[keys[0]], obj[keys[1]], … */
function fieldOf(obj: R, keys: string[], fallback = ''): string {
  for (const k of keys) {
    const v = obj[k];
    if (v !== undefined && v !== null && v !== '') return String(v);
  }
  return fallback;
}

/**
 * Find the first array in `data`, trying hint-derived paths before generic
 * pagination wrappers. Handles both flat arrays and deeply nested responses.
 */
function findTableRows(data: unknown, ...hints: string[]): R[] {
  if (Array.isArray(data)) return data as R[];
  if (!data || typeof data !== 'object') return [];
  const d = data as R;

  for (const hint of hints) {
    for (const key of [`${hint}s`, hint, `${hint}List`]) {
      const v = d[key];
      if (Array.isArray(v)) return v as R[];
    }
  }
  for (const w of ['content', 'data', 'items', 'results', 'rows', 'list', 'records']) {
    const v = d[w];
    if (Array.isArray(v)) return v as R[];
    if (v && typeof v === 'object' && !Array.isArray(v)) {
      const nested = findTableRows(v, ...hints);
      if (nested.length) return nested;
    }
  }
  return [];
}

function normalizeStatus(raw: string): 'Active' | 'Pending' | 'Suspended' {
  const s = raw.toUpperCase();
  if (s === 'ACTIVE' || s === 'ENABLED') return 'Active';
  if (s === 'SUSPENDED' || s === 'DISABLED' || s === 'BANNED') return 'Suspended';
  return 'Pending';
}

function fmtDate(iso: string): string {
  if (!iso) return '';
  try {
    return new Date(iso).toLocaleDateString('en-US', {
      month: 'short', day: '2-digit', year: 'numeric',
    });
  } catch {
    return iso;
  }
}

/* -------- System tenant list -------- */

export type SystemTenant = {
  id: string;
  name: string;
  domain: string;
  status: 'Active' | 'Pending' | 'Suspended';
  plan: string;
  members: number;
  createdAt: string;
  email?: string;
  phone?: string;
  slug?: string;
  lastActive?: string;
  adminUsers?: number;
  totalGiving?: string;
};

function mapTenant(row: R): SystemTenant {
  const id = fieldOf(row, ['id', 'tenantId', 'slug']);
  const name = fieldOf(row, ['name', 'tenantName', 'displayName', 'organizationName']);
  const slug = fieldOf(row, ['slug', 'tenantSlug', 'shortName']);
  const subDomain = fieldOf(row, ['subDomain', 'subdomain']);
  const customDomain = fieldOf(row, ['customDomain', 'domain', 'hostname']);
  const domain = customDomain || (subDomain ? `${subDomain}.go-worship.com` : `${slug}.go-worship.com`);
  const rawStatus = fieldOf(row, ['status', 'tenantStatus', 'accountStatus']);
  const status = rawStatus ? normalizeStatus(rawStatus) : 'Pending';
  const plan = fieldOf(row, ['planName', 'plan', 'subscriptionPlan', 'subscription', 'tier']);
  const members = Number(fieldOf(row, ['memberCount', 'members', 'totalMembers', 'userCount']) || 0);
  const createdAt = fmtDate(fieldOf(row, ['createdAt', 'registeredAt', 'joinedAt', 'createdDate']));
  const email = fieldOf(row, ['email', 'billingEmail', 'adminEmail', 'contactEmail']) || undefined;
  const phone = fieldOf(row, ['phone', 'phoneNumber', 'contactPhone']) || undefined;
  const lastActive = fmtDate(fieldOf(row, ['lastActive', 'lastActiveAt', 'lastSeen', 'updatedAt'])) || undefined;
  const adminUsers = Number(fieldOf(row, ['adminUsers', 'adminCount', 'adminUserCount'])) || undefined;
  const rawGiving = fieldOf(row, ['totalGiving', 'givingVolume', 'totalRevenue', 'givingTotal']);
  const totalGiving = rawGiving ? (rawGiving.startsWith('$') ? rawGiving : `$${Number(rawGiving).toLocaleString()}`) : undefined;
  return { id, name, domain, status, plan, members, createdAt, email, phone, slug: slug || undefined, lastActive, adminUsers, totalGiving };
}

export async function getSystemTenants(page = 0, size = 25): Promise<SystemTenant[]> {
  const data = await api.get<unknown>(`/system/tenants?page=${page}&size=${size}&sort=name,asc`);
  const rows = findTableRows(data, 'tenant');
  return rows.map(mapTenant).filter((t) => t.name);
}

export async function getSystemTenant(id: string): Promise<SystemTenant | null> {
  try {
    const data = await api.get<unknown>(`/system/tenants/${encodeURIComponent(id)}/management`);
    if (!data || typeof data !== 'object') return null;
    const mgmt = data as Record<string, unknown>;
    const tenant = (mgmt['tenant'] ?? mgmt) as R;
    return mapTenant(tenant);
  } catch {
    return null;
  }
}

export type SystemTenantManagementResponse = {
  tenant: {
    id: string;
    name: string;
    shortName?: string;
    legalName?: string;
    slug: string;
    status: string;
    billingEmail?: string;
    active: boolean;
    customDomain?: string;
    customDomainVerified: boolean;
    subDomain?: string;
    countryCode?: string;
    currency?: string;
    lastActivityAt?: string;
    createdAt?: string;
    updatedAt?: string;
  };
  administrator: {
    id: string;
    email: string;
    displayName?: string;
    status: string;
    firstLoginRequired: boolean;
  } | null;
  canReissueInvitation: boolean;
  reissueUnavailableReason?: string | null;
};

/** GET /system/tenants/management (paginated list with administrator info) */
export const getSystemTenantManagementPage = (page = 0, size = 25) =>
  api.get<{ content?: SystemTenantManagementResponse[]; totalElements?: number; totalPages?: number }>(
    `/system/tenants/management?page=${page}&size=${size}&sort=name,asc`
  );

/** GET /system/tenants/{tenantId}/management */
export const getSystemTenantManagement = (tenantId: string) =>
  api.get<SystemTenantManagementResponse>(`/system/tenants/${encodeURIComponent(tenantId)}/management`);

/** POST /system/tenants/{tenantId}/first-login-invitation/reissue */
export const reissueSystemTenantInvitation = (tenantId: string) =>
  api.post<unknown>(`/system/tenants/${encodeURIComponent(tenantId)}/first-login-invitation/reissue`);

/* -------- System user list -------- */

export type SystemUser = {
  id: string;
  name: string;
  email: string;
  role: string;
  status: 'Active' | 'Inactive';
  lastLogin: string;
  createdAt: string;
};

function mapRole(row: R): string {
  const codes = row['roleCodes'];
  const first = Array.isArray(codes) && codes.length ? String(codes[0]) : '';
  const userType = first || fieldOf(row, ['userType', 'role', 'roleCode']);
  switch (userType.toUpperCase()) {
    case 'SUPER_SYSTEM_ADMIN':
    case 'SUPER_ADMIN':
    case 'SYSTEM_SUPER_ADMIN': return 'Super Admin';
    case 'SYSTEM':
    case 'SYSTEM_ADMIN':       return 'Admin';
    case 'SYSTEM_SUPPORT':     return 'Support';
    case 'SYSTEM_AUDITOR':     return 'Auditor';
    default: return userType || 'Admin';
  }
}

function mapUser(row: R): SystemUser {
  const id = fieldOf(row, ['id', 'userId']);
  const name = fieldOf(row, ['displayName', 'fullName', 'name', 'username']);
  const email = fieldOf(row, ['email', 'emailAddress', 'username']);
  const role = mapRole(row);
  const rawStatus = fieldOf(row, ['status', 'accountStatus', 'userStatus']);
  const status = rawStatus.toUpperCase() === 'ACTIVE' ? 'Active' : 'Inactive';
  const lastLogin = fmtDate(fieldOf(row, ['lastLoginAt', 'lastLogin', 'lastActivity', 'lastSeen']));
  const createdAt = fmtDate(fieldOf(row, ['createdAt', 'createdDate', 'registeredAt']));
  return { id, name, email, role, status, lastLogin, createdAt };
}

export async function getSystemUsers(): Promise<SystemUser[]> {
  const data = await api.get<unknown>('/system/users');
  const rows = findTableRows(data, 'user');
  return rows.map(mapUser).filter((u) => u.name || u.email);
}

/* -------- System dashboard stats -------- */

export type SystemStats = {
  totalTenants: number;
  activeTenants: number;
  totalUsers: number;
  givingVolume: string;
  trialTenants: number;
  overduePayments: number;
  pendingPayments?: number;
  newTenants?: number;
  totalCampuses?: number;
  activeUsers?: number;
  newUsers?: number;
  activeSessions?: number;
  riskySessions?: number;
  successfulAuths?: number;
  failedAuths?: number;
  lockedAccounts?: number;
  mfaEnabledUsers?: number;
  auditFailures?: number;
  upcomingEvents?: number;
  attendanceRecords?: number;
  visitorFollowUps?: number;
  publishedSermons?: number;
};

export async function getSystemStats(): Promise<SystemStats | null> {
  // /system/dashboard not in backend API — only /dashboard (root) exists.
  return null;
}

/* -------- Tenant provisioning -------- */

export type ProvisionTenantPayload = {
  tenant: {
    name: string;
    shortName?: string;
    slug: string;
    legalName?: string;
    billingEmail: string;
    /** Bare label for a hosted subdomain, e.g. "rccgros" → rccgros.go-worship.com. Null when customDomain is set. */
    subDomain?: string | null;
    /** Full custom domain, e.g. "worship.rccg.org". Null when subDomain is set. */
    customDomain?: string | null;
    countryCode?: string;
    currency?: string;
  };
  adminEmail: string;
};

export const provisionTenant = (payload: ProvisionTenantPayload) =>
  api.post<unknown>('/system/tenants/indirect', payload);

export type UpdateTenantPayload = {
  name?: string;
  tenantUrl?: string;
  email?: string;
  phone?: string;
  plan?: string;
  memberCount?: number;
  [key: string]: unknown;
};

/** PUT /system/tenants/:id — not implemented in backend; listed in KNOWN_LIMITATIONS. */
export const updateSystemTenant = (_id: string, _payload: UpdateTenantPayload): Promise<unknown> => {
  throw new Error('Tenant editing is not available — this endpoint does not exist in the current backend version.');
};

/* -------- Platform user provisioning -------- */

// Confirmed valid values from DO backend OpenAPI spec.
export type SystemUserType = 'SYSTEM_ADMIN' | 'SUPER_SYSTEM_ADMIN' | 'SYSTEM' | 'SYSTEM_AUDITOR';

export type ProvisionSystemUserPayload = {
  email: string;
  username: string;
  displayName: string;
  userType: SystemUserType;
  roleCodes: string[];
  sendInviteEmail?: boolean;
  profile?: {
    fullName?: string;
    email?: string;
    phone?: string;
  };
};

export const provisionSystemUser = (payload: ProvisionSystemUserPayload) =>
  api.post<unknown>('/system/users/provision', payload);

/** GET /system/users/{userId} */
export const getSystemUser = (userId: string) =>
  api.get<SystemUser>(`/system/users/${encodeURIComponent(userId)}`);

/** PUT /system/users/{userId} */
export const updateSystemUser = (userId: string, payload: Partial<ProvisionSystemUserPayload>) =>
  api.put<SystemUser>(`/system/users/${encodeURIComponent(userId)}`, payload);

/** DELETE /system/users/{userId} */
export const deleteSystemUser = (userId: string) =>
  api.del<unknown>(`/system/users/${encodeURIComponent(userId)}`);

/** GET /system/users/{userId}/roles */
export const getSystemUserRoles = (userId: string) =>
  api.get<unknown[]>(`/system/users/${encodeURIComponent(userId)}/roles`);

/** POST /system/users/{userId}/roles */
export const setSystemUserRoles = (userId: string, payload: { roleIds: string[] }) =>
  api.post<unknown>(`/system/users/${encodeURIComponent(userId)}/roles`, payload);

/* -------- System Tenant Lifecycle Actions (/system/tenants/{tenantId}/*) ---- */

export type TenantActionResponse = {
  ok?: boolean;
  code?: string;
  message?: string;
  serverTime?: string;
  data?: Record<string, unknown>;
};

/** PATCH /system/tenants/{tenantId}/activate */
export const activateSystemTenant = (tenantId: string) =>
  api.patch<TenantActionResponse>(`/system/tenants/${encodeURIComponent(tenantId)}/activate`);

/** PATCH /system/tenants/{tenantId}/suspend */
export const suspendSystemTenant = (tenantId: string, reason?: string) => {
  const path = reason
    ? `/system/tenants/${encodeURIComponent(tenantId)}/suspend?reason=${encodeURIComponent(reason)}`
    : `/system/tenants/${encodeURIComponent(tenantId)}/suspend`;
  return api.patch<TenantActionResponse>(path);
};

/** DELETE /system/tenants/{tenantId}/soft-delete */
export const softDeleteSystemTenant = (tenantId: string) =>
  api.del<unknown>(`/system/tenants/${encodeURIComponent(tenantId)}/soft-delete`);

/* -------- System Payment Gateways (/system/payment-gateways) --------------- */

export type SystemPaymentGateway = {
  id?: string;
  gatewayType?: string;
  environment?: string;
  displayName?: string;
  publicKey?: string;
  secretKey?: string;
  webhookSecret?: string;
  active?: boolean;
  platformDefault?: boolean;
};

export type CreatePaymentGatewayPayload = {
  gatewayType: string;
  environment?: string;
  displayName?: string;
  publicKey?: string;
  secretKey?: string;
  webhookSecret?: string;
  active?: boolean;
  platformDefault?: boolean;
};

/** GET /system/payment-gateways */
export async function getSystemPaymentGateways(): Promise<SystemPaymentGateway[]> {
  const data = await api.get<unknown>('/system/payment-gateways');
  return Array.isArray(data) ? (data as SystemPaymentGateway[]) : [];
}

/** POST /system/payment-gateways */
export const createSystemPaymentGateway = (payload: CreatePaymentGatewayPayload) =>
  api.post<SystemPaymentGateway>('/system/payment-gateways', payload);

/** PUT /system/payment-gateways/{providerId} */
export const updateSystemPaymentGateway = (providerId: string, payload: Partial<CreatePaymentGatewayPayload>) =>
  api.put<SystemPaymentGateway>(`/system/payment-gateways/${encodeURIComponent(providerId)}`, payload);

/** PATCH /system/payment-gateways/{providerId}/active */
export const setSystemPaymentGatewayActive = (providerId: string, active: boolean) =>
  api.patch<SystemPaymentGateway>(
    `/system/payment-gateways/${encodeURIComponent(providerId)}/active`,
    { active }
  );

/* -------- System Branding (/system/branding) -------------------------------- */

export type SystemBrandingFull = {
  id?: string;
  domain?: string;
  title?: string;
  name?: string;
  shortName?: string;
  windowTitle?: string;
  status?: string;
  themeMode?: string;
  primaryColor?: string;
  secondaryColor?: string;
  accentColor?: string;
  backgroundColor?: string;
  surfaceColor?: string;
  textColor?: string;
  mutedTextColor?: string;
  borderColor?: string;
  successColor?: string;
  warningColor?: string;
  errorColor?: string;
  primaryFont?: string;
  secondaryFont?: string;
  tagline?: string;
  description?: string;
  homeUrl?: string;
  supportEmail?: string;
  supportUrl?: string;
  termsUrl?: string;
  privacyUrl?: string;
  docsUrl?: string;
  twitterHandle?: string;
  assets?: SystemBrandingAsset[];
  updatedAt?: string;
};

export type SystemBrandingAsset = {
  id?: string;
  category?: string;
  fileName?: string;
  contentType?: string;
  contentLength?: number;
  checksum?: string;
  url?: string;
  active?: boolean;
  createdAt?: string;
  updatedAt?: string;
};

export type SystemBrandingUpdatePayload = Omit<SystemBrandingFull, 'id' | 'domain' | 'assets' | 'updatedAt'>;

/** GET /system/branding */
export const getSystemBranding = () =>
  api.get<SystemBrandingFull>('/system/branding');

/** PUT /system/branding */
export const updateSystemBranding = (payload: SystemBrandingUpdatePayload) =>
  api.put<SystemBrandingFull>('/system/branding', payload);

/** DELETE /system/branding */
export const deleteSystemBranding = () =>
  api.del<SystemBrandingFull>('/system/branding');

/** POST /system/branding/activate */
export const activateSystemBranding = () =>
  api.post<SystemBrandingFull>('/system/branding/activate');

/** GET /system/branding/assets */
export async function getSystemBrandingAssets(): Promise<SystemBrandingAsset[]> {
  const data = await api.get<unknown>('/system/branding/assets');
  return Array.isArray(data) ? (data as SystemBrandingAsset[]) : [];
}

/** POST /system/branding/assets/{category} (multipart) */
export async function uploadSystemBrandingAsset(category: string, file: File): Promise<SystemBrandingAsset> {
  const fd = new FormData();
  fd.append('file', file);
  const res = await fetch(`/bff/gw/system/branding/assets/${encodeURIComponent(category)}`, {
    method: 'POST',
    body: fd,
    credentials: 'include',
  });
  if (!res.ok) {
    const body = await res.json().catch(() => null);
    throw new Error((body as Record<string, unknown>)?.message as string || `Upload failed (${res.status})`);
  }
  return res.json() as Promise<SystemBrandingAsset>;
}

/** DELETE /system/branding/assets/{assetId} */
export const deleteSystemBrandingAsset = (assetId: string) =>
  api.del<unknown>(`/system/branding/assets/${encodeURIComponent(assetId)}`);

/* -------- System Tenant Payment Gateways (/system/tenants/{tenantId}/payment-gateways) */

export type TenantPaymentGatewayAssignment = {
  id?: string;
  tenantId?: string;
  providerId?: string;
  gatewayType?: string;
  environment?: string;
  displayName?: string;
  active?: boolean;
  primaryGateway?: boolean;
  allowCustomerCheckout?: boolean;
  allowSubscriptionBilling?: boolean;
  notes?: string;
};

export type AssignTenantGatewaysPayload = {
  gatewayCodes: string[];
  primaryGatewayCode?: string;
  allowCustomerCheckout?: boolean;
  allowSubscriptionBilling?: boolean;
  notes?: string;
};

/** GET /system/tenants/{tenantId}/payment-gateways */
export async function getSystemTenantPaymentGateways(tenantId: string): Promise<TenantPaymentGatewayAssignment[]> {
  const data = await api.get<unknown>(`/system/tenants/${encodeURIComponent(tenantId)}/payment-gateways`);
  return Array.isArray(data) ? (data as TenantPaymentGatewayAssignment[]) : [];
}

/** POST /system/tenants/{tenantId}/payment-gateways */
export const assignSystemTenantPaymentGateways = (tenantId: string, payload: AssignTenantGatewaysPayload) =>
  api.post<TenantPaymentGatewayAssignment>(`/system/tenants/${encodeURIComponent(tenantId)}/payment-gateways`, payload);

/** PATCH /system/tenants/{tenantId}/payment-gateways/{assignmentId}/active */
export const setSystemTenantGatewayActive = (tenantId: string, assignmentId: string, active: boolean) =>
  api.patch<TenantPaymentGatewayAssignment>(`/system/tenants/${encodeURIComponent(tenantId)}/payment-gateways/${encodeURIComponent(assignmentId)}/active`, { active });

/** PATCH /system/tenants/{tenantId}/payment-gateways/{assignmentId}/primary */
export const setSystemTenantPrimaryGateway = (tenantId: string, assignmentId: string) =>
  api.patch<TenantPaymentGatewayAssignment>(`/system/tenants/${encodeURIComponent(tenantId)}/payment-gateways/${encodeURIComponent(assignmentId)}/primary`);

/* -------- System Subscriptions (/system/subscriptions) --------------------- */

export type SystemSubscription = {
  id?: string;
  tenantId?: string;
  status?: string;
  inTrial?: boolean;
  autoRenewEnabled?: boolean;
  trialStartedAt?: string;
  trialEndsAt?: string;
  currentPeriodStart?: string;
  currentPeriodEnd?: string;
  nextBillingAt?: string;
  pastDueAt?: string;
  gracePeriodEndsAt?: string;
  suspendedAt?: string;
  expiredAt?: string;
  canceledAt?: string;
};

export type SystemSubscriptionsPagedResponse = {
  totalElements?: number;
  totalPages?: number;
  first?: boolean;
  last?: boolean;
  numberOfElements?: number;
  size?: number;
  number?: number;
  empty?: boolean;
  content?: SystemSubscription[];
};

/** GET /system/subscriptions (paginated) */
export const getSystemSubscriptions = (page = 0, size = 20, status?: string) => {
  const params = new URLSearchParams({ page: String(page), size: String(size) });
  if (status) params.set('status', status);
  return api.get<SystemSubscriptionsPagedResponse>(`/system/subscriptions?${params.toString()}`);
};

/** GET /system/subscriptions/tenant/{tenantId} */
export const getSystemTenantSubscription = (tenantId: string) =>
  api.get<SystemSubscription>(`/system/subscriptions/tenant/${encodeURIComponent(tenantId)}`);

/** GET /system/subscriptions/tenant/{tenantId}/lifecycle */
export const getSystemTenantSubscriptionLifecycle = (tenantId: string) =>
  api.get<Record<string, unknown>>(`/system/subscriptions/tenant/${encodeURIComponent(tenantId)}/lifecycle`);

/* -------- System Audit (/system/audit) ------------------------------------ */

export type SystemAuditEvent = {
  id?: string;
  eventType?: string;
  action?: string;
  actorId?: string;
  actorEmail?: string;
  targetType?: string;
  targetId?: string;
  description?: string;
  ipAddress?: string;
  createdAt?: string;
  severity?: string;
};

/** GET /system/audit/events/recent */
export async function getSystemAuditEventsRecent(): Promise<SystemAuditEvent[]> {
  const data = await api.get<unknown>('/system/audit/events/recent');
  return Array.isArray(data) ? (data as SystemAuditEvent[]) : [];
}

/* -------- System Billing Plans (/system/billing/plans) ------------------- */

export type SystemBillingPlan = {
  id?: string;
  planId?: string;
  code?: string;
  name?: string;
  description?: string;
  price?: number;
  currency?: string;
  billingCycle?: string;
  trialPeriodDays?: number;
  maxUsers?: number;
  maxCampuses?: number;
  features?: string[];
  active?: boolean;
  publicPlan?: boolean;
  createdAt?: string;
};

export type BillingPlanPayload = {
  code?: string;
  name: string;
  description?: string;
  price?: number;
  currency?: string;
  billingCycle?: string;
  trialPeriodDays?: number;
  maxUsers?: number;
  maxCampuses?: number;
  features?: string[];
  active?: boolean;
  publicPlan?: boolean;
};

/** GET /system/billing/plans */
export async function getSystemBillingPlans(): Promise<SystemBillingPlan[]> {
  const data = await api.get<unknown>('/system/billing/plans');
  return Array.isArray(data) ? (data as SystemBillingPlan[]) : [];
}

/** POST /system/billing/plans */
export const createSystemBillingPlan = (payload: BillingPlanPayload) =>
  api.post<SystemBillingPlan>('/system/billing/plans', payload);

/** GET /system/billing/plans/{planId} */
export const getSystemBillingPlan = (planId: string) =>
  api.get<SystemBillingPlan>(`/system/billing/plans/${encodeURIComponent(planId)}`);

/** PUT /system/billing/plans/{planId} */
export const updateSystemBillingPlan = (planId: string, payload: Partial<BillingPlanPayload>) =>
  api.put<SystemBillingPlan>(`/system/billing/plans/${encodeURIComponent(planId)}`, payload);

/** DELETE /system/billing/plans/{planId} — not in live OpenAPI spec (GET PUT only); backend will reject. */
export const deleteSystemBillingPlan = (planId: string) =>
  api.del<unknown>(`/system/billing/plans/${encodeURIComponent(planId)}`);

/* -------- System Roles (/system/roles) ------------------------------------ */

export type SystemRole = {
  id?: string;
  code?: string;
  name?: string;
  description?: string;
  type?: string;
  active?: boolean;
};

export type SystemRolePayload = {
  code?: string;
  name: string;
  description?: string;
  type?: string;
};

/** GET /system/roles */
export async function getSystemRoles(): Promise<SystemRole[]> {
  const data = await api.get<unknown>('/system/roles');
  return Array.isArray(data) ? (data as SystemRole[]) : [];
}

/** POST /system/roles */
export const createSystemRole = (payload: SystemRolePayload) =>
  api.post<SystemRole>('/system/roles', payload);

/** GET /system/roles/{id} */
export const getSystemRole = (id: string) =>
  api.get<SystemRole>(`/system/roles/${encodeURIComponent(id)}`);

/** PUT /system/roles/{id} */
export const updateSystemRole = (id: string, payload: Partial<SystemRolePayload>) =>
  api.put<SystemRole>(`/system/roles/${encodeURIComponent(id)}`, payload);

/** DELETE /system/roles/{id} */
export const deleteSystemRole = (id: string) =>
  api.del<unknown>(`/system/roles/${encodeURIComponent(id)}`);

/** GET /system/roles/{id}/permissions */
export const getSystemRolePermissions = (id: string) =>
  api.get<{ permissionIds?: string[]; permissions?: SystemPermission[]; [key: string]: unknown }>(
    `/system/roles/${encodeURIComponent(id)}/permissions`
  );

/** PUT /system/roles/{id}/permissions */
export const updateSystemRolePermissions = (id: string, payload: { permissionIds: string[] }) =>
  api.put<SystemRole>(`/system/roles/${encodeURIComponent(id)}/permissions`, payload);

/* -------- System Permissions (/system/permissions) ----------------------- */

export type SystemPermission = {
  id?: string;
  code?: string;
  name?: string;
  description?: string;
  type?: string;
};

/** GET /system/permissions */
export async function getSystemPermissions(): Promise<SystemPermission[]> {
  const data = await api.get<unknown>('/system/permissions');
  return Array.isArray(data) ? (data as SystemPermission[]) : [];
}

/** POST /system/permissions */
export const createSystemPermission = (payload: Partial<SystemPermission>) =>
  api.post<SystemPermission>('/system/permissions', payload);

/** GET /system/permissions/{id} */
export const getSystemPermissionById = (id: string) =>
  api.get<SystemPermission>(`/system/permissions/${encodeURIComponent(id)}`);

/** PUT /system/permissions/{id} */
export const updateSystemPermission = (id: string, payload: Partial<SystemPermission>) =>
  api.put<SystemPermission>(`/system/permissions/${encodeURIComponent(id)}`, payload);

/** DELETE /system/permissions/{id} */
export const deleteSystemPermission = (id: string) =>
  api.del<unknown>(`/system/permissions/${encodeURIComponent(id)}`);

/** GET /system/permissions/code/{code} */
export const getSystemPermissionByCode = (code: string) =>
  api.get<SystemPermission>(`/system/permissions/code/${encodeURIComponent(code)}`);

/** GET /system/permissions/type/{type} */
export const getSystemPermissionsByType = (type: string) =>
  api.get<SystemPermission[]>(`/system/permissions/type/${encodeURIComponent(type)}`);

/* -------- System Site Templates (/system/site-templates) --------------- */

/** GET /system/site-templates */
export const getSystemSiteTemplates = (templateType?: string) =>
  api.get<Record<string, unknown>[]>(
    templateType ? `/system/site-templates?templateType=${encodeURIComponent(templateType)}` : '/system/site-templates'
  );

/** GET /system/site-templates/resolved */
export const getResolvedSystemSiteTemplate = (templateType?: string) =>
  api.get<Record<string, unknown>>(
    templateType ? `/system/site-templates/resolved?templateType=${encodeURIComponent(templateType)}` : '/system/site-templates/resolved'
  );

/** POST /system/site-templates */
export const createSystemSiteTemplate = (payload: Record<string, unknown>) =>
  api.post<Record<string, unknown>>('/system/site-templates', payload);

/** PUT /system/site-templates/{templateId} */
export const updateSystemSiteTemplate = (templateId: string, payload: Record<string, unknown>) =>
  api.put<Record<string, unknown>>(`/system/site-templates/${encodeURIComponent(templateId)}`, payload);

/** DELETE /system/site-templates/{templateId} */
export const deleteSystemSiteTemplate = (templateId: string) =>
  api.del<unknown>(`/system/site-templates/${encodeURIComponent(templateId)}`);

/** GET /system/site-templates/{templateId}/content */
export const getSystemSiteTemplateContent = (templateId: string) =>
  api.get<Record<string, unknown>>(`/system/site-templates/${encodeURIComponent(templateId)}/content`);

/** POST /system/site-templates/{templateId}/publish */
export const publishSystemSiteTemplate = (templateId: string) =>
  api.post<Record<string, unknown>>(`/system/site-templates/${encodeURIComponent(templateId)}/publish`);

/* -------- System Audit extended (/system/audit) ----------------------- */

/** GET /system/audit/events/{eventId} */
export const getSystemAuditEventById = (eventId: string) =>
  api.get<SystemAuditEvent>(`/system/audit/events/${encodeURIComponent(eventId)}`);

/** GET /system/audit/export/recent.csv */
export function systemAuditExportUrl(): string {
  return '/bff/gw/system/audit/export/recent.csv';
}

/** GET /system/audit/payment-gateway-changes/recent */
export async function getSystemAuditPaymentGatewayChanges(): Promise<SystemAuditEvent[]> {
  const data = await api.get<unknown>('/system/audit/payment-gateway-changes/recent');
  return Array.isArray(data) ? (data as SystemAuditEvent[]) : [];
}

/** GET /system/audit/role-permission-changes/recent */
export async function getSystemAuditRolePermissionChanges(): Promise<SystemAuditEvent[]> {
  const data = await api.get<unknown>('/system/audit/role-permission-changes/recent');
  return Array.isArray(data) ? (data as SystemAuditEvent[]) : [];
}

/** GET /system/audit/sensitive-actions/recent */
export async function getSystemAuditSensitiveActions(): Promise<SystemAuditEvent[]> {
  const data = await api.get<unknown>('/system/audit/sensitive-actions/recent');
  return Array.isArray(data) ? (data as SystemAuditEvent[]) : [];
}

/* -------- System Payment Gateway Platform Default --------------------- */

/** PATCH /system/payment-gateways/{providerId}/platform-default */
export const setSystemPlatformDefaultGateway = (providerId: string, environment?: string) =>
  api.patch<unknown>(
    `/system/payment-gateways/${encodeURIComponent(providerId)}/platform-default${environment ? `?environment=${encodeURIComponent(environment)}` : ''}`
  );

/* -------- System Tenant Domain Reactivation --------------------------- */

/** GET /system/tenants/{tenantId}/custom-domain/reactivation */
export const getSystemTenantDomainReactivation = (tenantId: string) =>
  api.get<Record<string, unknown>>(`/system/tenants/${encodeURIComponent(tenantId)}/custom-domain/reactivation`);

/** POST /system/tenants/{tenantId}/custom-domain/reactivation */
export const approveSystemTenantDomainReactivation = (tenantId: string) =>
  api.post<unknown>(`/system/tenants/${encodeURIComponent(tenantId)}/custom-domain/reactivation`);

/* -------- System Tenant Merchant Account ------------------------------ */

/** GET /system/tenants/{tenantId}/payment-gateways/merchant-account */
export const getSystemTenantMerchantAccount = (tenantId: string) =>
  api.get<Record<string, unknown>>(`/system/tenants/${encodeURIComponent(tenantId)}/payment-gateways/merchant-account`);

/** PATCH /system/tenants/{tenantId}/payment-gateways/merchant-account */
export const updateSystemTenantMerchantAccount = (tenantId: string, payload: Record<string, unknown>) =>
  api.patch<unknown>(`/system/tenants/${encodeURIComponent(tenantId)}/payment-gateways/merchant-account`, payload);


/* -------- System Communications (/system/communications) --------------- */

/** POST /system/communications */
export const sendSystemCommunication = (payload: Record<string, unknown>) =>
  api.post<unknown>('/system/communications', payload);

/** GET /system/communications/sent */
export const getSystemCommunicationsSent = (page = 0, size = 20) =>
  api.get<unknown>(`/system/communications/sent?page=${page}&size=${size}`);

/** GET /system/communications/sent/{batchId}/recipients */
export const getSystemCommunicationRecipients = (batchId: string) =>
  api.get<unknown[]>(`/system/communications/sent/${encodeURIComponent(batchId)}/recipients`);

/** GET /system/communications/targets/tenants */
export const getSystemCommunicationTargets = () =>
  api.get<unknown[]>('/system/communications/targets/tenants');
