'use client';

import { cn } from '@/lib/utils';
import { GroupActivity } from '@/types/groups';
import { ColumnDef, OnChangeFn, PaginationState } from '@tanstack/react-table';
import { format } from 'date-fns';
import { DataTable } from '../ui/data-table';
import { usePaginationParams } from '@/hooks/use-pagination-params';
import { useEffect, useRef, useState } from 'react';
import { fetchPaginatedGroupActivities } from '@/data/groups';
import { getSelfGroupActivities } from '@/lib/api/tenant';
import { USE_LIVE_API } from '@/lib/api/config';

const TOPICS = [
  'Prayer & Study',
  'Worship Night',
  'Service',
  'Bible Study',
  'Fellowship',
];

const columns: ColumnDef<GroupActivity>[] = [
  {
    header: 'Date',
    cell: (info) => info.getValue(),
    accessorFn: (row) => format(new Date(row.date), 'MMM d, yyyy'),
  },
  {
    header: 'Time',
    cell: (info) => info.getValue(),
    accessorFn: (row) => row.time,
  },
  {
    header: 'Location',
    accessorKey: 'location',
  },
  {
    header: 'Topic',
    accessorFn: (row) =>
      row.topic ?? TOPICS[(Number(row.id) - 1) % TOPICS.length],
  },
  {
    header: 'Status',
    accessorKey: 'status',
    cell: (info) => info.getValue(),
    accessorFn: (row) => (
      <span
        className={cn('capitalize', {
          'text-[#FF8D28]': row.status.toLowerCase() === 'upcoming',
          'text-[#34A853]': row.status.toLowerCase() === 'completed',
          'text-[#EB0000]': row.status.toLowerCase() === 'cancelled',
        })}
      >
        {row.status.toLowerCase()}
      </span>
    ),
  },
];

type GroupActivitiesTableProps = {
  title: string;
  isLoading?: boolean;
  isFetching?: boolean;
  totalItems: number;
  pageCount: number;
  data: GroupActivity[];
  pagination: PaginationState;
  setPagination: OnChangeFn<PaginationState>;
};

function GroupActivitiesTable({
  title,
  isLoading,
  isFetching,
  totalItems,
  pageCount,
  data,
  pagination,
  setPagination,
}: GroupActivitiesTableProps) {
  return (
    <DataTable<GroupActivity, keyof GroupActivity>
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

export function AllGroupActivities() {
  const { pagination, setPagination } = usePaginationParams();
  const [data, setData] = useState<GroupActivity[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isFetching, setIsFetching] = useState(false);
  const [totalItems, setTotalItems] = useState(0);
  const [pageCount, setPageCount] = useState(0);
  const isInitialLoad = useRef(true);

  useEffect(() => {
    const loadData = async () => {
      if (isInitialLoad.current) {
        setIsLoading(true);
        isInitialLoad.current = false;
      } else {
        setIsFetching(true);
      }

      try {
        const pageIndex = pagination?.pageIndex ?? 0;
        const pageSize = pagination?.pageSize ?? 10;

        if (USE_LIVE_API) {
          const all = await getSelfGroupActivities();
          const start = pageIndex * pageSize;
          setData(all.slice(start, start + pageSize));
          setTotalItems(all.length);
          setPageCount(Math.ceil(all.length / pageSize));
        } else {
          const response = await fetchPaginatedGroupActivities(pageIndex, pageSize);
          setData(response.data);
          setTotalItems(response.totalItems);
          setPageCount(response.pageCount);
        }
      } catch (error) {
        console.error('Error fetching givings:', error);
      } finally {
        setIsLoading(false);
        setIsFetching(false);
      }
    };

    // Only load if pagination is defined
    if (pagination) {
      loadData();
    }
  }, [pagination]);

  return (
    <GroupActivitiesTable
      title="Group Activities"
      isLoading={isLoading}
      isFetching={isFetching}
      totalItems={totalItems}
      pageCount={pageCount}
      data={data}
      pagination={pagination}
      setPagination={setPagination}
    />
  );
}
