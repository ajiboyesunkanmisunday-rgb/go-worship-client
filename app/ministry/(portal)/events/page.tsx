'use client';

import { CheckInButton } from '@/components/ministry/check-in-button';
import { TableCard } from '@/components/shared/table-card';
import { ActionCard, StatCard } from '@/components/ministry/shared';
import { cn } from '@/lib/utils';
import { Plus } from 'lucide-react';
import { getTenantEvents, type TenantEvent } from '@/lib/api/tenant';
import { USE_LIVE_API } from '@/lib/api/config';
import { useEffect, useState } from 'react';

const STATUS_COLORS: Record<string, string> = {
  Upcoming: 'text-brand-blue',
  Completed: 'text-[#34a853]',
  Ongoing: 'text-[#ff8d28]',
  Cancelled: 'text-[#eb0000]',
};

type EventRow = { name: string; date: string; location: string; reg: string; status: string };

const MOCK_EVENTS: EventRow[] = [
  { name: 'Midweek Recharge', date: 'Feb 21, 2025 • 6PM', location: 'Main Hall', reg: '125', status: 'Upcoming' },
  { name: 'Weekend Workshop', date: 'Feb 25, 2025 • 10AM', location: 'Conference Room A', reg: '75', status: 'Completed' },
  { name: 'Team Building Retreat', date: 'Mar 10, 2025 • 8AM', location: 'Offsite Location', reg: '50', status: 'Ongoing' },
  { name: 'Monthly Check-in', date: 'Mar 15, 2025 • 3PM', location: 'Zoom', reg: 'Unlimited', status: 'Cancelled' },
  { name: 'Spring Networking Event', date: 'Apr 5, 2025 • 5PM', location: 'Rooftop Garden', reg: '150', status: 'Upcoming' },
];

function toRow(e: TenantEvent): EventRow {
  const label = e.status.charAt(0).toUpperCase() + e.status.slice(1).toLowerCase();
  const date = e.eventDate
    ? `${new Date(e.eventDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}${e.eventTime ? ` • ${e.eventTime}` : ''}`
    : '';
  return { name: e.name, date, location: e.location, reg: String(e.registrations), status: label };
}

export default function MinistryEventsPage() {
  const [events, setEvents] = useState<EventRow[]>(MOCK_EVENTS);

  useEffect(() => {
    if (!USE_LIVE_API) return;
    getTenantEvents().then((data) => setEvents(data.map(toRow))).catch(() => {});
  }, []);

  const upcoming = events.filter((e) => e.status.toLowerCase() === 'upcoming').length;
  const totalReg = events.reduce((sum, e) => sum + (Number(e.reg) || 0), 0);

  return (
    <div className="flex flex-col gap-5">
      <h1 className="text-[26px] font-bold lg:text-[32px]">Events</h1>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard title="Total Events" value={String(events.length)} variant="blue" />
        <StatCard title="Upcoming Events" value={String(upcoming)} variant="green" />
        <StatCard title="Total Registrations" value={String(totalReg)} variant="white" />
        <ActionCard
          title="Create Event"
          subtitle="Click here to create events"
          icon={
            <span className="flex size-9 items-center justify-center rounded-full bg-[#22a45d]">
              <Plus className="size-5 text-white" />
            </span>
          }
        />
      </div>

      <TableCard
        title="All Events"
        filterOptions={['Upcoming', 'Completed', 'Ongoing', 'Cancelled']}
        filterAll="All status"
      >
        <table className="w-full min-w-[760px] border-collapse">
          <thead>
            <tr className="text-left text-[13px] text-[#333]">
              {['Event Name', 'Date & Time', 'Location', 'Registrations', 'Status', 'Action'].map((h) => (
                <th key={h} className="py-3 font-medium">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {events.map((e, i) => (
              <tr key={i} className="border-t border-[#f2f2f2] text-[12px]">
                <td className="py-4">{e.name}</td>
                <td className="py-4">{e.date}</td>
                <td className="py-4">{e.location}</td>
                <td className="py-4 text-[#3e3e3e]">{e.reg}</td>
                <td className={cn('py-4 font-medium', STATUS_COLORS[e.status] ?? '')}>{e.status}</td>
                <td className="py-4">
                  <CheckInButton eventName={e.name} highlighted={i === 0} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </TableCard>
    </div>
  );
}
