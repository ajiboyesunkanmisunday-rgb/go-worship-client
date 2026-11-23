'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';

import { TableCard } from '@/components/shared/table-card';
import { ActionCard, StatCard } from '@/components/ministry/shared';
import { cn } from '@/lib/utils';
import { FolderPlus, Trash2 } from 'lucide-react';
import { getTenantSeries, deleteTenantSeries } from '@/lib/api/tenant';
import { toast } from 'sonner';
import { Bar, BarChart, Cell, ResponsiveContainer, Tooltip, XAxis } from 'recharts';

const STATUS_COLORS: Record<string, string> = {
  Published: 'text-[#34a853]',
  Uploading: 'text-[#ff8d28]',
  Scheduled: 'text-brand-blue',
  Draft: 'text-[#eb0000]',
};

type Series = { id: string; name: string; desc: string; sermons: number; status: string; date: string };


function normalizeSeriesStatus(raw: string): string {
  const u = raw.toUpperCase();
  if (u === 'PUBLISHED' || u === 'ACTIVE' || u === 'LIVE') return 'Published';
  if (u === 'DRAFT' || u === 'PENDING' || u === 'INACTIVE') return 'Draft';
  if (u === 'SCHEDULED') return 'Scheduled';
  if (u === 'UPLOADING' || u === 'PROCESSING') return 'Uploading';
  return raw;
}

const folderIcon = (
  <span className="flex size-9 items-center justify-center rounded-[8px] bg-[#22a45d]">
    <FolderPlus className="size-5 text-white" />
  </span>
);

export default function MinistryMediaPage() {
  const [series, setSeries] = useState<Series[]>([]);

  async function handleDeleteSeries(id: string) {
    try {
      await deleteTenantSeries(id);
      setSeries((prev) => prev.filter((s) => s.id !== id));
      toast.success('Series deleted.');
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Could not delete series.');
    }
  }

  useEffect(() => {
    getTenantSeries()
      .then((arr) => {
        if (arr.length === 0) return;
        const mapped: Series[] = arr.map((s) => {
          const rawDate = String(s.createdAt ?? s.publishedAt ?? '');
          const date = rawDate
            ? new Date(rawDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
            : '';
          return {
            id: String(s.id ?? s.seriesId ?? ''),
            name: String(s.title ?? ''),
            desc: String(s.description ?? ''),
            sermons: 0,
            status: normalizeSeriesStatus(String(s.status ?? 'Published')),
            date,
          };
        }).filter((s) => s.name);
        if (mapped.length > 0) setSeries(mapped);
      })
      .catch(() => { toast.error('Could not load media series.'); });
  }, []);

  const draftCount = series.filter((s) => s.status === 'Draft').length;
  const publishedCount = series.filter((s) => s.status === 'Published').length;
  const scheduledCount = series.filter((s) => s.status === 'Scheduled').length;
  const uploadingCount = series.filter((s) => s.status === 'Uploading').length;
  const totalSermons = series.reduce((sum, s) => sum + s.sermons, 0);

  const statusData = [
    { name: 'Published', value: publishedCount },
    { name: 'Draft', value: draftCount },
    { name: 'Scheduled', value: scheduledCount },
    { name: 'Uploading', value: uploadingCount },
  ].filter((d) => d.value > 0);
  const MEDIA_COLORS = ['#22a45d', '#eb0000', '#ff8d28', '#243f84'];

  return (
    <div className="flex flex-col gap-5">
      <h1 className="text-[26px] font-bold lg:text-[32px]">Media</h1>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
        <StatCard title="Total Series" value={String(series.length)} variant="blue" trend={[1,2,2,3,3,series.length]} />
        <StatCard title="Total Sermon" value={String(totalSermons)} variant="green" />
        <StatCard title="Draft Sermons" value={String(draftCount)} variant="green" />
        <ActionCard href="/ministry/media/new" title="Add New Sermon" subtitle="Click here to add sermons" icon={folderIcon} />
        <ActionCard href="/ministry/media/series/new" title="Create new series" subtitle="Click here to create a series" icon={folderIcon} />
      </div>

      {series.length > 0 && statusData.length > 0 && (
        <div className="rounded-[14px] bg-white p-6">
          <p className="text-[16px] font-bold">Series by Status</p>
          <p className="mt-0.5 text-[13px] text-brand-gray-500">Publication status breakdown</p>
          <div className="mt-4 h-[150px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={statusData} margin={{ top: 4, right: 8, bottom: 0, left: 0 }}>
                <XAxis dataKey="name" tickLine={false} axisLine={false} tick={{ fontSize: 11 }} />
                <Tooltip formatter={(v) => [String(v), 'Series']} />
                <Bar dataKey="value" radius={[4, 4, 0, 0]} barSize={48} isAnimationActive={false}>
                  {statusData.map((_, i) => <Cell key={i} fill={MEDIA_COLORS[i % MEDIA_COLORS.length]} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      <TableCard
        title="Recent Activity"
        filterOptions={['Last 7 days', '30 days', '1 year']}
        filterAll="Today"
        filterByRow={false}
      >
        <table className="w-full min-w-[820px] border-collapse">
            <thead>
              <tr className="text-left text-[13px] text-[#333]">
                {['Series Name', 'Description', 'No. of Sermons', 'Status', 'Created On', 'Action'].map((h) => (
                  <th key={h} className="py-3 font-medium">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {series.map((s, i) => (
                <tr key={i} className="border-t border-[#f2f2f2] text-[12px]">
                  <td className="py-4">{s.name}</td>
                  <td className="py-4">{s.desc}</td>
                  <td className="py-4">{s.sermons}</td>
                  <td className={cn('py-4 font-medium', STATUS_COLORS[s.status])}>{s.status}</td>
                  <td className="py-4">{s.date}</td>
                  <td className="py-4">
                    <div className="flex items-center gap-2">
                      <Link
                        href={s.status === 'Published'
                          ? `/ministry/media/${s.id || i + 1}`
                          : `/ministry/media/${s.id || i + 1}/edit`}
                        className={cn(
                          'flex h-8 w-[52px] items-center justify-center rounded-full text-[11px] text-white no-underline',
                          s.status === 'Published' ? 'bg-brand-blue' : 'bg-brand-gray-300'
                        )}
                      >
                        {s.status === 'Published' ? 'View' : 'Edit'}
                      </Link>
                      {s.id && (
                        <button
                          type="button"
                          onClick={() => void handleDeleteSeries(s.id)}
                          className="text-brand-gray-400 transition-colors hover:text-[#eb0000]"
                          title="Delete series"
                        >
                          <Trash2 className="size-3.5" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
      </TableCard>
    </div>
  );
}
