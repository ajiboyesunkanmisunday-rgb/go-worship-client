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

export async function getSystemTenants(): Promise<SystemTenant[]> {
  // All tried paths (/system/admin/tenants, /system/tenants, /system/organizations,
  // /system/dashboard/admin/tenants) returned 404 in localhost HAR — disabled until
  // the correct endpoint is confirmed from live DO.
  return [];
}

export async function getSystemTenant(_id: string): Promise<SystemTenant | null> {
  // Endpoint absent from OpenAPI spec — disabled.
  return null;
}

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

/** PUT /system/tenants/:id — no such endpoint in backend API — disabled. */
export const updateSystemTenant = (_id: string, _payload: UpdateTenantPayload): Promise<unknown> =>
  Promise.resolve(null);

/* -------- Platform user provisioning -------- */

export type SystemUserType = 'SYSTEM_ADMIN' | 'SYSTEM_SUPPORT' | 'SYSTEM_AUDITOR';

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

/** PATCH /system/payment-gateways/{providerId}/activate */
export const activateSystemPaymentGateway = (providerId: string) =>
  api.patch<SystemPaymentGateway>(`/system/payment-gateways/${encodeURIComponent(providerId)}/activate`);

/** PATCH /system/payment-gateways/{providerId}/deactivate */
export const deactivateSystemPaymentGateway = (providerId: string) =>
  api.patch<SystemPaymentGateway>(`/system/payment-gateways/${encodeURIComponent(providerId)}/deactivate`);

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

/** PUT /system/tenants/{tenantId}/payment-gateways */
export const assignSystemTenantPaymentGateways = (tenantId: string, payload: AssignTenantGatewaysPayload) =>
  api.put<TenantPaymentGatewayAssignment>(`/system/tenants/${encodeURIComponent(tenantId)}/payment-gateways`, payload);

/** PATCH /system/tenants/{tenantId}/payment-gateways/{gatewayType}/activate */
export const activateSystemTenantGateway = (tenantId: string, gatewayType: string) =>
  api.patch<TenantPaymentGatewayAssignment>(`/system/tenants/${encodeURIComponent(tenantId)}/payment-gateways/${encodeURIComponent(gatewayType)}/activate`);

/** PATCH /system/tenants/{tenantId}/payment-gateways/{gatewayType}/deactivate */
export const deactivateSystemTenantGateway = (tenantId: string, gatewayType: string) =>
  api.patch<TenantPaymentGatewayAssignment>(`/system/tenants/${encodeURIComponent(tenantId)}/payment-gateways/${encodeURIComponent(gatewayType)}/deactivate`);

/** PATCH /system/tenants/{tenantId}/payment-gateways/{gatewayType}/primary */
export const setSystemTenantPrimaryGateway = (tenantId: string, gatewayType: string) =>
  api.patch<TenantPaymentGatewayAssignment>(`/system/tenants/${encodeURIComponent(tenantId)}/payment-gateways/${encodeURIComponent(gatewayType)}/primary`);

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
