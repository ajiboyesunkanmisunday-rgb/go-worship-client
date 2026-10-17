import { cn } from '@/lib/utils';
import { FolderClosed, Plus } from 'lucide-react';
import Link from 'next/link';
import { SmartTable, type SmartRow } from '@/components/shared/smart-table';

/* ---------------- Quick Access ---------------- */

function QuickCard({
  icon,
  title,
  subtitle,
  href,
}: {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  href: string;
}) {
  return (
    <Link
      href={href}
      className="flex items-center gap-3 rounded-[12px] border border-[#f0f0f0] bg-white p-4 no-underline transition-colors hover:bg-[#f4f7ff]"
    >
      {icon}
      <div>
        <p className="text-[14px] font-semibold text-brand-blue">{title}</p>
        <p className="text-[11px] text-brand-gray-500">{subtitle}</p>
      </div>
    </Link>
  );
}

export function QuickAccess() {
  return (
    <div className="rounded-[14px] bg-white p-5">
      <h2 className="text-[16px] font-bold">Quick Access</h2>
      <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
        <QuickCard
          href="/sermon-admin/media"
          title="Uploaded Media"
          subtitle="2.3GB · 40 items"
          icon={
            <span className="flex size-9 items-center justify-center rounded-[8px] bg-[#ff8d28]">
              <FolderClosed className="size-5 text-white" />
            </span>
          }
        />
        <QuickCard
          href="/sermon-admin/sermons/create"
          title="Add new Sermon"
          subtitle="Click here to add sermons"
          icon={
            <span className="flex size-9 items-center justify-center rounded-[8px] bg-[#22a45d]">
              <Plus className="size-5 text-white" />
            </span>
          }
        />
        <QuickCard
          href="/sermon-admin/series"
          title="Create new series"
          subtitle="Click here to create series"
          icon={
            <span className="flex size-9 items-center justify-center rounded-[8px] bg-[#22a45d]">
              <Plus className="size-5 text-white" />
            </span>
          }
        />
      </div>
    </div>
  );
}

/* ---------------- Status text ---------------- */

const STATUS_COLOR: Record<string, string> = {
  Published: 'text-[#34a853]',
  Active: 'text-[#34a853]',
  Uploading: 'text-[#ff8d28]',
  Inactive: 'text-[#ff8d28]',
  Scheduled: 'text-brand-blue',
  Draft: 'text-[#eb0000]',
};

export function StatusText({ value }: { value: string }) {
  return (
    <span className={cn('font-medium', STATUS_COLOR[value] ?? 'text-[#333]')}>
      {value}
    </span>
  );
}

/* ---------------- Data card (SmartTable wrapper) ---------------- */

export function DataCard({
  title,
  headers,
  rows,
  filterOptions,
  filterAll,
  showSearch = true,
  sortToggle = false,
}: {
  title: string;
  headers: string[];
  rows: SmartRow[];
  filterOptions?: string[];
  filterAll?: string;
  showSearch?: boolean;
  sortToggle?: boolean;
}) {
  return (
    <SmartTable
      title={title}
      headers={headers}
      rows={rows}
      filterOptions={filterOptions}
      filterAll={filterAll}
      showSearch={showSearch}
      sortToggle={sortToggle}
      exportLabel="Export CVS"
      headerRowClassName="bg-[#f7f9fc]"
    />
  );
}

/* ---------------- Row action ---------------- */

export function ViewEditButton({
  variant,
  href,
}: {
  variant: 'view' | 'edit';
  href?: string;
}) {
  const className = cn(
    'flex h-8 w-[52px] items-center justify-center rounded-[6px] text-[11px] text-white no-underline',
    variant === 'view' ? 'bg-brand-blue' : 'bg-brand-gray-300'
  );
  const label = variant === 'view' ? 'View' : 'Edit';

  if (href) {
    return (
      <Link href={href} className={className}>
        {label}
      </Link>
    );
  }
  return (
    <button type="button" className={className}>
      {label}
    </button>
  );
}
