import { cn } from '@/lib/utils';
import { SmartTable, type SmartRow } from '@/components/shared/smart-table';
import { ArrowUpRight, CheckSquare, NotebookText, Plus } from 'lucide-react';
import Link from 'next/link';

export function StatCard({
  title,
  value,
  variant = 'light',
}: {
  title: string;
  value: string;
  variant?: 'light' | 'purple';
}) {
  const purple = variant === 'purple';
  return (
    <div
      className={cn(
        'relative flex min-h-[210px] flex-col justify-between overflow-hidden rounded-[18px] p-6',
        purple ? 'text-white' : 'bg-white'
      )}
      style={
        purple
          ? {
              backgroundImage:
                'linear-gradient(-34deg, #460e70 3.7%, #454ae3 128%)',
            }
          : undefined
      }
    >
      <div className="flex items-start justify-between">
        <p
          className={cn(
            'font-poppins text-[19px]',
            purple ? 'text-white' : 'text-[#333]'
          )}
        >
          {title}
        </p>
        <span
          className={cn(
            'flex size-[52px] shrink-0 items-center justify-center rounded-full',
            purple ? 'bg-white/15' : 'bg-brand-blue/10'
          )}
        >
          <ArrowUpRight
            className={cn('size-6', purple ? 'text-white' : 'text-brand-blue')}
          />
        </span>
      </div>
      <p
        className={cn(
          'text-[48px] font-semibold lg:text-[55px]',
          purple ? 'text-white' : 'text-brand-blue'
        )}
      >
        {value}
      </p>
      <p
        className={cn(
          'font-poppins text-[12px] font-light',
          purple ? 'text-white' : 'text-[#3e3e3e]'
        )}
      >
        40% Increased from Last month
      </p>
    </div>
  );
}

const QUICK_ACTIONS = [
  {
    title: 'Create Event',
    subtitle: 'Click here to create Events',
    href: '/ministry-admin/events/create',
    icon: (
      <span className="flex size-9 items-center justify-center rounded-full bg-[#22a45d]">
        <Plus className="size-5 text-white" />
      </span>
    ),
  },
  {
    title: 'Check-in',
    subtitle: 'Click here to check in',
    href: '/ministry-admin/check-in',
    icon: <CheckSquare className="size-8 text-brand-blue" />,
  },
  {
    title: 'Attendance',
    subtitle: 'Click here to view attendance',
    href: '/ministry-admin/attendance',
    icon: <NotebookText className="size-8 text-brand-blue" />,
  },
];

export function QuickAccessCard() {
  return (
    <div className="rounded-[15px] bg-white p-6">
      <h2 className="text-[18px] font-semibold">Quick Access</h2>
      <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
        {QUICK_ACTIONS.map((a) => (
          <Link
            key={a.title}
            href={a.href}
            className="flex flex-col gap-3 rounded-[9px] border border-[#eaeaea] p-4 no-underline transition-colors hover:bg-[#f8fbff]"
          >
            {a.icon}
            <div>
              <p className="font-poppins text-[16px] font-medium text-brand-blue">
                {a.title}
              </p>
              <p className="mt-1 font-poppins text-[12px] text-[#333]">
                {a.subtitle}
              </p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}

const STATUS_COLORS: Record<string, string> = {
  Upcoming: 'text-brand-blue',
  Completed: 'text-[#34a853]',
  Reoccurring: 'text-[#ff8d28]',
  Ongoing: 'text-[#ff8d28]',
  Cancelled: 'text-[#eb0000]',
};

export type EventRow = {
  name: string;
  date: string;
  location: string;
  registrations: string;
  status: string;
};

export function EventsTable({
  title,
  rows,
  actionLabel = 'View',
}: {
  title: string;
  rows: EventRow[];
  actionLabel?: string;
}) {
  const smartRows: SmartRow[] = rows.map((e) => ({
    group: e.status,
    text: [e.name, e.date, e.location, e.registrations, e.status],
    cells: [
      <span key="n" className="font-poppins text-[12px] font-light">{e.name}</span>,
      <span key="d" className="font-poppins text-[12px] font-light">{e.date}</span>,
      <span key="l" className="font-poppins text-[12px] font-light">{e.location}</span>,
      <span key="r" className="font-poppins text-[12px] font-light text-[#3e3e3e]">{e.registrations}</span>,
      <span
        key="s"
        className={cn(
          'font-poppins text-[12px] font-light',
          STATUS_COLORS[e.status] ?? 'text-[#3e3e3e]'
        )}
      >
        {e.status}
      </span>,
      <Link
        key="a"
        href="/ministry-admin/events/create"
        className="flex h-8 w-[70px] items-center justify-center rounded-[5px] bg-brand-blue text-[11px] text-white no-underline"
      >
        {actionLabel}
      </Link>,
    ],
  }));

  return (
    <SmartTable
      title={title}
      headers={['Event Name', 'Date & Time', 'Location', 'Registrations', 'Status', 'Action']}
      rows={smartRows}
      filterOptions={['Last 7 days', '30 days', '1 year']}
      filterAll="Today"
      filterByGroup={false}
      headerRowClassName="bg-[#f3f6ff]"
    />
  );
}
