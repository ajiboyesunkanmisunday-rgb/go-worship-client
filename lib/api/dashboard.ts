/**
 * Unified dashboard helpers.
 *
 * Live backend endpoint (confirmed from production HAR):
 *   GET /api/v1/dashboard?family=PLATFORM   (system & tenant — backend infers scope from JWT)
 *
 * Response shape:
 *   { context: { userDisplayName }, availableFamilies: string[],
 *     sections: [{ type, title, description, metrics: [{ code, label, value, formattedValue, unit }], series: [...] }] }
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

export type DashboardSection = {
  type: string;
  title: string;
  metrics: Array<{ code: string; label: string; value: number; formattedValue: string }>;
  series: Array<{ points: Array<{ timestamp?: string; label?: string; value: number }> }>;
};

export type UnifiedDashboardStats = {
  rawSections: DashboardSection[];
  totalGiving: string;
  totalMembers: number;
  totalGroups: number;
  totalEvents: number;
  upcomingEvents: number;
  newMembers?: number;
  publishedSermons?: number;
  attendanceRecords?: number;
  totalRegistrations?: number;
  checkedIn?: number;
  uniqueAttendees?: number;
  totalTenants: number;
  activeTenants: number;
  newTenants?: number;
  totalCampuses?: number;
  totalUsers: number;
  activeUsers?: number;
  newUsers?: number;
  activeSessions?: number;
  riskySessions?: number;
  successfulAuths?: number;
  failedAuths?: number;
  lockedAccounts?: number;
  mfaEnabledUsers?: number;
  auditFailures?: number;
  trend: { label: string; value: number }[];
  availableFamilies: string[];
  adminDisplayName?: string;
};

export async function getUnifiedDashboard(
  _period = 'LAST_30_DAYS',
  currency = 'USD',
  family?: string,
  portal: 'system' | 'tenant' = 'tenant'
): Promise<UnifiedDashboardStats | null> {
  try {
    // Confirmed from backend JAR: single DashboardController at /api/v1/dashboard.
    // Family param drives scope for all portals (system-owner, tenant, campus, customer, guest).
    // System: family=PLATFORM (confirmed live HAR). Tenant: family=TENANT_OPERATIONS.
    const effectiveFamily = family ?? (portal === 'system' ? 'PLATFORM' : 'TENANT_OPERATIONS');
    const path = `/dashboard?family=${encodeURIComponent(effectiveFamily)}`;
    let data: R;
    try {
      data = await api.get<R>(path);
    } catch (err) {
      if (portal === 'system') {
        return null;
      }
      throw err;
    }
    if (!data || typeof data !== 'object') return null;

    /* Context — admin display name */
    const context = (data['context'] as R) ?? {};
    const adminDisplayName = str(context['userDisplayName']) || undefined;

    /* Available families */
    const availableFamiliesRaw = Array.isArray(data['availableFamilies'])
      ? (data['availableFamilies'] as string[])
      : [];

    /* Sections */
    const backendSections = Array.isArray(data['sections'])
      ? (data['sections'] as R[])
      : [];

    /* Flat metric lookup (SCREAMING_SNAKE_CASE codes) */
    const metricMap = new Map<string, R>();
    for (const sec of backendSections) {
      for (const m of (Array.isArray(sec['metrics']) ? (sec['metrics'] as R[]) : [])) {
        metricMap.set(String(m['code'] ?? ''), m);
      }
    }

    const metricNum = (...codes: string[]): number => {
      for (const c of codes) {
        const m = metricMap.get(c);
        if (m !== undefined) return num(m['value']);
      }
      return 0;
    };

    /* Map to DashboardSection[] */
    const rawSections: DashboardSection[] = backendSections
      .map((sec) => ({
        type: String(sec['type'] ?? sec['key'] ?? ''),
        title: String(sec['title'] ?? sec['key'] ?? ''),
        metrics: (Array.isArray(sec['metrics']) ? (sec['metrics'] as R[]) : []).map((m) => {
          const v = m['value'];
          const n = num(v);
          const unit = str(m['unit'] as unknown);
          const formatted =
            str(m['formattedValue'] as unknown) ||
            (unit === 'PERCENTAGE'
              ? `${n}%`
              : unit === 'CURRENCY'
                ? new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(n)
                : String(v ?? n));
          return {
            code: String(m['code'] ?? ''),
            label: String(m['label'] ?? m['code'] ?? ''),
            value: n,
            formattedValue: formatted,
          };
        }),
        series: (Array.isArray(sec['series']) ? (sec['series'] as R[]) : []).map((s) => ({
          points: (Array.isArray((s as R)['points']) ? ((s as R)['points'] as R[]) : []).map(
            (pt) => ({
              timestamp: str(pt['timestamp'] ?? pt['date'] ?? pt['label'], '') || undefined,
              label: str(pt['label'] ?? pt['timestamp'], '') || undefined,
              value: num(pt['value']),
            })
          ),
        })),
      }))
      .filter((s) => s.metrics.length > 0 || s.series.some((sr) => sr.points.length > 0));

    const availableFamilies =
      availableFamiliesRaw.length > 0
        ? availableFamiliesRaw
        : rawSections.map((s) => s.type).filter(Boolean);

    /* Trend from any series with points */
    let trend: { label: string; value: number }[] = [];
    outer: for (const sec of backendSections) {
      for (const series of Array.isArray(sec['series']) ? (sec['series'] as R[]) : []) {
        const points = Array.isArray((series as R)['points'])
          ? ((series as R)['points'] as R[])
          : [];
        if (points.length > 0) {
          trend = points.slice(0, 12).map((pt) => {
            const ts = str(pt['timestamp'] ?? pt['date'] ?? pt['label'], '');
            const label = ts
              ? ts.includes('-')
                ? new Date(ts).toLocaleDateString('en-US', { month: 'short' })
                : ts
              : str(pt['label'] as unknown);
            return { label, value: num(pt['value']) };
          });
          if (trend.length) break outer;
        }
      }
    }

    /* Giving total */
    let totalGiving = '$0';
    const rawGiving =
      metricMap.get('TOTAL_GIVING')?.['value'] ??
      metricMap.get('DONATION_TOTAL')?.['value'] ??
      metricMap.get('RECEIVED_DONATIONS')?.['value'];
    if (rawGiving !== undefined) {
      const n = num(rawGiving);
      totalGiving =
        n > 0
          ? new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(n)
          : '$0';
    }

    return {
      rawSections,
      totalGiving,
      totalMembers: metricNum('ACTIVE_USERS', 'TOTAL_USERS'),
      totalGroups: 0,
      totalEvents: metricNum('EVENTS_IN_PERIOD', 'EVENTS'),
      upcomingEvents: metricNum('UPCOMING_EVENTS'),
      newMembers: metricNum('NEW_USERS') || undefined,
      publishedSermons: metricNum('PUBLISHED_SERMONS') || undefined,
      attendanceRecords: metricNum('ATTENDANCE_RECORDS') || undefined,
      totalRegistrations: metricNum('REGISTRATIONS') || undefined,
      checkedIn: metricNum('CHECKED_IN') || undefined,
      uniqueAttendees: metricNum('UNIQUE_ATTENDEES') || undefined,
      totalTenants: metricNum('TOTAL_TENANTS'),
      activeTenants: metricNum('ACTIVE_TENANTS'),
      newTenants: metricNum('NEW_TENANTS') || undefined,
      totalCampuses: metricNum('TOTAL_CAMPUSES') || undefined,
      totalUsers: metricNum('ACTIVE_USERS', 'NEW_USERS'),
      activeUsers: metricNum('ACTIVE_USERS') || undefined,
      newUsers: metricNum('NEW_USERS') || undefined,
      activeSessions: metricNum('ACTIVE_SESSIONS') || undefined,
      riskySessions: metricNum('RISKY_SESSIONS') || undefined,
      successfulAuths: metricNum('SUCCESSFUL_AUTHENTICATIONS') || undefined,
      failedAuths: metricNum('FAILED_AUTHENTICATIONS') || undefined,
      lockedAccounts: metricNum('LOCKED_ACCOUNTS') || undefined,
      mfaEnabledUsers: metricNum('MFA_ENABLED_USERS') || undefined,
      auditFailures: metricNum('AUDIT_FAILURES') || undefined,
      trend,
      availableFamilies,
      adminDisplayName,
    };
  } catch {
    return null;
  }
}
