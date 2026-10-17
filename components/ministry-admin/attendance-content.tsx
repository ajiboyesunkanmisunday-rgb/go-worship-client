'use client';

import { useEffect, useState } from 'react';
import { Bar, BarChart, XAxis, YAxis } from 'recharts';
import { ChartContainer, type ChartConfig } from '@/components/ui/chart';
import { EventsTable, StatCard, type EventRow } from './shared';
import { getTenantEvents } from '@/lib/api/tenant';
import { getUnifiedDashboard } from '@/lib/api/dashboard';
import { USE_LIVE_API } from '@/lib/api/config';

const MOCK_CHART_DATA = [
  { month: 'Jan', value: 2000 },
  { month: 'Feb', value: 4500 },
  { month: 'Mar', value: 2600 },
  { month: 'Apr', value: 3400 },
  { month: 'May', value: 1500 },
  { month: 'Jun', value: 7800 },
  { month: 'Jul', value: 2200 },
  { month: 'Aug', value: 3900 },
  { month: 'Sep', value: 1200 },
  { month: 'Oct', value: 3000 },
  { month: 'Nov', value: 6800 },
  { month: 'Dec', value: 3600 },
];

const chartConfig = {
  value: { label: 'Attendance', color: '#243F84' },
} satisfies ChartConfig;

const MOCK_EVENTS: EventRow[] = [
  { name: 'Midweek Recharge', date: 'Feb 21, 2025 • 6PM', location: 'Main Hall', registrations: '125', status: 'Completed' },
  { name: 'Weekend Workshop', date: 'Feb 25, 2025 • 10AM', location: 'Conference Room A', registrations: '75', status: 'Completed' },
  { name: 'Team Building Retreat', date: 'Mar 10, 2025 • 8AM', location: 'Offsite Location', registrations: '50', status: 'Ongoing' },
  { name: 'Monthly Check-in', date: 'Mar 15, 2025 • 3PM', location: 'Zoom', registrations: 'Unlimited', status: 'Cancelled' },
  { name: 'Spring Networking Event', date: 'Apr 5, 2025 • 5PM', location: 'Rooftop Garden', registrations: '150', status: 'Upcoming' },
];

export function AttendanceContent() {
  const [events, setEvents] = useState<EventRow[]>(MOCK_EVENTS);
  const [totalRegistration, setTotalRegistration] = useState(15);
  const [chartData, setChartData] = useState(MOCK_CHART_DATA);

  useEffect(() => {
    if (!USE_LIVE_API) return;
    getTenantEvents().then((data) => {
      const mapped: EventRow[] = data.map((e) => ({
        name: e.name,
        date: e.eventDate
          ? `${new Date(e.eventDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}${e.eventTime ? ` • ${e.eventTime}` : ''}`
          : '',
        location: e.location,
        registrations: String(e.registrations),
        status: e.status.charAt(0).toUpperCase() + e.status.slice(1).toLowerCase(),
      }));
      if (mapped.length > 0) setEvents(mapped);
    }).catch(() => {});

    getUnifiedDashboard().then((s) => {
      if (s && s.totalEvents > 0) setTotalRegistration(s.totalEvents);
      if (s && s.trend.length > 0) {
        setChartData(s.trend.map((p) => ({ month: p.label, value: p.value })));
      }
    }).catch(() => {});
  }, []);

  return (
    <div className="flex flex-col gap-5">
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        <div className="rounded-[15px] bg-white p-6 lg:col-span-2">
          <div className="mb-2 flex items-center justify-between gap-4">
            <div>
              <h2 className="text-[24px] font-medium">Attendance</h2>
              <p className="text-[32px] font-bold text-brand-blue">1000</p>
            </div>
            <span className="rounded-[6px] bg-[#f4f7ff] px-3 py-1.5 text-[12px] text-brand-gray-500">
              Dec 31, 2024 - Dec 31, 2025
            </span>
          </div>
          <ChartContainer config={chartConfig} className="h-[280px] w-full">
            <BarChart data={chartData} margin={{ top: 12, right: 8, bottom: 8, left: 8 }}>
              <XAxis
                dataKey="month"
                tickLine={{ strokeDasharray: '4 2' }}
                axisLine={{ strokeDasharray: '4 2' }}
                tickMargin={8}
                tick={{ fontSize: 11 }}
                interval={0}
              />
              <YAxis
                orientation="right"
                tickLine={{ strokeDasharray: '4 2' }}
                axisLine={{ strokeDasharray: '4 2' }}
                tick={{ fontSize: 11 }}
                width={44}
              />
              <Bar dataKey="value" fill="var(--color-value)" barSize={26} />
            </BarChart>
          </ChartContainer>
        </div>

        <div className="flex flex-col gap-5">
          <StatCard title="Total Registration" value={String(totalRegistration)} variant="purple" />
          <StatCard title="Check-ins Today" value="45" />
        </div>
      </div>

      <EventsTable title="Events" rows={events} actionLabel="View List" />
    </div>
  );
}
