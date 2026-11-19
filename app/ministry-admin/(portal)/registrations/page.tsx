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

export default function MinistryAdminRegistrationsPage() {
  const [rows, setRows] = useState<EventRow[]>([]);
  const [total, setTotal] = useState(0);

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
        <StatCard title="Total Events" value={String(total)} variant="purple" />
        <StatCard title="Upcoming Events" value={String(active)} />
        <div className="lg:col-span-2">
          <QuickAccessCard />
        </div>
      </div>

      <EventsTable title="Registrations" rows={rows} actionLabel="View" />
    </div>
  );
}
