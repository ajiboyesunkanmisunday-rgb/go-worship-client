import { StatCard } from '@/components/ministry/shared';
import { seriesRows, SERIES_STATUSES } from '@/components/sermon-admin/dashboard';
import { DataCard, QuickAccess } from '@/components/sermon-admin/shared';

export default function SermonAdminSeriesPage() {
  return (
    <div className="flex flex-col gap-5">
      <div className="grid grid-cols-1 gap-5 xl:grid-cols-[0.9fr_1.1fr]">
        <div className="grid grid-cols-2 gap-4">
          <StatCard title="Total Series" value="24" variant="blue" />
          <StatCard title="Draft Sermons" value="10" variant="white" />
        </div>
        <QuickAccess />
      </div>

      <DataCard
        title="Recent Activity"
        headers={['Series Name', 'Description', 'No. of Sermons', 'Status', 'Created On', '']}
        rows={seriesRows()}
        filterOptions={SERIES_STATUSES}
        filterAll="All status"
      />
    </div>
  );
}
