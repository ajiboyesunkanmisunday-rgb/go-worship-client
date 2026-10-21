/**
 * Tenant (church) portal API helpers (Bearer via /bff/gw).
 *
 * All paths target the tenant's OWN host (Option A).  In the BFF the
 * `resolveUpstream` helper routes localhost → api.go-worship.com, and any
 * church subdomain/custom domain → its own API.  Client-side calls go through
 * /bff/gw which threads the incoming Host header to the upstream, so tenantId
 * is always resolved from the Host — never from a body field.
 *
 * CONFIRMED endpoints (from the Postman collection / live HAR):
 *   TN-007  POST /tenant/admin/users/customers         — ADMIN provisions a member (confirmed from OpenAPI spec)
 *   CU-001  POST /public/customers/register            — member SELF-registers (DIRECT; public, no Bearer needed)
 *
 * NOTE: /tenant/admin/users/provision (TN-006 staff/admin provisioning) is absent from
 * the confirmed backend OpenAPI spec — provisionTenantUser() is disabled below.
 * All paths are verified against the live DO OpenAPI spec at /v3/api-docs.
 */

import { api } from './client';

/* -------- Resilient response helpers (same pattern as system.ts) -------- */

type R = Record<string, unknown>;

function fieldOf(obj: R, keys: string[], fallback = ''): string {
  for (const k of keys) {
    const v = obj[k];
    if (v !== undefined && v !== null && v !== '') return String(v);
  }
  return fallback;
}

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

/* -------- Tenant Event -------- */

export type TenantEvent = {
  id: string;
  name: string;
  eventDate: string;
  eventTime: string;
  location: string;
  type: string;
  status: string;
  registrations: number;
  createdAt: string;
};

function mapEvent(row: R): TenantEvent {
  return {
    id: fieldOf(row, ['id', 'eventId']),
    name: fieldOf(row, ['name', 'title', 'eventName', 'displayName']),
    eventDate: fieldOf(row, ['eventDate', 'date', 'startDate', 'startTime']).split('T')[0] || '',
    eventTime: fieldOf(row, ['eventTime', 'time', 'startTime']).split('T')[1]?.substring(0, 5) || '',
    location: fieldOf(row, ['location', 'venue', 'address']),
    type: fieldOf(row, ['type', 'category', 'eventType']),
    status: fieldOf(row, ['status', 'eventStatus']),
    registrations: Number(fieldOf(row, ['registrationCount', 'registrations', 'attendees', 'totalRegistrations']) || 0),
    createdAt: fmtDate(fieldOf(row, ['createdAt', 'createdDate'])),
  };
}

export type CreateEventPayload = {
  name: string;
  hostName?: string;
  eventDate?: string;
  eventTime?: string;
  type?: string;
  location?: string;
  requiresRegistration?: boolean;
  description?: string;
  capacity?: number;
  status?: string;
  [key: string]: unknown;
};

/** POST /tenant/events */
export async function createTenantEvent(payload: CreateEventPayload): Promise<void> {
  await api.post('/tenant/events', payload);
}

/** GET /tenant/events */
export async function getTenantEvents(): Promise<TenantEvent[]> {
  const data = await api.get<unknown>('/tenant/events');
  return findTableRows(data, 'event').map(mapEvent).filter((e) => e.name);
}

/** GET /tenant/events/{eventId} */
export async function getTenantEvent(id: string): Promise<TenantEvent | null> {
  try {
    const data = await api.get<unknown>(`/tenant/events/${id}`);
    if (!data || typeof data !== 'object') return null;
    const d = data as R;
    const row = (d['data'] ?? d) as R;
    return mapEvent(row);
  } catch {
    return null;
  }
}

/* -------- Tenant Member (Customer) -------- */

export type TenantMember = {
  id: string;
  name: string;
  email: string;
  phone: string;
  status: 'Active' | 'Inactive';
  joinedAt: string;
  groups: string[];
};

function mapMember(row: R): TenantMember {
  const codes: string[] = Array.isArray(row['groupNames'])
    ? (row['groupNames'] as string[])
    : [];
  return {
    id: fieldOf(row, ['id', 'userId', 'customerId']),
    name: fieldOf(row, ['displayName', 'fullName', 'name', 'username']),
    email: fieldOf(row, ['email', 'emailAddress']),
    phone: fieldOf(row, ['phone', 'mobilePhone', 'phoneNumber']),
    status: fieldOf(row, ['status', 'accountStatus']).toUpperCase() === 'ACTIVE' ? 'Active' : 'Inactive',
    joinedAt: fmtDate(fieldOf(row, ['createdAt', 'registeredAt', 'joinedAt'])),
    groups: codes,
  };
}

