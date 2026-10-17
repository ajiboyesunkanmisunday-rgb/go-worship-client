/**
 * Unified, role-aware dashboard endpoint.
 * Authorized by go-worship-auth-endpoints.md:
 *   GET /api/v1/dashboard?period=LAST_30_DAYS&granularity=DAY&currency=USD
 * Returns different shapes per role:
 *   SUPER_SYSTEM_ADMIN → platform view
 *   TENANT_ADMIN       → tenant view
 *   CUSTOMER           → self view
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

export type UnifiedDashboardStats = {
  /* tenant/ministry */
  totalGiving: string;
  totalMembers: number;
  totalGroups: number;
  totalEvents: number;
  upcomingEvents: number;
  /* system-owner (zero when not present) */
  totalTenants: number;
  activeTenants: number;
  totalUsers: number;
  /* chart series: {label, value} */
  trend: { label: string; value: number }[];
};

export async function getUnifiedDashboard(
  period = 'LAST_30_DAYS',
  currency = 'USD'
): Promise<UnifiedDashboardStats | null> {
  try {
    const data = await api.get<R>(
      `/dashboard?period=${period}&granularity=DAY&currency=${currency}`
    );
    if (!data || typeof data !== 'object') return null;
    const d = ((data as R)['data'] ?? data) as R;

    // Giving can be a number (raw) or string (pre-formatted)
    const rawGiving = fieldOf(d, [
      'totalGiving', 'givingVolume', 'totalRevenue', 'volume',
      'totalDonations', 'donationTotal',
    ]);
    const givingNum = typeof rawGiving === 'number' ? rawGiving : num(rawGiving);
    const givingStr =
      typeof rawGiving === 'string' && isNaN(Number(rawGiving))
        ? rawGiving // pre-formatted like "$2.5M"
        : givingNum > 0
        ? new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(givingNum)
        : str(rawGiving, '$0');

    // Chart trend: look for an array under several possible keys
    const rawTrend = d['trend'] ?? d['chartData'] ?? d['series'] ?? d['data'];
    const trend: { label: string; value: number }[] = Array.isArray(rawTrend)
      ? rawTrend.slice(0, 12).map((pt: unknown) => {
          const p = (pt ?? {}) as R;
          const label = str(p['month'] ?? p['date'] ?? p['label'] ?? p['period'], '');
          const value = num(p['value'] ?? p['amount'] ?? p['total'] ?? p['count']);
          return { label, value };
        })
      : [];

    return {
      totalGiving:    givingStr,
      totalMembers:   num(fieldOf(d, ['totalMembers', 'memberCount', 'members', 'totalCustomers'])),
      totalGroups:    num(fieldOf(d, ['totalGroups', 'groupCount', 'groups'])),
      totalEvents:    num(fieldOf(d, ['totalEvents', 'eventCount', 'events'])),
      upcomingEvents: num(fieldOf(d, ['upcomingEvents', 'upcoming'])),
      totalTenants:   num(fieldOf(d, ['totalTenants', 'tenantCount', 'tenants'])),
      activeTenants:  num(fieldOf(d, ['activeTenants', 'activeCount'])),
      totalUsers:     num(fieldOf(d, ['totalUsers', 'userCount', 'users'])),
      trend,
    };
  } catch {
    return null;
  }
}
