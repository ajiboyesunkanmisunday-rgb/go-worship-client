import { StatCard } from '@/components/ministry/shared';
import type { SmartRow } from '@/components/shared/smart-table';
import {
  DataCard,
  QuickAccess,
  StatusText,
  ViewEditButton,
} from '@/components/sermon-admin/shared';

const SERMONS = [
  { title: 'Walking in Faith', speaker: 'Pastor John', series: 'Faith in Action', date: 'Feb 10', status: 'Published' },
  { title: 'Hope in Motion', speaker: 'Pastor John', series: 'Faith in Action', date: 'Draft', status: 'Draft' },
  { title: 'Unity in Diversity', speaker: 'Pastor Mary', series: 'Love in Action', date: 'Draft', status: 'Published' },
  { title: 'Love as a Verb', speaker: 'Pastor John', series: 'Love in Action', date: 'June 12', status: 'Scheduled' },
  { title: 'Service Above Self', speaker: 'Pastor John', series: 'Love in Action', date: 'June 12', status: 'Draft' },
];

export default function SermonAdminSermonsPage() {
  const rows: SmartRow[] = SERMONS.map((s, i) => ({
    group: s.status,
    text: [s.title, s.speaker, s.series, s.date, s.status, 'Audio'],
    cells: [
      <span key="t" className="font-medium">{s.title}</span>,
      s.speaker,
      s.series,
      s.date,
      <StatusText key="s" value={s.status} />,
      'Audio',
      <ViewEditButton
        key="a"
        variant={i % 2 === 0 ? 'view' : 'edit'}
        href={
          i % 2 === 0
            ? `/sermon-admin/sermons/${i + 1}`
            : `/sermon-admin/sermons/${i + 1}/edit`
        }
      />,
    ],
  }));

  return (
    <div className="flex flex-col gap-5">
      <div className="grid grid-cols-1 gap-5 xl:grid-cols-[0.9fr_1.1fr]">
        <div className="grid grid-cols-2 gap-4">
          <StatCard title="Total Sermons" value="24" variant="blue" />
          <StatCard title="Draft Sermons" value="10" variant="white" />
        </div>
        <QuickAccess />
      </div>

      <DataCard
        title="Recent Activity"
        headers={['Sermon Title', 'Speaker', 'Series', 'Date', 'Status', 'Media', '']}
        rows={rows}
        filterOptions={['Published', 'Draft', 'Scheduled']}
        filterAll="All status"
      />
    </div>
  );
}