/** GET /tenant/admin/users/customers — list endpoint not in backend API; use POST to create only. */
export async function getTenantMembers(): Promise<TenantMember[]> {
  // GET /tenant/admin/users/customers not in backend API — return empty
  return [];
}

/** GET /tenant/admin/users/customers/:id — list endpoint not in backend API. */
export async function getTenantMember(_id: string): Promise<TenantMember | null> {
  // GET /tenant/admin/users/customers not in backend API — return null
  return null;
}

/* -------- Tenant Group -------- */

export type TenantGroup = {
  id: string;
  name: string;
  description: string;
  memberCount: number;
  leaderId: string;
  leaderName: string;
  status: string;
  createdAt: string;
  meetingDays?: string[];
  meetingTime?: string;
  meetingFrequency?: string;
  venueName?: string;
  onlineMeetingLink?: string;
};

function mapGroup(row: R): TenantGroup {
  return {
    id: fieldOf(row, ['id', 'groupId']),
    name: fieldOf(row, ['name', 'groupName', 'title']),
    description: fieldOf(row, ['description', 'about']),
    memberCount: Number(fieldOf(row, ['memberCount', 'members', 'totalMembers']) || 0),
    leaderId: fieldOf(row, ['leaderId', 'ownerId']),
    leaderName: fieldOf(row, ['leaderName', 'leader', 'ownerName']),
    status: fieldOf(row, ['status', 'groupStatus']),
    createdAt: fmtDate(fieldOf(row, ['createdAt', 'createdDate'])),
    meetingDays: Array.isArray(row['meetingDays']) ? (row['meetingDays'] as string[]) : undefined,
    meetingTime: fieldOf(row, ['meetingTime', 'time']) || undefined,
    meetingFrequency: fieldOf(row, ['meetingFrequency', 'frequency', 'schedule']) || undefined,
    venueName: fieldOf(row, ['venueName', 'venue', 'location']) || undefined,
    onlineMeetingLink: fieldOf(row, ['onlineMeetingLink', 'meetingLink', 'zoomLink', 'onlineLink']) || undefined,
  };
}

/** GET /tenant/admin/groups — no groups endpoint exists in the backend API. */
export async function getTenantGroups(): Promise<TenantGroup[]> {
  // /tenant/admin/groups not in backend API — return empty
  return [];
}

/** GET /tenant/admin/groups/:id — no groups endpoint exists in the backend API. */
export async function getTenantGroup(_id: string): Promise<TenantGroup | null> {
  // /tenant/admin/groups not in backend API — return null
  return null;
}

export type CreateGroupPayload = {
  name: string;
  type?: string;
  description?: string;
  leaderId?: string;
  leaderName?: string;
  meetingFrequency?: string;
  meetingDays?: string[];
  meetingTime?: string;
  meetingType?: string;
  venueName?: string;
  onlineMeetingLink?: string;
  isActive?: boolean;
  isPublic?: boolean;
};

/** POST /tenant/admin/groups — no groups endpoint exists in the backend API. */
export async function createTenantGroup(_payload: CreateGroupPayload): Promise<void> {
  // /tenant/admin/groups not in backend API — no-op
}

/** PUT /tenant/admin/groups/:id — no groups endpoint exists in the backend API. */
export async function updateTenantGroup(_id: string, _payload: Partial<CreateGroupPayload>): Promise<void> {
  // /tenant/admin/groups not in backend API — no-op
}

/* -------- Tenant Admin Dashboard Stats -------- */

export type TenantStats = {
  totalMembers: number;
  activeMembers: number;
  totalEvents: number;
  upcomingEvents: number;
  totalGroups: number;
  totalGiving: string;
  newMembers?: number;
  recentAttendance?: number;
  checkInsToday?: number;
};

