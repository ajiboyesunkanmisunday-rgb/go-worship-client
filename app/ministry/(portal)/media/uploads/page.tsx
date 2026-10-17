'use client';

import { SmartTable, type SmartRow } from '@/components/shared/smart-table';
import { EditDeleteActions } from '@/components/sermon-admin/row-actions';
import { Music } from 'lucide-react';

const UPLOADS = [
  { name: 'Walking in Faith', type: 'MP3 File', size: '20mb', used: 'Faith and Doubt series', date: 'Jan 2, 2025' },
  { name: 'Walking in Faith', type: 'MP3 File', size: '20mb', used: 'Faith and Doubt series', date: 'Jan 2, 2025' },
  { name: 'Walking in Faith', type: 'MP4 File', size: '20mb', used: 'Faith and Doubt series', date: 'Jan 2, 2025' },
  { name: 'Walking in Faith', type: 'MP3 File', size: '20mb', used: 'Faith and Doubt series', date: 'Jan 2, 2025' },
];

/** Church Admin → Uploaded Media (Figma 530:26345). */
export default function MinistryUploadedMediaPage() {
  const rows: SmartRow[] = UPLOADS.map((m, i) => ({
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
      <EditDeleteActions key="a" editHref={`/sermon-admin/media/${i + 1}/edit`} />,
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
