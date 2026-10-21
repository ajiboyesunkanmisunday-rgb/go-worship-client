/**
 * Unified, role-aware dashboard endpoint.
 * GET /api/v1/dashboard?family=PLATFORM&period=LAST_30_DAYS&granularity=DAY
 *
 * The response is section-based:
 *   { availableFamilies, selectedFamily, sections: [{type, metrics: [{code, value, formattedValue}], series}] }
 */

import { api } from './client';

type R = Record<string, unknown>;

function num(v: unknown): number {
  if (typeof v === 'number') return v;
  if (typeof v === 'string' && v) return Number(v) || 0;
  return 0;
}

function str(v: unknown, fallback = ''): string {
  if (typeof v === 'string' && v) return v;
  if (typeof v === 'number') return String(v);
  return fallback;
}

function fieldOf(obj: R, keys: string[]): unknown {
  for (const k of keys) if (obj[k] !== undefined) return obj[k];
  return '';
}

/** Extract a metric value from a sections-based dashboard response. */
function sectionMetric(sections: R[], sectionType: string, code: string): number {
  for (const sec of sections) {
    if ((sec['type'] as string) !== sectionType) continue;
    const metrics = Array.isArray(sec['metrics']) ? (sec['metrics'] as R[]) : [];
    for (const m of metrics) {
      if ((m['code'] as string) === code) return num(m['value']);
    }
  }
  return 0;
}

/** Extract series points from a section (for trend charts). */
function sectionSeries(sections: R[], sectionType: string): { label: string; value: number }[] {
  for (const sec of sections) {
    if ((sec['type'] as string) !== sectionType) continue;
    const seriesArr = Array.isArray(sec['series']) ? (sec['series'] as R[]) : [];
    for (const s of seriesArr) {
      const points = Array.isArray(s['points']) ? (s['points'] as R[]) : [];
      if (points.length > 0) {
        return points.map((pt) => {
          const ts = str(pt['timestamp'] ?? pt['date'] ?? pt['label'], '');
          const label = ts
            ? new Date(ts).toLocaleDateString('en-US', { month: 'short' })
            : str(pt['label'], '');
          return { label, value: num(pt['value']) };
        });
      }
    }
  }
  return [];
}

export type UnifiedDashboardStats = {
  /* tenant/ministry — TENANT_OPERATIONS family */
  totalGiving: string;
  totalMembers: number;
  totalGroups: number;
  totalEvents: number;
  upcomingEvents: number;
  newMembers?: number;
  publishedSermons?: number;
  attendanceRecords?: number;
  /* engagement — ENGAGEMENT family */
  totalRegistrations?: number;
  checkedIn?: number;
  uniqueAttendees?: number;
  /* platform overview — PLATFORM family */
  totalTenants: number;
  activeTenants: number;
  newTenants?: number;
  totalCampuses?: number;
  totalUsers: number;
  activeUsers?: number;
  newUsers?: number;
  activeSessions?: number;
  riskySessions?: number;
  /* security */
  successfulAuths?: number;
  failedAuths?: number;
  lockedAccounts?: number;
  mfaEnabledUsers?: number;
  auditFailures?: number;
  /* chart series: {label, value} */
  trend: { label: string; value: number }[];
  /* available families for tab navigation */
  availableFamilies: string[];
  /* admin name from context */
  adminDisplayName?: string;
};

