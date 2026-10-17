import { StatCard } from '@/components/ministry/shared';
import type { SmartRow } from '@/components/shared/smart-table';
import {
  DataCard,
  QuickAccess,
  StatusText,
} from '@/components/sermon-admin/shared';
import { EditDeleteActions } from '@/components/sermon-admin/row-actions';
import { ArrowUpRight, Layers } from 'lucide-react';
import Link from 'next/link';

const TAGS = [
  { name: 'Walking in Faith', count: '23', status: 'Inactive', date: 'Jan 2, 2025' },
  { name: 'Embracing Change', count: '45', status: 'Active', date: 'Jan 3, 2025' },
  { name: 'Pursuing Dreams', count: '30', status: 'Inactive', date: 'Jan 4, 2025' },
  { name: 'Cultivating Gratitude', count: '12', status: 'Active', date: 'Jan 5, 2025' },
];

function AddTagCard() {
  return (
    <Link
      href="/sermon-admin/tags/create"
      className="relative flex min-h-[135px] flex-col justify-between rounded-[14px] bg-white p-5 no-underline"
    >
      <div className="flex items-start justify-between">
        <Layers className="size-7 text-brand-blue" />
        <span className="flex size-8 items-center justify-center rounded-full bg-brand-blue/10">
          <ArrowUpRight className="size-4 text-brand-blue" />
        </span>
      </div>
      <div>
        <p className="text-[15px] font-semibold text-black">Add Tag</p>
        <p className="text-[12px] text-brand-gray-500">Click here to add tags</p>
      </div>
    </Link>
  );
}

export default function SermonAdminTagsPage() {
  const rows: SmartRow[] = TAGS.map((t, i) => ({
    group: t.status,
    text: [t.name, t.count, t.status, t.date],
    cells: [
      <span key="n" className="font-medium">{t.name}</span>,
      t.count,
      <StatusText key="s" value={t.status} />,
      t.date,
      <EditDeleteActions key="a" editHref={`/sermon-admin/tags/${i + 1}/edit`} />,
    ],
  }));

  return (
    <div className="flex flex-col gap-5">
      <div className="grid grid-cols-1 gap-5 xl:grid-cols-[0.9fr_1.1fr]">
        <div className="grid grid-cols-2 gap-4">
          <StatCard title="Total tags" value="20" variant="blue" />
          <AddTagCard />
        </div>
        <QuickAccess />
      </div>

      <DataCard
        title="List of tags"
        headers={['Tag Name', 'Used In (Count)', 'Status', 'Created On', 'Action']}
        rows={rows}
        filterOptions={['Active', 'Inactive']}
        filterAll="All status"
      />
    </div>
  );
}
