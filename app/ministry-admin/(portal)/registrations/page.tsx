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
  { name: 'Spring Networking Event', date: 'Apr 5, 2025 • 5PM', location: 'Rooftop Garden', registrations: '150', status: 'Upcoming' },
];

export default function MinistryAdminRegistrationsPage() {
  const [rows, setRows] = useState<EventRow[]>(MOCK_EVENTS);
  const [total, setTotal] = useState(MOCK_EVENTS.length);

  useEffect(() => {
    if (!USE_LIVE_API) return;
    getTenantEvents().then((events) => {
      const mapped: EventRow[] = events.map((e) => {
        let date = e.eventDate
          ? new Date(e.eventDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
          : '—';
        if (e.eventTime) date += ` • ${e.eventTime}`;
        return {
          name: e.name,
          date,
          location: e.location || '—',
          registrations: String(e.registrations),
          status: e.status,
        };
      });
      setRows(mapped);
      setTotal(mapped.length);
    }).catch(() => {});
  }, []);

  const active = rows.filter((r) => /upcoming|ongoing|active/i.test(r.status)).length;

  return (
    <div className="flex flex-col gap-5">
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-4">
        <StatCard title="Total Registrations" value={String(total)} variant="purple" />
        <StatCard title="Upcoming Events" value={String(active)} />
        <div className="lg:col-span-2">
          <QuickAccessCard />
        </div>
      </div>

      <EventsTable title="Registrations" rows={rows} actionLabel="View" />
    </div>
  );
}
