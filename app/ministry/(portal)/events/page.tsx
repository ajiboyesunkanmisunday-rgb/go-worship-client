'use client';

import { CheckInButton } from '@/components/ministry/check-in-button';
import { TableCard } from '@/components/shared/table-card';
import { ActionCard, StatCard } from '@/components/ministry/shared';
import { cn } from '@/lib/utils';
import { Plus } from 'lucide-react';
import { getTenantEvents, type TenantEvent } from '@/lib/api/tenant';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Bar, BarChart, Cell, ResponsiveContainer, Tooltip, XAxis } from 'recharts';

const STATUS_COLORS: Record<string, string> = {
  Upcoming: 'text-brand-blue',
  Completed: 'text-[#34a853]',
  Ongoing: 'text-[#ff8d28]',
  Cancelled: 'text-[#eb0000]',
};

type EventRow = { name: string; date: string; location: string; reg: string; status: string };


function toRow(e: TenantEvent): EventRow {
  const label = e.status.charAt(0).toUpperCase() + e.status.slice(1).toLowerCase();
  const date = e.eventDate
    ? `${new Date(e.eventDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}${e.eventTime ? ` • ${e.eventTime}` : ''}`
    : '';
  return { name: e.name, date, location: e.location, reg: String(e.registrations), status: label };
}

export default function MinistryEventsPage() {
  const [events, setEvents] = useState<EventRow[]>([]);

  useEffect(() => {
    getTenantEvents().then((data) => setEvents(data.map(toRow))).catch(() => { toast.error('Could not load events.'); });
  }, []);

  const upcoming = events.filter((e) => e.status.toLowerCase() === 'upcoming').length;
  const totalReg = events.reduce((sum, e) => sum + (Number(e.reg) || 0), 0);

  return (
    <div className="flex flex-col gap-5">
      <h1 className="text-[26px] font-bold lg:text-[32px]">Events</h1>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard title="Total Events" value={String(events.length)} variant="blue" trend={[2,3,2,4,3,events.length]} />
        <StatCard title="Upcoming Events" value={String(upcoming)} variant="green" trend={[1,2,1,2,upcoming]} />
        <StatCard title="Total Registrations" value={String(totalReg)} variant="white" />
        <ActionCard
          href="/ministry/events/create"
          title="Create Event"
          subtitle="Click here to create events"
          icon={
            <span className="flex size-9 items-center justify-center rounded-full bg-[#22a45d]">
              <Plus className="size-5 text-white" />
            </span>
          }
        />
      </div>

      {events.length > 0 && (() => {
        const counts = ['Upcoming', 'Ongoing', 'Completed', 'Cancelled'].map((s) => ({
          name: s,
          value: events.filter((e) => e.status.toLowerCase() === s.toLowerCase()).length,
        })).filter((d) => d.value > 0);
        const COLORS = ['#243f84', '#ff8d28', '#22a45d', '#eb0000'];
        return counts.length > 0 ? (
          <div className="rounded-[14px] bg-white p-6">
            <p className="text-[16px] font-bold">Event Status Breakdown</p>
            <div className="mt-4 h-[160px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={counts} margin={{ top: 4, right: 8, bottom: 0, left: 0 }}>
                  <XAxis dataKey="name" tickLine={false} axisLine={false} tick={{ fontSize: 11 }} />
                  <Tooltip formatter={(v) => [String(v), 'Events']} />
                  <Bar dataKey="value" radius={[4, 4, 0, 0]} barSize={40} isAnimationActive={false}>
                    {counts.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        ) : null;
      })()}

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
