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
 *   TN-006  POST /tenant/admin/users/provision          — staff/admin provisioning
 *   TN-007  POST /tenant/admin/users/customers/provision — ADMIN provisions a member (INDIRECT; requires TENANT_ADMIN Bearer)
 *   CU-001  POST /public/customers/register           — member SELF-registers (DIRECT; public, no Bearer needed)
 *
 * CONTENT endpoints follow the /tenant/admin/* + /self/* naming pattern.
 * Paths marked [VERIFY PATH] need to be confirmed from the full Swagger once
 * access is available (see docs/backend-issues.md).
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

/** [VERIFY PATH] GET /tenant/admin/events */
export async function getTenantEvents(): Promise<TenantEvent[]> {
  const data = await api.get<unknown>('/tenant/admin/events');
  return findTableRows(data, 'event').map(mapEvent).filter((e) => e.name);
}

/** [VERIFY PATH] GET /tenant/admin/events/{id} */
export async function getTenantEvent(id: string): Promise<TenantEvent | null> {
  try {
    const data = await api.get<unknown>(`/tenant/admin/events/${id}`);
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

/** [VERIFY PATH] GET /tenant/admin/users/customers */
export async function getTenantMembers(): Promise<TenantMember[]> {
  const data = await api.get<unknown>('/tenant/admin/users/customers');
  return findTableRows(data, 'customer', 'member', 'user').map(mapMember).filter((m) => m.name || m.email);
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
  };
}

/** [VERIFY PATH] GET /tenant/admin/groups */
export async function getTenantGroups(): Promise<TenantGroup[]> {
  const data = await api.get<unknown>('/tenant/admin/groups');
  return findTableRows(data, 'group').map(mapGroup).filter((g) => g.name);
}

/* -------- Tenant Admin Dashboard Stats -------- */

export type TenantStats = {
  totalMembers: number;
  activeMembers: number;
  totalEvents: number;
  upcomingEvents: number;
  totalGroups: number;
  totalGiving: string;
};

export async function getTenantStats(): Promise<TenantStats | null> {
  try {
    const data = await api.get<R>('/tenant/admin/dashboard');
    if (!data || typeof data !== 'object') return null;
    const inner = ((data as R)['data'] ?? data) as R;
    return {
      totalMembers:   Number(fieldOf(inner, ['totalMembers', 'memberCount', 'members'])) || 0,
      activeMembers:  Number(fieldOf(inner, ['activeMembers', 'activeCount'])) || 0,
      totalEvents:    Number(fieldOf(inner, ['totalEvents', 'eventCount', 'events'])) || 0,
      upcomingEvents: Number(fieldOf(inner, ['upcomingEvents', 'upcoming'])) || 0,
      totalGroups:    Number(fieldOf(inner, ['totalGroups', 'groupCount', 'groups'])) || 0,
      totalGiving:    fieldOf(inner, ['totalGiving', 'givingVolume', 'totalRevenue', 'volume']),
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

/** TN-006  POST /tenant/admin/users/provision */
export const provisionTenantUser = (payload: ProvisionTenantUserPayload) =>
  api.post<unknown>('/tenant/admin/users/provision', payload);

/* -------- Member self-service content -------- */

/** [VERIFY PATH] GET /self/events — member's registered/upcoming events */
export async function getSelfEvents(): Promise<TenantEvent[]> {
  const data = await api.get<unknown>('/self/events');
  return findTableRows(data, 'event').map(mapEvent).filter((e) => e.name);
}

/** [VERIFY PATH] GET /self/groups — groups the member belongs to */
export async function getSelfGroups(): Promise<TenantGroup[]> {
  const data = await api.get<unknown>('/self/groups');
  return findTableRows(data, 'group').map(mapGroup).filter((g) => g.name);
}