export async function getTenantStats(): Promise<TenantStats | null> {
  try {
    const data = await api.get<R>('/tenant/admin/organization/analytics');
    if (!data || typeof data !== 'object') return null;
    const inner = ((data as R)['data'] ?? data) as R;
    return {
      totalMembers:   Number(fieldOf(inner, ['totalMembers', 'memberCount', 'members'])) || 0,
      activeMembers:  Number(fieldOf(inner, ['activeMembers', 'activeCount'])) || 0,
      totalEvents:    Number(fieldOf(inner, ['totalEvents', 'eventCount', 'events'])) || 0,
      upcomingEvents: Number(fieldOf(inner, ['upcomingEvents', 'upcoming'])) || 0,
      totalGroups:    Number(fieldOf(inner, ['totalGroups', 'groupCount', 'groups'])) || 0,
      totalGiving:    fieldOf(inner, ['totalGiving', 'givingVolume', 'totalRevenue', 'volume']),
      newMembers:     Number(fieldOf(inner, ['newMembers', 'newMemberCount', 'membersThisMonth'])) || undefined,
      recentAttendance: Number(fieldOf(inner, ['recentAttendance', 'attendanceCount', 'lastAttendance'])) || undefined,
      checkInsToday:  Number(fieldOf(inner, ['checkInsToday', 'todayCheckIns', 'dailyCheckIns', 'checkInCount'])) || undefined,
    };
  } catch {
    return null;
  }
}

/* -------- Tenant User Provisioning (confirmed: TN-006) -------- */

export type TenantUserType = 'TENANT' | 'TENANT_ADMIN' | 'TENANT_MANAGER' | 'TENANT_STAFF';

export type ProvisionTenantUserPayload = {
  email: string;
  username: string;
  displayName: string;
  userType: TenantUserType;
  roleCodes: string[];
  sendInviteEmail?: boolean;
  profile?: {
    fullName?: string;
    email?: string;
    phone?: string;
    jobTitle?: string;
    department?: string;
    preferredLocale?: string;
    preferredTimezone?: string;
  };
};

/** TN-006  POST /tenant/admin/users/provision — not in backend API — disabled. */
export const provisionTenantUser = (_payload: ProvisionTenantUserPayload): Promise<unknown> =>
  Promise.resolve(null);

/* -------- Member Provisioning (confirmed: TN-007) -------- */

export type ProvisionTenantMemberPayload = {
  email: string;
  username?: string;
  displayName: string;
  sendInviteEmail?: boolean;
  profile?: {
    fullName?: string;
    email?: string;
    phone?: string;
    dateOfBirth?: string;
    gender?: string;
    address?: string;
    preferredLocale?: string;
    preferredTimezone?: string;
  };
};

/** TN-007  POST /tenant/admin/users/customers — ADMIN provisions a member (confirmed path, no /provision suffix) */
export const provisionTenantMember = (payload: ProvisionTenantMemberPayload) =>
  api.post<unknown>('/tenant/admin/users/customers', payload);

/* -------- Member self-service content -------- */

/** GET /self/events — not in backend API; use /tenant/events instead for event listings. */
export async function getSelfEvents(): Promise<TenantEvent[]> {
  // /self/events not in backend API — return empty
  return [];
}

/** GET /self/events/:id — not in backend API. */
export async function getSelfEvent(_id: string): Promise<TenantEvent | null> {
  // /self/events not in backend API — return null
  return null;
}

/** GET /self/groups — not in backend API; no groups endpoint exists. */
export async function getSelfGroups(): Promise<TenantGroup[]> {
  // /self/groups not in backend API — return empty
  return [];
}

/** GET /self/groups/activities — not in backend API; no groups endpoint exists. */
export async function getSelfGroupActivities(): Promise<import('@/types/groups').GroupActivity[]> {
  // /self/groups/activities not in backend API — return empty
  return [];
}

/* -------- Tenant Branding (confirmed: brand.js + auth-endpoints memory) ---- */

export type TenantBranding = {
  organizationName?: string;
  logoUrl?: string;
  faviconUrl?: string;
  primaryColor?: string;
  secondaryColor?: string;
  accentColor?: string;
  fontFamily?: string;
  tagline?: string;
  description?: string;
  status?: string;
};

export type BrandingAsset = {
  id: string;
  category: string;
  fileName: string;
  url: string;
  contentType: string;
  contentLength: number;
};

/** GET /tenant/branding */
export async function getTenantBranding(): Promise<TenantBranding> {
  const data = await api.get<R>('/tenant/branding');
  const d = ((data as R)?.['data'] ?? data) as R;
  return {
    organizationName: fieldOf(d, ['organizationName', 'name', 'churchName']),
    logoUrl:          fieldOf(d, ['logoUrl', 'logo']),
    faviconUrl:       fieldOf(d, ['faviconUrl', 'favicon']),
    primaryColor:     fieldOf(d, ['primaryColor', 'primary']),
    secondaryColor:   fieldOf(d, ['secondaryColor', 'secondary']),
    accentColor:      fieldOf(d, ['accentColor', 'accent']),
    fontFamily:       fieldOf(d, ['fontFamily', 'font']),
    tagline:          fieldOf(d, ['tagline', 'slogan']),
    description:      fieldOf(d, ['description', 'about']),
    status:           fieldOf(d, ['status', 'brandStatus']),
  };
}

