'use client';

import { cn } from '@/lib/utils';
import { Event } from '@/types/event';
import { ColumnDef } from '@tanstack/react-table';
import { format } from 'date-fns';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useRef } from 'react';
import { usePaginationParams } from '@/hooks/use-pagination-params';
import { DataTable } from '../ui/data-table';
import { fetchPaginatedEvents } from '@/data/events';
import { getSelfEvents } from '@/lib/api/tenant';
import { USE_LIVE_API } from '@/lib/api/config';

export function EventsList() {
  const { pagination, setPagination } = usePaginationParams();
  const [data, setData] = useState<Event[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isFetching, setIsFetching] = useState(false);
  const [totalItems, setTotalItems] = useState(0);
  const [pageCount, setPageCount] = useState(0);
  const isInitialLoad = useRef(true);

  const columns: ColumnDef<Event>[] = [
    {
      header: 'Event Name',
      accessorKey: 'name',
    },
    {
      header: 'Date & Time',
      cell: (info) => info.getValue(),
      accessorFn: (event) =>
        `${format(new Date(`${event.eventDate}T${event.eventTime}`), 'MMM d, yyyy')} • ${format(
          new Date(`${event.eventDate}T${event.eventTime}`),
          'h:mm a'
        )}`,
    },
    {
      header: 'Location',
      accessorKey: 'location',
    },
    {
      header: 'Type',
      accessorKey: 'type',
    },
    {
      header: 'Status',
      cell: (info) => info.getValue(),
      accessorFn: (event) => (
        <span className={cn('capitalize')}>{event.status}</span>
      ),
    },
    {
      header: 'Action',
      cell: (info) => info.getValue(),
      accessorFn: (event) =>
        event.registered ? (
          <Link
            href={`/dashboard/events/${event.id}`}
            className="font-medium text-brand-blue no-underline hover:underline"
          >
            View
          </Link>
        ) : (
          <Link
            href={`/dashboard/events/${event.id}/register`}
            className="font-medium text-[#22A45D] no-underline hover:underline"
          >
            Register
          </Link>
        ),
    },
  ];

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
          const all = await getSelfEvents();
          const mapped: Event[] = all.map((e) => ({
            id: e.id,
            name: e.name,
            eventDate: e.eventDate,
            eventTime: e.eventTime || '00:00',
            location: e.location,
            type: e.type,
            status: e.status.toLowerCase(),
            createdAt: e.createdAt,
            registered: true,
            eventImg: '',
          }));
          const start = pageIndex * pageSize;
          setData(mapped.slice(start, start + pageSize));
          setTotalItems(mapped.length);
          setPageCount(Math.ceil(mapped.length / pageSize));
        } else {
          const response = await fetchPaginatedEvents(pageIndex, pageSize);
          setData(response.data);
          setTotalItems(response.totalItems);
          setPageCount(response.pageCount);
        }
      } catch (error) {
        console.error('Error fetching events:', error);
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
    <DataTable<Event, keyof Event>
      title="Recent events"
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
