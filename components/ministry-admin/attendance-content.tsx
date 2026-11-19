'use client';

import { useEffect, useState } from 'react';
import { Bar, BarChart, XAxis, YAxis } from 'recharts';
import { ChartContainer, type ChartConfig } from '@/components/ui/chart';
import { EventsTable, StatCard, type EventRow } from './shared';
import { getTenantEvents, getTenantStats } from '@/lib/api/tenant';
import { getUnifiedDashboard } from '@/lib/api/dashboard';

const chartConfig = {
  value: { label: 'Attendance', color: '#243F84' },
} satisfies ChartConfig;

export function AttendanceContent() {
  const [events, setEvents] = useState<EventRow[]>([]);
  const [totalRegistration, setTotalRegistration] = useState(0);
  const [chartData, setChartData] = useState<{ month: string; value: number }[]>([]);
  const [totalAttendance, setTotalAttendance] = useState(0);
  const [checkInsToday, setCheckInsToday] = useState(0);

  useEffect(() => {
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
        const live = s.trend.map((p) => ({ month: p.label, value: p.value }));
        setChartData(live);
        setTotalAttendance(live.reduce((sum, d) => sum + d.value, 0));
      }
    }).catch(() => {});
    getTenantStats().then((s) => {
      if (s && s.checkInsToday !== undefined) setCheckInsToday(s.checkInsToday);
    }).catch(() => {});
  }, []);

  return (
    <div className="flex flex-col gap-5">
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        <div className="rounded-[15px] bg-white p-6 lg:col-span-2">
          <div className="mb-2 flex items-center justify-between gap-4">
            <div>
              <h2 className="text-[24px] font-medium">Attendance</h2>
              <p className="text-[32px] font-bold text-brand-blue">{totalAttendance.toLocaleString()}</p>
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
          <StatCard title="Check-ins Today" value={String(checkInsToday)} />
        </div>
      </div>

      <EventsTable title="Events" rows={events} actionLabel="View List" />
    </div>
  );
}
