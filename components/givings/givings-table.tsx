'use client';

import { Giving } from '@/types/giving';
import { DataTable } from '../ui/data-table';
import { Button } from '../ui/button';
import Link from 'next/link';
import { ColumnDef, OnChangeFn, PaginationState } from '@tanstack/react-table';
import { format } from 'date-fns';
import { cn, formatCurrency } from '@/lib/utils';

const columns: ColumnDef<Giving>[] = [
  {
    header: 'Date',
    cell: (info) => info.getValue(),
    accessorFn: (row) => format(new Date(row.dateCreated), 'MMM d, yyyy'),
  },
  {
    header: 'Amount',
    cell: (info) => info.getValue(),
    accessorFn: (row) => formatCurrency(row.amount),
  },
  {
    header: 'Fund/Campaign',
    accessorKey: 'campaign',
  },
  {
    header: 'Payment Method',
    accessorKey: 'paymentMethod',
  },
  {
    header: 'Type',
    accessorKey: 'type',
  },
  {
    header: 'Status',
    cell: (info) => info.getValue(),
    accessorFn: (row) => {
      const key = row.status.toLowerCase();
      // The design labels a completed giving "Successful".
      const label =
        key === 'completed'
          ? 'Successful'
          : key === 'failed'
            ? 'Failed'
            : key === 'pending'
              ? 'Pending'
              : row.status;
      return (
        <span
          className={cn('font-medium', {
            'text-[#34A853]': key === 'completed',
            'text-[#EB0000]': key === 'failed',
            'text-[#FF8D28]': key === 'pending',
          })}
        >
          {label}
        </span>
      );
    },
  },
  {
    header: 'Receipt',
    cell: (info) => info.getValue(),
    accessorFn: (row) => (
      <Button
        className={cn(
          'roudned-full min-h-[34px] max-h-[34px] font-normal',
          'rounded-full text-[14px] leading-0'
        )}
        asChild
      >
        <Link scroll={false} href={`/dashboard/givings/${row.id}`}>
          Download
        </Link>
      </Button>
    ),
  },
];

type Props = {
  title: string;
  isLoading?: boolean;
  isFetching?: boolean;
  totalItems: number;
  pageCount: number;
  data: Giving[];
  pagination: PaginationState;
  setPagination: OnChangeFn<PaginationState>;
};

export function GivingsTable({
  title,
  isLoading,
  isFetching,
  totalItems,
  pageCount,
  data,
  pagination,
  setPagination,
}: Props) {
  return (
    <DataTable<Giving, keyof Giving>
      title={title}
      columns={columns}
      data={data}
      noDataMessage="You don't have any recent activity yet"
      pageCount={pageCount}
      pagination={pagination}
      setPagination={setPagination}
      totalItems={totalItems}
      isLoading={isLoading}
      isFetching={isFetching}
    />
  );
}
