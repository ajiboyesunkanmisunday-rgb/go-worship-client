'use client';

import Link from 'next/link';

import { TableCard } from '@/components/shared/table-card';
import { ActionCard, StatCard } from '@/components/ministry/shared';
import { cn } from '@/lib/utils';
import { FolderPlus } from 'lucide-react';

const STATUS_COLORS: Record<string, string> = {
  Published: 'text-[#34a853]',
  Uploading: 'text-[#ff8d28]',
  Scheduled: 'text-brand-blue',
  Draft: 'text-[#eb0000]',
};

const SERIES = [
  { name: 'Faith in Action', desc: 'Weekly faith teaching', sermons: 12, status: 'Published', date: 'Jan 10, 2025' },
  { name: 'Hope in Motion', desc: 'Monthly outreach program', sermons: 30, status: 'Uploading', date: 'Feb 15, 2025' },
  { name: 'Unity in Diversity', desc: 'Quarterly community gathering', sermons: 50, status: 'Published', date: 'Mar 20, 2025' },
  { name: 'Love as a Verb', desc: 'Annual charity event', sermons: 100, status: 'Scheduled', date: 'Apr 25, 2025' },
  { name: 'Service Above Self', desc: 'Weekly volunteer opportunity', sermons: 20, status: 'Draft', date: 'May 30, 2025' },
  { name: 'Service Above Self', desc: 'Weekly volunteer opportunity', sermons: 20, status: 'Draft', date: 'May 30, 2025' },
  { name: 'Love as a Verb', desc: 'Annual charity event', sermons: 100, status: 'Scheduled', date: 'Apr 25, 2025' },
];

const folderIcon = (
  <span className="flex size-9 items-center justify-center rounded-[8px] bg-[#22a45d]">
    <FolderPlus className="size-5 text-white" />
  </span>
);

export default function MinistryMediaPage() {
  return (
    <div className="flex flex-col gap-5">
      <h1 className="text-[26px] font-bold lg:text-[32px]">Media</h1>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
        <StatCard title="Total Series" value="120" variant="blue" />
        <StatCard title="Total Sermon" value="530" variant="green" />
        <StatCard title="Draft Sermons" value="60" variant="green" />
        <ActionCard title="Add New Sermon" subtitle="Click here to add sermons" icon={folderIcon} />
        <ActionCard title="Create new series" subtitle="Click here to check in events" icon={folderIcon} />
      </div>

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
              {SERIES.map((s, i) => (
                <tr key={i} className="border-t border-[#f2f2f2] text-[12px]">
                  <td className="py-4">{s.name}</td>
                  <td className="py-4">{s.desc}</td>
                  <td className="py-4">{s.sermons}</td>
                  <td className={cn('py-4 font-medium', STATUS_COLORS[s.status])}>{s.status}</td>
                  <td className="py-4">{s.date}</td>
                  <td className="py-4">
                    <Link
                      href={s.status === 'Published'
                        ? `/ministry/media/${i + 1}`
                        : `/ministry/media/${i + 1}/edit`}
                      className={cn(
                        'flex h-8 w-[52px] items-center justify-center rounded-full text-[11px] text-white no-underline',
                        s.status === 'Published' ? 'bg-brand-blue' : 'bg-brand-gray-300'
                      )}
                    >
                      {s.status === 'Published' ? 'View' : 'Edit'}
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
      </TableCard>
    </div>
  );
}
