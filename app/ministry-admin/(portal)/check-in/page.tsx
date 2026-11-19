'use client';

import {
  EventsTable,
  QuickAccessCard,
  StatCard,
  type EventRow,
} from '@/components/ministry-admin/shared';
import { getTenantEvents } from '@/lib/api/tenant';
import { useEffect, useState } from 'react';

export default function MinistryAdminCheckInPage() {
  const [rows, setRows] = useState<EventRow[]>([]);

  useEffect(() => {
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
        <StatCard title="Total Events" value={String(total)} />
        <div className="lg:col-span-2">
          <QuickAccessCard />
        </div>
      </div>

      <EventsTable title="Events" rows={rows} actionLabel="Check-in" />
    </div>
  );
}
