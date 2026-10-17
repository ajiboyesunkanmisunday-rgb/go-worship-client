import { StatCard } from '@/components/ministry/shared';
import { QuickAccess } from '@/components/group-leader/dashboard';
import { DataPanel } from '@/components/group-leader/shared';
import { GROUP_ROWS } from '@/components/group-leader/groups-data';

export default function GroupLeaderGroupsPage() {
  return (
    <div className="flex flex-col gap-5">
      <div className="grid grid-cols-1 gap-5 xl:grid-cols-[0.55fr_1.45fr]">
        <div className="grid grid-cols-2 gap-4">
          <StatCard title="Total Groups" value="24" variant="blue" />
          <StatCard title="Total Member" value="430" variant="white" />
        </div>
        <QuickAccess />
      </div>

      <DataPanel
        title="All Groups"
        columns={['Group Name', 'Category', 'Leader', 'Meeting Day & Time', 'Members']}
        rows={GROUP_ROWS}
      />
    </div>
  );
}
