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

/** GET /tenant/events — confirmed in spec; used for customer event listings (/self/events is absent). */
export async function getSelfEvents(): Promise<TenantEvent[]> {
  return getTenantEvents();
}

/** GET /tenant/events/:id — confirmed in spec; used for customer single-event view. */
export async function getSelfEvent(id: string): Promise<TenantEvent | null> {
  return getTenantEvent(id);
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

/* -------- Tenant Branding (GET/PUT/DELETE /tenant/branding + assets) -------- */

export type TenantBrandingFull = {
  id?: string;
  domain?: string;
  title?: string;
  name?: string;
  /** Alias for `name` — kept for backward compatibility with existing components. */
  organizationName?: string;
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
  /** Alias for `primaryFont` — kept for backward compatibility. */
  fontFamily?: string;
  tagline?: string;
  description?: string;
  homeUrl?: string;
  supportEmail?: string;
  supportUrl?: string;
  termsUrl?: string;
  privacyUrl?: string;
  docsUrl?: string;
  twitterHandle?: string;
  /** Alias for `twitterHandle` — kept for backward compatibility. */
  logoUrl?: string;
  faviconUrl?: string;
  assets?: BrandingAsset[];
  updatedAt?: string;
};

export type TenantBrandingUpdatePayload = Omit<TenantBrandingFull, 'id' | 'domain' | 'assets' | 'updatedAt'>;

export type TenantBranding = TenantBrandingFull;

export type BrandingAsset = {
  id: string;
  category: string;
  fileName: string;
  url: string;
  contentType: string;
  contentLength: number;
  checksum?: string;
  active?: boolean;
  createdAt?: string;
  updatedAt?: string;
};

/** GET /tenant/branding */
export async function getTenantBranding(): Promise<TenantBrandingFull> {
  const data = await api.get<R>('/tenant/branding');
  const d = (data ?? {}) as TenantBrandingFull;
  d.organizationName = d.organizationName ?? d.name;
  d.fontFamily = d.fontFamily ?? d.primaryFont;
  return d;
}

/** PUT /tenant/branding */
export async function updateTenantBranding(payload: TenantBrandingUpdatePayload): Promise<TenantBrandingFull> {
  return api.put<TenantBrandingFull>('/tenant/branding', payload);
}

/** DELETE /tenant/branding */
export async function deleteTenantBranding(): Promise<void> {
  await api.del('/tenant/branding');
}

/** PATCH /tenant/branding/activate */
export async function activateTenantBranding(): Promise<TenantBrandingFull> {
  return api.patch<TenantBrandingFull>('/tenant/branding/activate');
}

/** GET /tenant/branding/assets */
export async function getTenantBrandingAssets(): Promise<BrandingAsset[]> {
  const data = await api.get<unknown>('/tenant/branding/assets');
  return Array.isArray(data) ? (data as BrandingAsset[]) : [];
}

/** POST /tenant/branding/assets/{category} (multipart) */
export async function uploadBrandingAsset(category: string, file: File): Promise<BrandingAsset> {
  const fd = new FormData();
  fd.append('file', file);
  const res = await fetch(`/bff/gw/tenant/branding/assets/${encodeURIComponent(category)}`, {
    method: 'POST',
    body: fd,
    credentials: 'include',
  });
  if (!res.ok) {
    const body = await res.json().catch(() => null);
    throw new Error((body as R)?.message as string || `Upload failed (${res.status})`);
  }
  return res.json() as Promise<BrandingAsset>;
}

/** DELETE /tenant/branding/assets/{assetId} */
export async function deleteBrandingAsset(assetId: string): Promise<void> {
  await api.del(`/tenant/branding/assets/${encodeURIComponent(assetId)}`);
}

/* -------- Tenant User Lifecycle Actions (/tenant/admin/users/lifecycle) ----- */

/** PATCH /tenant/admin/users/lifecycle/{userId}/activate */
export const activateTenantUser = (userId: string) =>
  api.patch<unknown>(`/tenant/admin/users/lifecycle/${encodeURIComponent(userId)}/activate`);

/** PATCH /tenant/admin/users/lifecycle/{userId}/suspend */
export const suspendTenantUser = (userId: string) =>
  api.patch<unknown>(`/tenant/admin/users/lifecycle/${encodeURIComponent(userId)}/suspend`);

/** PATCH /tenant/admin/users/lifecycle/{userId}/unlock */
export const unlockTenantUser = (userId: string) =>
  api.patch<unknown>(`/tenant/admin/users/lifecycle/${encodeURIComponent(userId)}/unlock`);

/** POST /tenant/admin/users/lifecycle/{userId}/force-password-reset */
export const forcePasswordResetTenantUser = (userId: string) =>
  api.post<unknown>(`/tenant/admin/users/lifecycle/${encodeURIComponent(userId)}/force-password-reset`);

/** POST /tenant/admin/users/lifecycle/{userId}/reset-mfa */
export const resetMfaTenantUser = (userId: string) =>
  api.post<unknown>(`/tenant/admin/users/lifecycle/${encodeURIComponent(userId)}/reset-mfa`);

/** POST /tenant/admin/users/lifecycle/{userId}/revoke-sessions */
export const revokeSessionsTenantUser = (userId: string) =>
  api.post<unknown>(`/tenant/admin/users/lifecycle/${encodeURIComponent(userId)}/revoke-sessions`);

/** DELETE /tenant/admin/users/lifecycle/{userId} */
export const deleteTenantUser = (userId: string) =>
  api.del<unknown>(`/tenant/admin/users/lifecycle/${encodeURIComponent(userId)}`);

/* -------- Tenant Donations / Funds (/tenant/donations/funds) ---------------- */

export type DonationFund = {
  id?: string;
  tenantId?: string;
  name?: string;
  code?: string;
  fundType?: string;
  status?: string;
  description?: string;
  defaultForOnline?: boolean;
  createdAt?: string;
  updatedAt?: string;
  deleted?: boolean;
};

export type CreateDonationFundPayload = {
  name: string;
  code?: string;
  fundType?: string;
  status?: string;
  description?: string;
  defaultForOnline?: boolean;
};

/** GET /tenant/donations/funds */
export async function getDonationFunds(): Promise<DonationFund[]> {
  const data = await api.get<unknown>('/tenant/donations/funds');
  return Array.isArray(data) ? (data as DonationFund[]) : [];
}

/** POST /tenant/donations/funds */
export const createDonationFund = (payload: CreateDonationFundPayload) =>
  api.post<DonationFund>('/tenant/donations/funds', payload);

/** GET /tenant/donations/funds/{fundId} */
export const getDonationFund = (fundId: string) =>
  api.get<DonationFund>(`/tenant/donations/funds/${encodeURIComponent(fundId)}`);

/** PUT /tenant/donations/funds/{fundId} */
export const updateDonationFund = (fundId: string, payload: Partial<CreateDonationFundPayload>) =>
  api.put<DonationFund>(`/tenant/donations/funds/${encodeURIComponent(fundId)}`, payload);

/** PATCH /tenant/donations/funds/{fundId}/deactivate */
export const deactivateDonationFund = (fundId: string) =>
  api.patch<unknown>(`/tenant/donations/funds/${encodeURIComponent(fundId)}/deactivate`);

/* -------- Tenant Events Attendance (/tenant/events/attendance) -------------- */

export type EventAttendanceRecord = {
  id?: string;
  tenantId?: string;
  event?: {
    id?: string;
    name?: string;
    eventType?: string;
    startAt?: string;
    endAt?: string;
    location?: string;
    status?: string;
  };
  userProfileId?: string;
  status?: string;
  source?: string;
  checkInAt?: string;
  checkOutAt?: string;
  notes?: string;
  campus?: {
    id?: string;
    code?: string;
    name?: string;
    address?: string;
    active?: boolean;
  };
};

export type RecordAttendancePayload = {
  event?: { id: string };
  userProfileId?: string;
  status?: string;
  source?: string;
  checkInAt?: string;
  checkOutAt?: string;
  notes?: string;
  campus?: { id: string };
};

/** POST /tenant/events/attendance */
export const recordEventAttendance = (payload: RecordAttendancePayload) =>
  api.post<EventAttendanceRecord>('/tenant/events/attendance', payload);

/** GET /tenant/events/attendance/events/{eventId} */
export async function getEventAttendance(eventId: string): Promise<EventAttendanceRecord[]> {
  const data = await api.get<unknown>(`/tenant/events/attendance/events/${encodeURIComponent(eventId)}`);
  return Array.isArray(data) ? (data as EventAttendanceRecord[]) : [];
}

/* -------- Tenant Events Registrations (/tenant/events/registrations) -------- */

export type EventRegistration = {
  id?: string;
  tenantId?: string;
  event?: {
    id?: string;
    name?: string;
    eventType?: string;
    startAt?: string;
    endAt?: string;
    status?: string;
  };
  userProfileId?: string;
  fullName?: string;
  email?: string;
  phone?: string;
  status?: string;
  registeredAt?: string;
  checkedInAt?: string;
};

/** GET /tenant/events/registrations/events/{eventId} */
export async function getEventRegistrations(eventId: string): Promise<EventRegistration[]> {
  const data = await api.get<unknown>(`/tenant/events/registrations/events/${encodeURIComponent(eventId)}`);
  return Array.isArray(data) ? (data as EventRegistration[]) : [];
}

/** GET /tenant/events/registrations/{registrationId} */
export const getEventRegistration = (registrationId: string) =>
  api.get<EventRegistration>(`/tenant/events/registrations/${encodeURIComponent(registrationId)}`);

/** PATCH /tenant/events/registrations/{registrationId}/cancel */
export const cancelEventRegistration = (registrationId: string) =>
  api.patch<unknown>(`/tenant/events/registrations/${encodeURIComponent(registrationId)}/cancel`);

/* -------- Tenant Campuses (/tenant/admin/campuses) -------------------------- */

export type TenantCampus = {
  id?: string;
  code?: string;
  name?: string;
  address?: string;
  active?: boolean;
};

export type CampusPayload = {
  code: string;
  name: string;
  address?: string;
};

/** GET /tenant/admin/campuses */
export async function getTenantCampuses(): Promise<TenantCampus[]> {
  const data = await api.get<unknown>('/tenant/admin/campuses');
  return Array.isArray(data) ? (data as TenantCampus[]) : [];
}

/** POST /tenant/admin/campuses */
export const createTenantCampus = (payload: CampusPayload) =>
  api.post<TenantCampus>('/tenant/admin/campuses', payload);

/** PUT /tenant/admin/campuses/{campusId} */
export const updateTenantCampus = (campusId: string, payload: Partial<CampusPayload>) =>
  api.put<TenantCampus>(`/tenant/admin/campuses/${encodeURIComponent(campusId)}`, payload);

/** DELETE /tenant/admin/campuses/{campusId} */
export const deleteTenantCampus = (campusId: string) =>
  api.del<unknown>(`/tenant/admin/campuses/${encodeURIComponent(campusId)}`);

/* -------- Tenant Admin Security Posture (/tenant/admin/security/posture) ---- */

/** GET /tenant/admin/security/posture */
export const getTenantSecurityPosture = () =>
  api.get<Record<string, unknown>>('/tenant/admin/security/posture');

/* -------- Tenant Admin Organization Readiness (/tenant/admin/organization/readiness) */

/** GET /tenant/admin/organization/readiness */
export const getTenantOrganizationReadiness = () =>
  api.get<Record<string, unknown>>('/tenant/admin/organization/readiness');

/* -------- Shared Lookups (/shared/lookups) ---------------------------------- */

/** GET /shared/lookups */
export const getSharedLookups = () =>
  api.get<Record<string, unknown>>('/shared/lookups');

/** GET /shared/lookups/roles */
export const getSharedLookupRoles = () =>
  api.get<Record<string, unknown>>('/shared/lookups/roles');

/* -------- Tenant Notifications Messages (/tenant/notifications/messages) ---- */

export type NotificationMessage = {
  id?: string;
  tenantId?: string;
  channel?: string;
  ruleType?: string;
  subject?: string;
  body?: string;
  templateKey?: string;
  scheduledAt?: string;
  sentAt?: string;
  status?: string;
  systemInitiated?: boolean;
  notes?: string;
  recipients?: Array<{
    id?: string;
    recipientType?: string;
    channel?: string;
    targetEmail?: string;
    targetPhone?: string;
    deliveryStatus?: string;
    sentAt?: string;
    errorMessage?: string;
  }>;
};

/** GET /tenant/notifications/messages */
export async function getTenantNotificationMessages(): Promise<NotificationMessage[]> {
  const data = await api.get<unknown>('/tenant/notifications/messages');
  return Array.isArray(data) ? (data as NotificationMessage[]) : [];
}

/** GET /tenant/notifications/messages/{messageId} */
export const getTenantNotificationMessage = (messageId: string) =>
  api.get<NotificationMessage>(`/tenant/notifications/messages/${encodeURIComponent(messageId)}`);

/* -------- Tenant Site Templates (/tenant/site-templates) -------------------- */

export type SiteTemplateContent = {
  schemaVersion?: string;
  templateCode?: string;
  templateType?: string;
  designTokens?: Record<string, unknown>;
  applicationShell?: Record<string, unknown>;
  views?: Record<string, unknown>;
  responsiveRules?: Record<string, unknown>;
  metadata?: Record<string, unknown>;
};

export type SiteTemplate = {
  id?: string;
  name?: string;
  code?: string;
  templateType?: string;
  templateVersion?: string;
  schemaVersion?: string;
  defaultThemeMode?: string;
  status?: string;
  source?: string;
  description?: string;
  system?: boolean;
  defaultTemplate?: boolean;
  customized?: boolean;
  previewUrl?: string;
  checksum?: string;
  content?: SiteTemplateContent;
  publishedAt?: string;
  updatedAt?: string;
};

export type PublishTemplatePayload = {
  expectedChecksum?: string;
  releaseNote?: string;
  makeDefault?: boolean;
};

/** GET /tenant/site-templates */
export async function getTenantSiteTemplates(templateType?: string): Promise<SiteTemplate[]> {
  const path = templateType
    ? `/tenant/site-templates?templateType=${encodeURIComponent(templateType)}`
    : '/tenant/site-templates';
  const data = await api.get<unknown>(path);
  return Array.isArray(data) ? (data as SiteTemplate[]) : [];
}

/** GET /tenant/site-templates/resolved */
export const getResolvedSiteTemplate = (templateType?: string) => {
  const path = templateType
    ? `/tenant/site-templates/resolved?templateType=${encodeURIComponent(templateType)}`
    : '/tenant/site-templates/resolved';
  return api.get<SiteTemplate>(path);
};

/** GET /tenant/site-templates/{templateId}/content */
export const getSiteTemplateContent = (templateId: string) =>
  api.get<SiteTemplateContent>(`/tenant/site-templates/${encodeURIComponent(templateId)}/content`);

/** POST /tenant/site-templates/{templateId}/publish */
export const publishSiteTemplate = (templateId: string, payload: PublishTemplatePayload) =>
  api.post<SiteTemplate>(`/tenant/site-templates/${encodeURIComponent(templateId)}/publish`, payload);

/** DELETE /tenant/site-templates/{templateId} */
export const deleteSiteTemplate = (templateId: string) =>
  api.del<unknown>(`/tenant/site-templates/${encodeURIComponent(templateId)}`);

/* -------- Notification Campaigns (/tenant/admin/notifications/campaigns) ---- */

/** POST /tenant/admin/notifications/campaigns/{campaignId}/send */
export const sendCampaign = (campaignId: string) =>
  api.post<unknown>(`/tenant/admin/notifications/campaigns/${encodeURIComponent(campaignId)}/send`);

/** PATCH /tenant/admin/notifications/campaigns/{campaignId}/cancel */
export const cancelCampaign = (campaignId: string) =>
  api.patch<unknown>(`/tenant/admin/notifications/campaigns/${encodeURIComponent(campaignId)}/cancel`);

/* -------- Tenant Billing Subscription Lifecycle + Plans -------------------- */

export type SubscriptionLifecycle = {
  subscriptionId?: string;
  previousStatus?: string;
  currentStatus?: string;
  reason?: string;
  effectiveAt?: string;
};

export type SubscriptionPlan = {
  id?: string;
  code?: string;
  name?: string;
  description?: string;
  price?: number;
  currency?: string;
  billingCycle?: string;
  trialPeriodDays?: number;
  maxUsers?: number;
  maxCampuses?: number;
  active?: boolean;
  publicPlan?: boolean;
  createdAt?: string;
  updatedAt?: string;
};

/** GET /tenant/billing/subscription/lifecycle */
export const getTenantSubscriptionLifecycle = () =>
  api.get<SubscriptionLifecycle>('/tenant/billing/subscription/lifecycle');

/** GET /tenant/billing/subscription/plans */
export async function getTenantSubscriptionPlans(): Promise<SubscriptionPlan[]> {
  const data = await api.get<unknown>('/tenant/billing/subscription/plans');
  return Array.isArray(data) ? (data as SubscriptionPlan[]) : [];
}

/* -------- Tenant Billing Payments (/tenant/billing/payments) --------------- */

export type PaymentPayer = {
  userId?: string;
  userProfileId?: string;
  name?: string;
  email?: string;
};

export type PaymentBusinessReference = {
  type?: string;
  id?: string;
};

export type BillingPayment = {
  id?: string;
  tenantId?: string;
  paymentReference?: string;
  purpose?: string;
  source?: string;
  status?: string;
  amount?: number;
  currency?: string;
  payer?: PaymentPayer;
  businessReference?: PaymentBusinessReference;
  gatewayType?: string;
  gatewayReference?: string;
  providerSessionId?: string;
  paymentMethodId?: string;
  integrationType?: string;
  failureCode?: string;
  failureReason?: string;
  requestedAt?: string;
  processingAt?: string;
  authorizedAt?: string;
  paidAt?: string;
  failedAt?: string;
  canceledAt?: string;
  expiresAt?: string;
};

export type PagedResponse<T> = {
  totalElements?: number;
  totalPages?: number;
  first?: boolean;
  last?: boolean;
  numberOfElements?: number;
  size?: number;
  number?: number;
  empty?: boolean;
  content?: T[];
};

/** GET /tenant/billing/payments (paginated) */
export const getTenantBillingPayments = (page = 0, size = 20) =>
  api.get<PagedResponse<BillingPayment>>(`/tenant/billing/payments?page=${page}&size=${size}`);

/** GET /tenant/billing/payments/{paymentId} */
export const getTenantBillingPayment = (paymentId: string) =>
  api.get<BillingPayment>(`/tenant/billing/payments/${encodeURIComponent(paymentId)}`);

/** POST /tenant/billing/payments/{paymentReference}/token */
export const submitPaymentToken = (paymentReference: string, paymentToken: string) =>
  api.post<unknown>(`/tenant/billing/payments/${encodeURIComponent(paymentReference)}/token`, { paymentToken });

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

/* -------- Notification settings -------- */

export type TenantNotificationSettings = {
  subscriptionExpiryRemindersEnabled: boolean;
  subscriptionExpiryChannel: string;
  inactiveTenantRemindersEnabled: boolean;
  inactiveTenantChannel: string;
  daysBeforeExpiryPrimary: number | null;
  inactiveDaysThreshold: number | null;
};

export async function getTenantNotificationSettings(): Promise<TenantNotificationSettings | null> {
  try {
    const data = await api.get<R>('/tenant/notifications/settings');
    const d = ((data as R)?.['data'] ?? data) as R;
    return {
      subscriptionExpiryRemindersEnabled: Boolean(d['subscriptionExpiryRemindersEnabled']),
      subscriptionExpiryChannel: fieldOf(d, ['subscriptionExpiryChannel']) || 'EMAIL',
      inactiveTenantRemindersEnabled: Boolean(d['inactiveTenantRemindersEnabled']),
      inactiveTenantChannel: fieldOf(d, ['inactiveTenantChannel']) || 'EMAIL',
      daysBeforeExpiryPrimary: d['daysBeforeExpiryPrimary'] != null ? Number(d['daysBeforeExpiryPrimary']) : null,
      inactiveDaysThreshold: d['inactiveDaysThreshold'] != null ? Number(d['inactiveDaysThreshold']) : null,
    };
  } catch {
    return null;
  }
}

export async function updateTenantNotificationSettings(settings: TenantNotificationSettings): Promise<void> {
  await api.put('/tenant/notifications/settings', settings);
}

/* -------- Security settings -------- */

export type TenantSecuritySettings = {
  mfaRequired: boolean;
  captchaEnabled: boolean;
  adaptiveAuthenticationEnabled: boolean;
  rememberDeviceAllowed: boolean;
  lockAccountOnFailedAttempts: boolean;
  maxFailedLoginAttempts: number | null;
  sessionTimeoutMinutes: number | null;
  notifyAdminOnHighRiskLogin: boolean;
};

export async function getTenantSecuritySettings(): Promise<TenantSecuritySettings | null> {
  try {
    const data = await api.get<R>('/tenant/admin/security/settings');
    const d = ((data as R)?.['data'] ?? data) as R;
    return {
      mfaRequired:                    Boolean(d['mfaRequired']),
      captchaEnabled:                 Boolean(d['captchaEnabled']),
      adaptiveAuthenticationEnabled:  Boolean(d['adaptiveAuthenticationEnabled']),
      rememberDeviceAllowed:          Boolean(d['rememberDeviceAllowed']),
      lockAccountOnFailedAttempts:    Boolean(d['lockAccountOnFailedAttempts']),
      maxFailedLoginAttempts:         d['maxFailedLoginAttempts'] != null ? Number(d['maxFailedLoginAttempts']) : null,
      sessionTimeoutMinutes:          d['sessionTimeoutMinutes'] != null ? Number(d['sessionTimeoutMinutes']) : null,
      notifyAdminOnHighRiskLogin:     Boolean(d['notifyAdminOnHighRiskLogin']),
    };
  } catch {
    return null;
  }
}

export async function updateTenantSecuritySettings(settings: Partial<TenantSecuritySettings>): Promise<void> {
  await api.put('/tenant/admin/security/settings', settings);
}
