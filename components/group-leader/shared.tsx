'use client';

import { cn } from '@/lib/utils';
import { SmartTable, type SmartRow } from '@/components/shared/smart-table';
import Link from 'next/link';

/* ---------------- Quick access ---------------- */

export function QuickAccessCard({
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
      className="flex flex-col gap-3 rounded-[14px] bg-white p-5 no-underline transition-colors hover:bg-[#f4f7ff]"
    >
      {icon}
      <div>
        <p className="text-[15px] font-semibold text-brand-blue">{title}</p>
        <p className="text-[12px] text-brand-gray-500">{subtitle}</p>
      </div>
    </Link>
  );
}

/* ---------------- Filterable data table ---------------- */

export type TableRow = {
  cells: string[];
  status: 'Active' | 'Inactive';
  href?: string;
  group?: string;
};

const GROUP_FILTERS = ['Choir', 'Youth Fellowship', "Men's Group", 'Women Group'];

export function DataPanel({
  title,
  columns,
  rows,
}: {
  title: string;
  columns: string[];
  rows: TableRow[];
}) {
  const smartRows: SmartRow[] = rows.map((row, i) => ({
    group: row.group,
    text: [...row.cells, row.status],
    cells: [
      ...row.cells.map((c, j) => (
        <span key={j} className={cn(j === 0 && 'font-medium')}>
          {c}
        </span>
      )),
      <span
        key="status"
        className={cn(
          'font-medium',
          row.status === 'Active' ? 'text-[#34a853]' : 'text-[#eb0000]'
        )}
      >
        {row.status}
      </span>,
      row.href ? (
        <Link
          key="action"
          href={row.href}
          className={cn(
            'flex h-8 w-[52px] items-center justify-center rounded-[6px] text-[11px] text-white no-underline',
            i < 2 ? 'bg-brand-blue' : 'bg-brand-gray-300'
          )}
        >
          View
        </Link>
      ) : (
        <span
          key="action"
          className={cn(
            'flex h-8 w-[52px] items-center justify-center rounded-[6px] text-[11px] text-white',
            i < 2 ? 'bg-brand-blue' : 'bg-brand-gray-300'
          )}
        >
          View
        </span>
      ),
    ],
  }));

  return (
    <SmartTable
      title={title}
      headers={[...columns, 'Status', 'Action']}
      rows={smartRows}
      filterOptions={GROUP_FILTERS}
      filterAll="All groups"
    />
  );
}