export async function getUnifiedDashboard(
  period = 'LAST_30_DAYS',
  currency = 'USD',
  family?: string
): Promise<UnifiedDashboardStats | null> {
  try {
    const qs = new URLSearchParams({ period, granularity: 'DAY', currency });
    if (family) qs.set('family', family);
    const data = await api.get<R>(`/dashboard?${qs.toString()}`);
    if (!data || typeof data !== 'object') return null;

    const sections = Array.isArray((data as R)['sections'])
      ? ((data as R)['sections'] as R[])
      : [];

    const isSectionBased = sections.length > 0;

    /* ---------- flat-key fallback (older ministry/tenant dashboard) ---------- */
    const d = isSectionBased ? data as R : (((data as R)['data'] ?? data) as R);

    let totalGiving = '$0';
    if (!isSectionBased) {
      const rawGiving = fieldOf(d, [
        'totalGiving', 'givingVolume', 'totalRevenue', 'volume',
        'totalDonations', 'donationTotal',
      ]);
      const givingNum = typeof rawGiving === 'number' ? rawGiving : num(rawGiving);
      totalGiving =
        typeof rawGiving === 'string' && isNaN(Number(rawGiving))
          ? rawGiving
          : givingNum > 0
          ? new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(givingNum)
          : '$0';
    }

    /* ---------- section-based extraction ---------- */
    let totalTenants   = 0, activeTenants  = 0, newTenants    = 0, totalCampuses = 0;
    let totalUsers     = 0, activeUsers    = 0, newUsers      = 0;
    let activeSessions = 0, riskySessions  = 0;
    let successfulAuths = 0, failedAuths   = 0, lockedAccounts = 0;
    let mfaEnabledUsers = 0, auditFailures = 0;
    let trend: { label: string; value: number }[] = [];
    let adminDisplayName: string | undefined;

    const availableFamilies = Array.isArray((data as R)['availableFamilies'])
      ? ((data as R)['availableFamilies'] as string[])
      : [];

    const context = (data as R)['context'] as R | undefined;
    if (context?.['userDisplayName']) {
      adminDisplayName = str(context['userDisplayName']);
    }

    /* Additional section-extracted fields */
    let newMembers = 0, publishedSermons = 0, attendanceRecords = 0;
    let totalRegistrations = 0, checkedIn = 0, uniqueAttendees = 0;
    /* tenant-level event/member totals (from TENANT_OPERATIONS or ENGAGEMENT family) */
    let tenantTotalEvents = 0, tenantUpcomingEvents = 0, tenantTotalMembers = 0;

    if (isSectionBased) {
      // PLATFORM family sections
      totalTenants    = sectionMetric(sections, 'PLATFORM_OVERVIEW', 'TOTAL_TENANTS');
      activeTenants   = sectionMetric(sections, 'PLATFORM_OVERVIEW', 'ACTIVE_TENANTS');
      newTenants      = sectionMetric(sections, 'PLATFORM_OVERVIEW', 'NEW_TENANTS');
      totalCampuses   = sectionMetric(sections, 'PLATFORM_OVERVIEW', 'TOTAL_CAMPUSES');
      activeUsers     = sectionMetric(sections, 'PLATFORM_OVERVIEW', 'ACTIVE_USERS');
      newUsers        = sectionMetric(sections, 'PLATFORM_OVERVIEW', 'NEW_USERS');
      activeSessions  = sectionMetric(sections, 'PLATFORM_OVERVIEW', 'ACTIVE_SESSIONS');
      riskySessions   = sectionMetric(sections, 'PLATFORM_OVERVIEW', 'RISKY_SESSIONS');

      // SECURITY section (present in PLATFORM and SECURITY families)
      successfulAuths = sectionMetric(sections, 'SECURITY', 'SUCCESSFUL_AUTHENTICATIONS')
        || sectionMetric(sections, 'ACCOUNT_SECURITY', 'SUCCESSFUL_AUTHENTICATIONS');
      failedAuths     = sectionMetric(sections, 'SECURITY', 'FAILED_AUTHENTICATIONS')
        || sectionMetric(sections, 'ACCOUNT_SECURITY', 'FAILED_AUTHENTICATIONS');
      lockedAccounts  = sectionMetric(sections, 'SECURITY', 'LOCKED_ACCOUNTS')
        || sectionMetric(sections, 'ACCOUNT_SECURITY', 'LOCKED_ACCOUNTS');
      mfaEnabledUsers = sectionMetric(sections, 'SECURITY', 'MFA_ENABLED_USERS')
        || sectionMetric(sections, 'ACCOUNT_SECURITY', 'MFA_ENABLED_USERS');
      auditFailures   = sectionMetric(sections, 'SECURITY', 'AUDIT_FAILURES')
        || sectionMetric(sections, 'ACCOUNT_SECURITY', 'AUDIT_FAILURES');

      totalUsers = totalTenants > 0
        ? sectionMetric(sections, 'TENANTS', 'ACTIVE_USERS') || activeUsers
        : activeUsers;

      // TENANT_OPERATIONS family: OVERVIEW section
      const ovActiveUsers  = sectionMetric(sections, 'OVERVIEW', 'ACTIVE_USERS');
      const ovNewUsers     = sectionMetric(sections, 'OVERVIEW', 'NEW_USERS');
      const ovUpcoming     = sectionMetric(sections, 'OVERVIEW', 'UPCOMING_EVENTS');
      const ovAttendance   = sectionMetric(sections, 'OVERVIEW', 'ATTENDANCE_RECORDS');
      const ovSermons      = sectionMetric(sections, 'OVERVIEW', 'PUBLISHED_SERMONS');
      if (ovActiveUsers)  tenantTotalMembers = ovActiveUsers;
      if (ovNewUsers)     newMembers = ovNewUsers;
      if (ovUpcoming)     tenantUpcomingEvents = ovUpcoming;
      if (ovAttendance)   attendanceRecords = ovAttendance;
      if (ovSermons)      publishedSermons = ovSermons;

      // ENGAGEMENT family: EVENTS section
      const engEvents     = sectionMetric(sections, 'EVENTS', 'EVENTS_IN_PERIOD');
      const engUpcoming   = sectionMetric(sections, 'EVENTS', 'UPCOMING_EVENTS');
      const engAttendance = sectionMetric(sections, 'EVENTS', 'ATTENDANCE_RECORDS')
        || sectionMetric(sections, 'ATTENDANCE', 'ATTENDANCE_RECORDS');
      if (engEvents)    tenantTotalEvents = engEvents;
      if (engUpcoming)  tenantUpcomingEvents = tenantUpcomingEvents || engUpcoming;
      if (engAttendance) attendanceRecords = attendanceRecords || engAttendance;
      totalRegistrations = sectionMetric(sections, 'EVENTS', 'REGISTRATIONS')
        || sectionMetric(sections, 'EVENT_REGISTRATIONS', 'REGISTRATIONS');
      checkedIn       = sectionMetric(sections, 'EVENTS', 'CHECKED_IN')
        || sectionMetric(sections, 'ATTENDANCE', 'CHECKED_IN');
      uniqueAttendees = sectionMetric(sections, 'EVENTS', 'UNIQUE_ATTENDEES')
        || sectionMetric(sections, 'ATTENDANCE', 'UNIQUE_ATTENDEES');

      // CONTENT family: CONTENT / SERMONS sections
      const contentSermons = sectionMetric(sections, 'CONTENT', 'PUBLISHED_SERMONS')
        || sectionMetric(sections, 'SERMONS', 'PUBLISHED_SERMONS');
      if (contentSermons) publishedSermons = contentSermons;

      const trendSeries = sectionSeries(sections, 'TENANT_GROWTH');
      trend = trendSeries.length ? trendSeries : sectionSeries(sections, 'EVENTS');
    } else {
      totalTenants  = num(fieldOf(d, ['totalTenants', 'tenantCount', 'tenants']));
      activeTenants = num(fieldOf(d, ['activeTenants', 'activeCount']));
      totalUsers    = num(fieldOf(d, ['totalUsers', 'userCount', 'users']));
      const rawTrend = d['trend'] ?? d['chartData'] ?? d['series'] ?? d['data'];
      trend = Array.isArray(rawTrend)
        ? rawTrend.slice(0, 12).map((pt: unknown) => {
            const p = (pt ?? {}) as R;
            return {
              label: str(p['month'] ?? p['date'] ?? p['label'] ?? p['period'], ''),
              value: num(p['value'] ?? p['amount'] ?? p['total'] ?? p['count']),
            };
          })
        : [];
    }

    const flatTotalMembers = num(fieldOf(d, ['totalMembers', 'memberCount', 'members', 'totalCustomers']));
    const flatTotalGroups  = num(fieldOf(d, ['totalGroups', 'groupCount', 'groups']));
    const flatTotalEvents  = num(fieldOf(d, ['totalEvents', 'eventCount', 'events']));
    const flatUpcoming     = num(fieldOf(d, ['upcomingEvents', 'upcoming']));

    return {
      totalGiving,
      totalMembers:   tenantTotalMembers || flatTotalMembers,
      totalGroups:    flatTotalGroups,
      totalEvents:    tenantTotalEvents || flatTotalEvents,
      upcomingEvents: tenantUpcomingEvents || flatUpcoming,
      newMembers:     newMembers || undefined,
      publishedSermons: publishedSermons || undefined,
      attendanceRecords: attendanceRecords || undefined,
      totalRegistrations: totalRegistrations || undefined,
      checkedIn:      checkedIn || undefined,
      uniqueAttendees: uniqueAttendees || undefined,
      totalTenants, activeTenants, newTenants, totalCampuses,
      totalUsers, activeUsers, newUsers,
      activeSessions, riskySessions,
      successfulAuths, failedAuths, lockedAccounts, mfaEnabledUsers, auditFailures,
      trend, availableFamilies, adminDisplayName,
    };
  } catch {
    return null;
  }
}
