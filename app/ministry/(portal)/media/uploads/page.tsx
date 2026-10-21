'use client';

import { useState, useEffect } from 'react';
import { SmartTable, type SmartRow } from '@/components/shared/smart-table';
import { EditDeleteActions } from '@/components/sermon-admin/row-actions';
import { Music } from 'lucide-react';
import { api } from '@/lib/api/client';
import { USE_LIVE_API } from '@/lib/api/config';

type UploadRow = { id: string; name: string; type: string; size: string; used: string; date: string };

const UPLOADS: UploadRow[] = [
  { id: '', name: 'Walking in Faith', type: 'MP3 File', size: '20mb', used: 'Faith and Doubt series', date: 'Jan 2, 2025' },
  { id: '', name: 'Walking in Faith', type: 'MP3 File', size: '20mb', used: 'Faith and Doubt series', date: 'Jan 2, 2025' },
  { id: '', name: 'Walking in Faith', type: 'MP4 File', size: '20mb', used: 'Faith and Doubt series', date: 'Jan 2, 2025' },
  { id: '', name: 'Walking in Faith', type: 'MP3 File', size: '20mb', used: 'Faith and Doubt series', date: 'Jan 2, 2025' },
];

/** Church Admin → Uploaded Media (Figma 530:26345). */
export default function MinistryUploadedMediaPage() {
  const [uploads, setUploads] = useState<UploadRow[]>(USE_LIVE_API ? [] : UPLOADS);

  const deleteUpload = (id: string) => {
    if (!USE_LIVE_API || !id) return;
    // /tenant/admin/media not in backend API — disabled.
    setUploads((prev) => prev.filter((u) => u.id !== id));
  };

  useEffect(() => {
    if (!USE_LIVE_API) return;
    // /tenant/admin/media not in backend API — disabled.
  }, []);

  const rows: SmartRow[] = uploads.map((m, i) => ({
    group: m.type,
    text: [m.name, m.type, m.size, m.used, m.date],
    cells: [
      <span key="f" className="flex items-center gap-2 font-medium">
        <span className="flex size-6 items-center justify-center rounded-[6px] bg-[#ece9ff]">
          <Music className="size-3.5 text-[#3f44c0]" />
        </span>
        {m.name}
      </span>,
      m.type,
      m.size,
      m.used,
      m.date,
      <EditDeleteActions key="a" editHref={`/ministry/media/${m.id || i + 1}/edit`} onDelete={() => deleteUpload(m.id)} />,
    ],
  }));

  return (
    <div className="flex flex-col gap-5">
      <h1 className="text-[26px] font-bold lg:text-[32px]">Uploaded Media</h1>

      <SmartTable
        title="All Uploads"
        headers={['File name', 'Type', 'Size', 'Used In', 'Uploaded On', 'Action']}
        rows={rows}
        filterOptions={['MP3 File', 'MP4 File']}
        filterAll="Newest"
      />
    </div>
  );
}
