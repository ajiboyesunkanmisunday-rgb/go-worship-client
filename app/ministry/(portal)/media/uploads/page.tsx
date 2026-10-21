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
    (api.del(`/tenant/admin/media/${id}`) as Promise<unknown>)
      .then(() => setUploads((prev) => prev.filter((u) => u.id !== id)))
      .catch(() => {});
  };

  useEffect(() => {
    if (!USE_LIVE_API) return;
    (api.get<unknown>('/tenant/admin/media') as Promise<unknown>)
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
        const mapped: UploadRow[] = arr.map((m) => {
          const rawDate = String(m['uploadedAt'] ?? m['createdAt'] ?? m['date'] ?? '');
          const date = rawDate ? new Date(rawDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '';
          const rawSize = Number(m['fileSize'] ?? m['size'] ?? 0);
          const size = rawSize ? `${Math.round(rawSize / (1024 * 1024))}mb` : String(m['sizeLabel'] ?? m['size'] ?? '');
          const mime = String(m['mimeType'] ?? m['fileType'] ?? m['type'] ?? '');
          const type = mime.includes('video') || mime.toUpperCase().includes('MP4') ? 'MP4 File' : 'MP3 File';
          return {
            id: String(m['id'] ?? m['mediaId'] ?? m['uuid'] ?? ''),
            name: String(m['name'] ?? m['title'] ?? m['fileName'] ?? ''),
            type, size,
            used: String(m['seriesName'] ?? m['linkedSeries'] ?? m['usedIn'] ?? ''),
            date,
          };
        }).filter((m) => m.name);
        if (mapped.length > 0) setUploads(mapped);
      })
      .catch(() => {});
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
