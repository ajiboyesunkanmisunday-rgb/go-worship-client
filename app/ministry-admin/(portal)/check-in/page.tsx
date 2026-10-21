'use client';

import {
  EventsTable,
  QuickAccessCard,
  StatCard,
  type EventRow,
} from '@/components/ministry-admin/shared';
import { getTenantEvents } from '@/lib/api/tenant';
import { USE_LIVE_API } from '@/lib/api/config';
import { useEffect, useState } from 'react';

const MOCK_EVENTS: EventRow[] = [
  { name: 'Midweek Recharge', date: 'Feb 21, 2025 • 6PM', location: 'Main Hall', registrations: '125', status: 'Upcoming' },
  { name: 'Weekend Workshop', date: 'Feb 25, 2025 • 10AM', location: 'Conference Room A', registrations: '75', status: 'Completed' },
  { name: 'Team Building Retreat', date: 'Mar 10, 2025 • 8AM', location: 'Offsite Location', registrations: '50', status: 'Ongoing' },
  { name: 'Monthly Check-in', date: 'Mar 15, 2025 • 3PM', location: 'Zoom', registrations: 'Unlimited', status: 'Cancelled' },
  { name: 'Spring Networking Event', date: 'Apr 5, 2025 • 5PM', location: 'Rooftop Garden', registrations: '150', status: 'Upcoming' },
];

export default function MinistryAdminCheckInPage() {
  const [rows, setRows] = useState<EventRow[]>(USE_LIVE_API ? [] : MOCK_EVENTS);

  useEffect(() => {
    if (!USE_LIVE_API) return;
    getTenantEvents().then((events) => {
      const mapped: EventRow[] = events.map((e) => ({
        name: e.name,
        date: e.eventDate
          ? `${new Date(e.eventDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}${e.eventTime ? ` • ${e.eventTime}` : ''}`
          : '',
        location: e.location,
        registrations: String(e.registrations),
        status: e.status.charAt(0).toUpperCase() + e.status.slice(1).toLowerCase(),
      }));
      setRows(mapped);
    }).catch(() => {});
  }, []);

  const total = rows.length;
  const upcoming = rows.filter((r) => r.status.toLowerCase() === 'upcoming').length;

  return (
    <div className="flex flex-col gap-5">
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-4">
        <StatCard title="Total Check in" value={String(total)} variant="purple" />
        <StatCard title="Registered event" value={String(upcoming)} />
        <div className="lg:col-span-2">
          <QuickAccessCard />
        </div>
      </div>

      <EventsTable title="Events" rows={rows} actionLabel="Check-in" />
    </div>
  );
}