/** PUT /tenant/branding */
export async function updateTenantBranding(payload: Partial<TenantBranding>): Promise<void> {
  await api.put('/tenant/branding', payload);
}

/** PATCH /tenant/branding/activate */
export async function activateTenantBranding(): Promise<void> {
  await api.patch('/tenant/branding/activate', {});
}

/** GET /tenant/branding/assets */
export async function getTenantBrandingAssets(): Promise<BrandingAsset[]> {
  const data = await api.get<unknown>('/tenant/branding/assets');
  return (findTableRows(data, 'asset') as R[]).map((a) => ({
    id:            fieldOf(a, ['id', 'assetId']),
    category:      fieldOf(a, ['category']),
    fileName:      fieldOf(a, ['fileName', 'name']),
    url:           fieldOf(a, ['url', 'assetUrl']),
    contentType:   fieldOf(a, ['contentType', 'mimeType']),
    contentLength: Number(fieldOf(a, ['contentLength', 'size']) || 0),
  }));
}

/** POST /tenant/branding/assets/{category} (multipart) */
export async function uploadBrandingAsset(category: string, file: File): Promise<void> {
  const fd = new FormData();
  fd.append('file', file);
  await fetch(`/bff/gw/tenant/branding/assets/${encodeURIComponent(category)}`, {
    method: 'POST',
    body: fd,
    credentials: 'include',
  }).then(async (r) => {
    if (!r.ok) {
      const body = await r.json().catch(() => null);
      throw new Error((body as R)?.message as string || `Upload failed (${r.status})`);
    }
  });
}

/** DELETE /tenant/branding/assets/{id} */
export async function deleteBrandingAsset(id: string): Promise<void> {
  await api.del(`/tenant/branding/assets/${encodeURIComponent(id)}`);
}

/* -------- Tenant Billing / Subscription (confirmed: auth-endpoints memory) -- */

export type TenantSubscription = {
  planName: string;
  status: string;
  billingCycle: string;
  nextBillingDate: string;
  amount: string;
  currency: string;
  maxUsers: number | null;
  maxCampuses: number | null;
};

export type TenantInvoice = {
  id: string;
  reference: string;
  amount: string;
  currency: string;
  status: string;
  createdAt: string;
  paidAt: string;
};

/** GET /tenant/billing/subscription */
export async function getTenantSubscription(): Promise<TenantSubscription | null> {
  try {
    const data = await api.get<R>('/tenant/billing/subscription');
    const d = ((data as R)?.['data'] ?? data) as R;
    const plan = (d['plan'] ?? d) as R;
    return {
      planName:        fieldOf(d, ['planName', 'name']) || fieldOf(plan, ['name', 'planName']),
      status:          fieldOf(d, ['status', 'subscriptionStatus']),
      billingCycle:    fieldOf(d, ['billingCycle', 'cycle']) || fieldOf(plan, ['billingCycle']),
      nextBillingDate: fmtDate(fieldOf(d, ['nextBillingDate', 'renewalDate', 'nextRenewal'])),
      amount:          fieldOf(d, ['amount', 'price']) || fieldOf(plan, ['price', 'amount']),
      currency:        fieldOf(d, ['currency']) || fieldOf(plan, ['currency']),
      maxUsers:        Number(fieldOf(plan, ['maxUsers'])) || null,
      maxCampuses:     Number(fieldOf(plan, ['maxCampuses'])) || null,
    };
  } catch {
    return null;
  }
}

/** GET /tenant/billing/invoices */
export async function getTenantInvoices(): Promise<TenantInvoice[]> {
  const data = await api.get<unknown>('/tenant/billing/invoices');
  return (findTableRows(data, 'invoice') as R[]).map((row) => ({
    id:        fieldOf(row, ['id', 'invoiceId']),
    reference: fieldOf(row, ['reference', 'invoiceNumber', 'paymentReference']),
    amount:    fieldOf(row, ['amount', 'total', 'totalAmount']),
    currency:  fieldOf(row, ['currency']),
    status:    fieldOf(row, ['status', 'paymentStatus']),
    createdAt: fmtDate(fieldOf(row, ['createdAt', 'invoiceDate'])),
    paidAt:    fmtDate(fieldOf(row, ['paidAt', 'paymentDate'])),
  }));
}
