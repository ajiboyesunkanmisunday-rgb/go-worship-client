/**
 * System-Owner portal API helpers (Bearer via /bff/gw).
 *
 * Provisioning calls are MFA-gated by the backend:
 *  - 200 {ok:false, code:"MFA_REQUIRED", ...}  → step-up challenge (use StepUpMfaDialog)
 *  - 403 {code:"MFA_ENROLLMENT_REQUIRED", ...}  → admin must enrol MFA first
 *
 * Endpoints (SO-006…009 from the Postman collection):
 *   POST /system/tenants/provision        — provision tenant + first admin (QA v2.0 SO-009)
 *   POST /system/users/provision          — provision SO platform user
 *   GET  /system/dashboard/admin/tenants  — tenant list (500-free workaround for /system/tenants)
 *   GET  /system/dashboard/admin/users    — user list (500-free workaround for /system/users)
 *   GET  /system/dashboard                — aggregate stats
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
  return { id, name, domain, status, plan, members, createdAt };
}

export async function getSystemTenants(): Promise<SystemTenant[]> {
  const data = await api.get<unknown>('/system/dashboard/admin/tenants');
  const rows = findTableRows(data, 'tenant');
  return rows.map(mapTenant).filter((t) => t.name);
}

/** [VERIFY PATH] GET /system/dashboard/admin/tenants/:id */
export async function getSystemTenant(id: string): Promise<SystemTenant | null> {
  try {
    const data = await api.get<unknown>(`/system/dashboard/admin/tenants/${id}`);
    const rows = findTableRows(data, 'tenant');
    if (rows.length > 0) return mapTenant(rows[0]);
    if (data && typeof data === 'object') return mapTenant(data as Record<string, unknown>);
    return null;
  } catch {
    // Fall back to fetching all and filtering by id
    try {
      const all = await getSystemTenants();
      return all.find((t) => t.id === id) ?? null;
    } catch {
      return null;
    }
  }
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
    case 'SYSTEM_ADMIN':   return 'Admin';
    case 'SYSTEM_SUPPORT': return 'Support';
    case 'SYSTEM_AUDITOR': return 'Auditor';
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
  const data = await api.get<unknown>('/system/dashboard/admin/users');
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
};

export async function getSystemStats(): Promise<SystemStats | null> {
  try {
    const data = await api.get<R>('/system/dashboard');
    if (!data || typeof data !== 'object') return null;
    const d = (data as R);
    const inner = (d['data'] ?? d) as R;
    return {
      totalTenants:    Number(fieldOf(inner, ['totalTenants', 'tenantCount', 'tenants'])) || 0,
      activeTenants:   Number(fieldOf(inner, ['activeTenants', 'activeCount'])) || 0,
      totalUsers:      Number(fieldOf(inner, ['totalUsers', 'userCount', 'users'])) || 0,
      givingVolume:    fieldOf(inner, ['givingVolume', 'totalGiving', 'volume', 'totalRevenue']),
      trialTenants:    Number(fieldOf(inner, ['trialTenants', 'trialCount'])) || 0,
      overduePayments: Number(fieldOf(inner, ['overduePayments', 'overdue'])) || 0,
      pendingPayments: Number(fieldOf(inner, ['pendingPayments', 'pending'])) || undefined,
    };
  } catch {
    return null;
  }
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
  api.post<unknown>('/system/tenants/provision', payload);

export type UpdateTenantPayload = {
  name?: string;
  tenantUrl?: string;
  email?: string;
  phone?: string;
  plan?: string;
  memberCount?: number;
  [key: string]: unknown;
};

/** PUT /system/tenants/:id */
export const updateSystemTenant = (id: string, payload: UpdateTenantPayload) =>
  api.put<unknown>(`/system/tenants/${id}`, payload);

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
