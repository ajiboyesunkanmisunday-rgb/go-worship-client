'use client';

import { useState, useEffect } from 'react';
import { StatCard } from '@/components/ministry/shared';
import type { SmartRow } from '@/components/shared/smart-table';
import { DataCard, QuickAccess } from '@/components/sermon-admin/shared';
import { EditDeleteActions } from '@/components/sermon-admin/row-actions';
import { ArrowUpRight, FolderPlus, Music } from 'lucide-react';
import Link from 'next/link';
import { api } from '@/lib/api/client';
import { USE_LIVE_API } from '@/lib/api/config';

type MediaFile = { id: string; name: string; type: string; size: string; used: string; date: string };

const MEDIA: MediaFile[] = [
  { id: '', name: 'Walking in Faith', type: 'MP3 File', size: '20mb', used: 'Faith and Doubt series', date: 'Jan 2, 2025' },
  { id: '', name: 'Hope in Motion', type: 'MP3 File', size: '18mb', used: 'Faith and Doubt series', date: 'Jan 2, 2025' },
  { id: '', name: 'Unity in Diversity', type: 'MP4 File', size: '52mb', used: 'Love in Action series', date: 'Jan 3, 2025' },
  { id: '', name: 'Love as a Verb', type: 'MP3 File', size: '20mb', used: 'Love in Action series', date: 'Jan 4, 2025' },
];

function UploadMediaCard() {
  return (
    <Link
      href="/sermon-admin/media/upload"
      className="relative flex min-h-[135px] flex-col justify-between rounded-[14px] bg-white p-5 no-underline"
    >
      <div className="flex items-start justify-between">
        <FolderPlus className="size-7 text-brand-blue" />
        <span className="flex size-8 items-center justify-center rounded-full bg-brand-blue/10">
          <ArrowUpRight className="size-4 text-brand-blue" />
        </span>
      </div>
      <div>
        <p className="text-[15px] font-semibold text-black">Upload Media</p>
        <p className="text-[12px] text-brand-gray-500">Click here to Upload Media</p>
      </div>
    </Link>
  );
}

export default function SermonAdminMediaPage() {
  const [media, setMedia] = useState<MediaFile[]>(USE_LIVE_API ? [] : MEDIA);

  const deleteMedia = (id: string) => {
    if (!USE_LIVE_API || !id) return;
    // /tenant/admin/media not in backend API — disabled.
    setMedia((prev) => prev.filter((m) => m.id !== id));
  };

  useEffect(() => {
    if (!USE_LIVE_API) return;
    // /tenant/admin/media not in backend API — disabled.
  }, []);

  const rows: SmartRow[] = media.map((m, i) => ({
    group: m.type,
    text: [m.name, m.type, m.size, m.used, m.date],
    cells: [
      <span key="f" className="flex items-center gap-2 font-medium">
        <span className="flex size-6 items-center justify-center rounded-[6px] bg-[#f0f0f0]">
          <Music className="size-3.5 text-brand-gray-500" />
        </span>
        {m.name}
      </span>,
      m.type,
      m.size,
      m.used,
      m.date,
      <EditDeleteActions key="a" editHref={`/sermon-admin/media/${m.id || i + 1}/edit`} onDelete={() => deleteMedia(m.id)} />,
    ],
  }));

  return (
    <div className="flex flex-col gap-5">
      <div className="grid grid-cols-1 gap-5 xl:grid-cols-[0.9fr_1.1fr]">
        <div className="grid grid-cols-2 gap-4">
          <StatCard title="Total Media" value={String(media.length || 45)} variant="blue" />
          <UploadMediaCard />
        </div>
        <QuickAccess />
      </div>

      <DataCard
        title="All Uploads"
        headers={['File name', 'Type', 'Size', 'Used In', 'Uploaded On', 'Action']}
        rows={rows}
        filterOptions={['MP3 File', 'MP4 File']}
        filterAll="Newest"
      />
    </div>
  );
}
