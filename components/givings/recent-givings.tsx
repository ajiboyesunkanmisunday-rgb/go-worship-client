'use client';

import { Giving } from '@/types/giving';
import { usePaginationParams } from '@/hooks/use-pagination-params';
import { useEffect, useRef, useState } from 'react';
import { fetchPaginatedGivings } from '@/data/givings';
import { GivingsTable } from './givings-table';

export function RecentGivings() {
  const { pagination, setPagination } = usePaginationParams();
  const [data, setData] = useState<Giving[]>([]);
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

        const response = await fetchPaginatedGivings(pageIndex, pageSize);

        setData(response.data);
        setTotalItems(response.totalItems);
        setPageCount(response.pageCount);
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
    <GivingsTable
      title="Recent Giving"
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
