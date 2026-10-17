import { StatCard } from '@/components/ministry/shared';
import { ClipboardList, Plus, SquareCheckBig } from 'lucide-react';
import { DataPanel, QuickAccessCard, type TableRow } from './shared';

const GREEN_ICON =
  'flex size-10 items-center justify-center rounded-full bg-[#22a45d] text-white';

export function QuickAccess() {
  return (
    <div className="rounded-[14px] bg-white p-5">
      <h2 className="text-[16px] font-bold">Quick Access</h2>
      <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
        <QuickAccessCard
          href="/group-leader/groups/create"
          title="Create Group"
          subtitle="Click here to create group"
          icon={
            <span className={GREEN_ICON}>
              <Plus className="size-5" />
            </span>
          }
        />
        <QuickAccessCard
          href="/group-leader/members"
          title="View Member List"
          subtitle="Click here to view member"
          icon={
            <span className={GREEN_ICON}>
              <SquareCheckBig className="size-5" />
            </span>
          }
        />
        <QuickAccessCard
          href="/group-leader/engagement"
          title="Attendance"
          subtitle="Click here to view attendance"
          icon={
            <span className={GREEN_ICON}>
              <ClipboardList className="size-5" />
            </span>
          }
        />
      </div>
    </div>
  );
}

const MEMBERS: TableRow[] = Array.from({ length: 5 }, () => ({
  cells: ['John Doe', '08035678923', 'john@mail.com', 'Jan 2025'],
  status: 'Active' as const,
}));

export function GroupLeaderDashboard() {
  return (
    <div className="flex flex-col gap-5">
      <div className="grid grid-cols-1 gap-5 xl:grid-cols-[1.1fr_1.3fr]">
        {/* Hello card */}
        <div className="relative overflow-hidden rounded-[14px] bg-white p-6">
          <h1 className="text-[28px] font-bold lg:text-[32px]">Hello Mercy 👋</h1>
          <p className="mt-2 max-w-[300px] text-[14px] text-brand-gray-500">
            Welcome to Celebration Church International Go worship Platform
          </p>
          <span className="pointer-events-none absolute -right-10 top-8 size-[220px] rounded-full border-[6px] border-[#e7f7ee]" />
          <span className="pointer-events-none absolute right-16 top-24 size-[140px] rounded-full border-[6px] border-[#d4f0df]" />
        </div>

        <QuickAccess />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard title="Total Groups" value="24" variant="blue" />
        <StatCard title="Total Member" value="430" variant="white" />
        <StatCard title="New Members" value="15" variant="white" />
        <StatCard title="Recent Attendance" value="10" variant="white" />
      </div>

      <DataPanel
        title="Member List"
        columns={['Name', 'Phone', 'Email', 'Join Date']}
        rows={MEMBERS}
      />
    </div>
  );
}
