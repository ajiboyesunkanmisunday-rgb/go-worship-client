import { StatCard } from '@/components/ministry/shared';
import { QuickAccess } from '@/components/group-leader/dashboard';
import { DataPanel, type TableRow } from '@/components/group-leader/shared';

const MEMBERS: TableRow[] = Array.from({ length: 5 }, () => ({
  cells: ['John Doe', '08035678923', 'john@mail.com', 'Jan 2025'],
  status: 'Active' as const,
}));

export default function GroupLeaderMembersPage() {
  return (
    <div className="flex flex-col gap-5">
      <div className="grid grid-cols-1 gap-5 xl:grid-cols-[0.55fr_1.45fr]">
        <div className="grid grid-cols-2 gap-4">
          <StatCard title="Total Members" value="430" variant="blue" />
          <StatCard title="Active members" value="43" variant="white" />
        </div>
        <QuickAccess />
      </div>

      <DataPanel
        title="Member List"
        columns={['Name', 'Phone', 'Email', 'Join Date']}
        rows={MEMBERS}
      />
    </div>
  );
}
