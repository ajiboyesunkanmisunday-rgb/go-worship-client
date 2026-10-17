'use client';

import { useState, useEffect } from 'react';
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
import { api } from '@/lib/api/client';
import { USE_LIVE_API } from '@/lib/api/config';

type Tag = { id: string; name: string; count: string; status: string; date: string };

const TAGS: Tag[] = [
  { id: '', name: 'Walking in Faith', count: '23', status: 'Inactive', date: 'Jan 2, 2025' },
  { id: '', name: 'Embracing Change', count: '45', status: 'Active', date: 'Jan 3, 2025' },
  { id: '', name: 'Pursuing Dreams', count: '30', status: 'Inactive', date: 'Jan 4, 2025' },
  { id: '', name: 'Cultivating Gratitude', count: '12', status: 'Active', date: 'Jan 5, 2025' },
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
  const [tags, setTags] = useState<Tag[]>(TAGS);

  const deleteTag = (id: string) => {
    if (!USE_LIVE_API || !id) return;
    (api.del(`/tenant/admin/sermon/tags/${id}`) as Promise<unknown>)
      .then(() => setTags((prev) => prev.filter((t) => t.id !== id)))
      .catch(() => {});
  };

  useEffect(() => {
    if (!USE_LIVE_API) return;
    (api.get<unknown>('/tenant/admin/sermon/tags') as Promise<unknown>)
      .then((data) => {
        type R = Record<string, unknown>;
        const arr: R[] = Array.isArray(data)
          ? (data as R[])
          : Array.isArray((data as R)?.['content'])
            ? ((data as R)['content'] as R[])
            : Array.isArray((data as R)?.['data'])
              ? ((data as R)['data'] as R[])
              : [];
        if (arr.length === 0) return;
        const mapped: Tag[] = arr.map((t) => {
          const rawDate = String(t['createdAt'] ?? t['date'] ?? '');
          const date = rawDate ? new Date(rawDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '';
          const rawStatus = String(t['status'] ?? 'Active');
          const status = rawStatus.toUpperCase() === 'INACTIVE' ? 'Inactive' : 'Active';
          return {
            id: String(t['id'] ?? t['tagId'] ?? t['uuid'] ?? ''),
            name: String(t['name'] ?? t['tagName'] ?? t['label'] ?? ''),
            count: String(t['sermonCount'] ?? t['usageCount'] ?? t['count'] ?? '0'),
            status,
            date,
          };
        }).filter((t) => t.name);
        if (mapped.length > 0) setTags(mapped);
      })
      .catch(() => {});
  }, []);

  const rows: SmartRow[] = tags.map((t, i) => ({
    group: t.status,
    text: [t.name, t.count, t.status, t.date],
    cells: [
      <span key="n" className="font-medium">{t.name}</span>,
      t.count,
      <StatusText key="s" value={t.status} />,
      t.date,
      <EditDeleteActions key="a" editHref={`/sermon-admin/tags/${t.id || i + 1}/edit`} onDelete={() => deleteTag(t.id)} />,
    ],
  }));

  return (
    <div className="flex flex-col gap-5">
      <div className="grid grid-cols-1 gap-5 xl:grid-cols-[0.9fr_1.1fr]">
        <div className="grid grid-cols-2 gap-4">
          <StatCard title="Total tags" value={String(tags.length || 20)} variant="blue" />
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
