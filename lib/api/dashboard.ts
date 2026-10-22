/**
 * Role-aware dashboard helpers.
 *
 * Backend endpoints (no unified /dashboard exists):
 *   GET /api/v1/system/dashboard/super-admin  → SystemRoleDashboardResponse (system portal)
 *   GET /api/v1/tenant/dashboard/admin        → SystemRoleDashboardResponse (tenant/ministry portal)
 *
 * Response shape: { ok, dashboardType, sections: [{key, title, cards: [{key, title, value, unit}], charts: [...]}] }
 * card keys are camelCase (e.g. "totalTenants", "donationTotal", "customers").
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

export type DashboardSection = {
  type: string;
  title: string;
  metrics: Array<{ code: string; label: string; value: number; formattedValue: string }>;
  series: Array<{ points: Array<{ timestamp?: string; label?: string; value: number }> }>;
};

export type UnifiedDashboardStats = {
  /* raw sections from the API — used by system dashboard to render dynamically */
  rawSections: DashboardSection[];
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
  _period = 'LAST_30_DAYS',
  currency = 'USD',
  _family?: string,
  portal: 'system' | 'tenant' = 'tenant'
): Promise<UnifiedDashboardStats | null> {
  try {
    const primaryPath = portal === 'system'
      ? '/system/dashboard/super-admin'
      : '/tenant/dashboard/admin';

    let data: R;
    try {
      data = await api.get<R>(primaryPath);
    } catch (firstErr) {
      // super-admin endpoint not yet deployed on this backend (404) — fall back to admin
      if (portal === 'system') {
        data = await api.get<R>('/system/dashboard/admin');
      } else {
        throw firstErr;
      }
    }
    if (!data || typeof data !== 'object') return null;
    if ((data as R)['ok'] === false) return null;

    /* Parse SystemRoleDashboardResponse — sections[].cards[] (camelCase keys) */
    const backendSections = Array.isArray((data as R)['sections'])
      ? ((data as R)['sections'] as R[])
      : [];

    /* Flatten all cards into a lookup map for easy field extraction */
    const cardMap = new Map<string, R>();
    for (const sec of backendSections) {
      for (const card of (Array.isArray(sec['cards']) ? sec['cards'] as R[] : [])) {
        cardMap.set(String(card['key'] ?? ''), card);
      }
    }

    const cardNum = (...keys: string[]): number => {
      for (const k of keys) {
        const c = cardMap.get(k);
        if (c !== undefined) return num(c['value']);
      }
      return 0;
    };

    const cardStr = (...keys: string[]): string => {
      for (const k of keys) {
        const c = cardMap.get(k);
        if (c !== undefined) {
          const v = c['value'];
          return typeof v === 'string' ? v : String(num(v));
        }
      }
      return '';
    };

    /* Extract giving — backend stores as formatted currency string or raw number */
    let totalGiving = '$0';
    const rawGiving = cardMap.get('donationTotal')?.['value'] ?? cardMap.get('totalRevenue')?.['value'] ?? cardMap.get('mrr')?.['value'];
    if (rawGiving !== undefined) {
      if (typeof rawGiving === 'string' && rawGiving.startsWith('$')) {
        totalGiving = rawGiving;
      } else {
        const n = num(rawGiving);
        totalGiving = n > 0
          ? new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(n)
          : '$0';
      }
    }

    /* Map backend sections → DashboardSection[] (cards[] → metrics[]) */
    const rawSections: DashboardSection[] = backendSections.map((sec) => ({
      type: String(sec['key'] ?? ''),
      title: String(sec['title'] ?? sec['key'] ?? ''),
      metrics: (Array.isArray(sec['cards']) ? sec['cards'] as R[] : []).map((card) => {
        const v = card['value'];
        const n = num(v);
        const unit = str(card['unit'] as unknown);
        const formatted = unit === 'currency'
          ? (typeof v === 'string' && v.startsWith('$') ? v : new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(n))
          : unit === 'percent'
          ? `${n}%`
          : String(v ?? n);
        return {
          code: String(card['key'] ?? ''),
          label: String(card['title'] ?? card['key'] ?? ''),
          value: n,
          formattedValue: formatted,
        };
      }),
      series: (Array.isArray(sec['charts']) ? sec['charts'] as R[] : []).map((chart) => ({
        points: (Array.isArray(chart['data']) ? chart['data'] as R[] : []).map((pt) => {
          const ptR = pt as R;
          return {
            timestamp: str(ptR['x'] as unknown ?? ptR['date'] as unknown ?? ptR['timestamp'] as unknown),
            label: str(ptR['label'] as unknown ?? ptR['x'] as unknown),
            value: num(ptR['y'] ?? ptR['value']),
          };
        }),
      })),
    }));

    /* Build trend from any chart named 'tenantGrowth90Days' or revenue trend */
    let trend: { label: string; value: number }[] = [];
    for (const sec of backendSections) {
      for (const chart of (Array.isArray(sec['charts']) ? sec['charts'] as R[] : [])) {
        const key = String(chart['key'] ?? '');
        if (key === 'tenantGrowth90Days' || key === 'monthlyRevenueTrend' || key === 'tenantGrowth') {
          const pts = Array.isArray(chart['data']) ? chart['data'] as R[] : [];
          trend = pts.slice(0, 12).map((pt) => {
            const ptR = pt as R;
            const ts = str(ptR['x'] as unknown ?? ptR['date'] as unknown ?? ptR['label'] as unknown);
            const label = ts
              ? (ts.includes('-') ? new Date(ts).toLocaleDateString('en-US', { month: 'short' }) : ts)
              : str(ptR['label'] as unknown);
            return { label, value: num(ptR['y'] ?? ptR['value']) };
          });
          if (trend.length) break;
        }
      }
      if (trend.length) break;
    }

    /* Available families = section keys */
    const availableFamilies = rawSections.map((s) => s.type).filter(Boolean);

    return {
      rawSections,
      totalGiving,
      /* tenant metrics */
      totalMembers:   cardNum('customers', 'tenantUsers'),
      totalGroups:    0,
      totalEvents:    cardNum('events'),
      upcomingEvents: 0,
      newMembers:     cardNum('mfaEnabledUsers') ? undefined : undefined,
      publishedSermons: cardNum('sermons') || undefined,
      attendanceRecords: cardNum('attendanceRecords') || undefined,
      totalRegistrations: cardNum('registrations') || undefined,
      checkedIn:      undefined,
      uniqueAttendees: undefined,
      /* system metrics */
      totalTenants:   cardNum('totalTenants'),
      activeTenants:  cardNum('activeTenants'),
      newTenants:     cardNum('newTenants30Days') || undefined,
      totalCampuses:  undefined,
      totalUsers:     cardNum('systemUsers', 'tenantUsers'),
      activeUsers:    cardNum('activeTenants') || undefined,
      newUsers:       cardNum('newTenants30Days') || undefined,
      activeSessions: undefined,
      riskySessions:  cardNum('riskyLogins') || undefined,
      /* security */
      successfulAuths: undefined,
      failedAuths:    cardNum('failedLogins30Days') || undefined,
      lockedAccounts: cardNum('lockedAccounts') || undefined,
      mfaEnabledUsers: cardNum('mfaEnabledUsers') || undefined,
      auditFailures:  cardNum('sensitiveActions30Days') || undefined,
      trend, availableFamilies,
      adminDisplayName: cardStr('tenantId') ? undefined : undefined,
    };
  } catch {
    return null;
  }
}
