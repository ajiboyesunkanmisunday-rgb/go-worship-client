'use client';

import { useEffect, useState } from 'react';
import { getTenantEvents, getTenantBranding, type TenantEvent } from '@/lib/api/tenant';
import { getUnifiedDashboard, type UnifiedDashboardStats, type DashboardSection } from '@/lib/api/dashboard';
import { getProfile } from '@/lib/api/auth';
import { EventsTable, QuickAccessCard, StatCard, type EventRow } from './shared';
import { SectionBlock } from '@/components/shared/section-block';

function HelloCard({ orgName, userName }: { orgName: string; userName: string }) {
  return (
    <div className="relative flex min-h-[190px] flex-col justify-center overflow-hidden rounded-[15px] border border-[#fdfdfd] bg-white p-8">
      <span className="pointer-events-none absolute -top-10 right-[-60px] size-[260px] rounded-full border-[16px] border-brand-orange/15" />
      <h1 className="relative text-[28px] font-medium lg:text-[32px]">
        Hello{userName ? `, ${userName}` : ''} 👋
      </h1>
      <p className="relative mt-3 max-w-[341px] font-poppins text-[15px] font-light">
        Welcome to the {orgName || 'Go Worship'} platform
      </p>
    </div>
  );
}

export function GroupLeaderDashboard() {
  const [stats, setStats] = useState<UnifiedDashboardStats | null>(null);
  const [rawSections, setRawSections] = useState<DashboardSection[]>([]);
  const [recentEvents, setRecentEvents] = useState<EventRow[]>([]);
  const [orgName, setOrgName] = useState('');
  const [userName, setUserName] = useState('');

  useEffect(() => {
    getTenantBranding().then((b) => {
      if (b.organizationName) setOrgName(b.organizationName);
    }).catch(() => {});
    getProfile().then((p) => {
      const name = [p.firstName, p.lastName].filter(Boolean).join(' ');
      if (name) setUserName(name);
    }).catch(() => {});
    getUnifiedDashboard('LAST_30_DAYS', 'USD', 'ENGAGEMENT').then((s) => {
      if (s) { setStats(s); setRawSections(s.rawSections); }
    }).catch(() => {});
    getTenantEvents().then((events) => {
      const mapped: EventRow[] = events.slice(0, 5).map((e: TenantEvent) => ({
        name: e.name,
        date: e.eventDate
          ? `${new Date(e.eventDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}${e.eventTime ? ` • ${e.eventTime}` : ''}`
          : '',
        location: e.location,
        registrations: String(e.registrations),
        status: e.status.charAt(0).toUpperCase() + e.status.slice(1).toLowerCase(),
      }));
      setRecentEvents(mapped);
    }).catch(() => {});
  }, []);

  return (
    <div className="flex flex-col gap-5">
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <HelloCard orgName={orgName} userName={userName} />
        <QuickAccessCard />
      </div>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard title="Total Events" value={stats ? String(stats.totalEvents) : '0'} variant="purple" trend={[2,3,4,3,5,4,6,stats?.totalEvents ?? 0]} />
        <StatCard title="Total Registrations" value={stats ? String(stats.totalRegistrations ?? 0) : '0'} />
        <StatCard title="Upcoming Events" value={stats ? String(stats.upcomingEvents) : '0'} trend={[1,2,1,3,2,stats?.upcomingEvents ?? 0]} />
        <StatCard title="Total Checkin" value={stats ? String(stats.checkedIn ?? 0) : '0'} />
      </div>

      {rawSections.length > 0 && (
        <div className="flex flex-col gap-6">
          {rawSections.map((section) => (
            <SectionBlock key={section.type} section={section} accentColor="#454ae3" />
          ))}
        </div>
      )}

      <EventsTable title="Recent Events" rows={recentEvents} />
    </div>
  );
}
