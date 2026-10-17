'use client';

import { useEffect, useState } from 'react';
import { getTenantStats, getTenantEvents, type TenantStats, type TenantEvent } from '@/lib/api/tenant';
import { USE_LIVE_API } from '@/lib/api/config';
import { EventsTable, QuickAccessCard, StatCard, type EventRow } from './shared';

function HelloCard() {
  return (
    <div className="relative flex min-h-[190px] flex-col justify-center overflow-hidden rounded-[15px] border border-[#fdfdfd] bg-white p-8">
      <span className="pointer-events-none absolute -top-10 right-[-60px] size-[260px] rounded-full border-[16px] border-brand-orange/15" />
      <h1 className="relative text-[28px] font-medium lg:text-[32px]">
        Hello Christain 👋
      </h1>
      <p className="relative mt-3 max-w-[341px] font-poppins text-[15px] font-light">
        Welcome to Celebration Church International Go worship Platform
      </p>
    </div>
  );
}

const RECENT_EVENTS = [
  {
    name: 'Midweek Recharge',
    date: 'Feb 21, 2025 • 6PM',
    location: 'Main Hall',
    registrations: '125',
    status: 'Upcoming',
  },
  {
    name: 'Weekend Workshop',
    date: 'Feb 25, 2025 • 10AM',
    location: 'Conference Room A',
    registrations: '75',
    status: 'Completed',
  },
  {
    name: 'Team Building Retreat',
    date: 'Mar 10, 2025 • 8AM',
    location: 'Offsite Location',
    registrations: '50',
    status: 'Reoccurring',
  },
  {
    name: 'Monthly Check-in',
    date: 'Mar 15, 2025 • 3PM',
    location: 'Zoom',
    registrations: 'Unlimited',
    status: 'Cancelled',
  },
  {
    name: 'Spring Networking Event',
    date: 'Apr 5, 2025 • 5PM',
    location: 'Rooftop Garden',
    registrations: '150',
    status: 'Upcoming',
  },
];

export function GroupLeaderDashboard() {
  const [stats, setStats] = useState<TenantStats | null>(null);
  const [recentEvents, setRecentEvents] = useState<EventRow[]>(RECENT_EVENTS);

  useEffect(() => {
    if (!USE_LIVE_API) return;
    getTenantStats().then((s) => { if (s) setStats(s); }).catch(() => {});
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
        <HelloCard />
        <QuickAccessCard />
      </div>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard title="Total Events" value={stats ? String(stats.totalEvents) : '24'} variant="purple" />
        <StatCard title="Total Registrations" value={stats ? String(stats.totalMembers) : '43'} />
        <StatCard title="Upcoming Events" value={stats ? String(stats.upcomingEvents) : '15'} />
        <StatCard title="Total Checkin" value={stats ? String(stats.activeMembers) : '10'} />
      </div>

      <EventsTable title="Recent Events" rows={recentEvents} />
    </div>
  );
}
