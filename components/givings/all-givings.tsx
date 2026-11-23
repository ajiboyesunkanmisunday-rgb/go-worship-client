'use client';

import { Giving } from '@/types/giving';
import { usePaginationParams } from '@/hooks/use-pagination-params';
import { useEffect, useRef, useState } from 'react';
import { getCustomerPayments, paymentToGiving, type PaymentResponse } from '@/lib/api/customer';
import { GivingsTable } from './givings-table';

function mapPaymentToGiving(p: PaymentResponse): Giving {
  const base = paymentToGiving(p);
  const rawStatus = base.status.toUpperCase();
  const status =
    rawStatus === 'SUCCEEDED' ? 'Completed' :
    rawStatus === 'FAILED'    ? 'Failed' :
    rawStatus === 'CANCELED' || rawStatus === 'EXPIRED' ? 'Cancelled' : 'Pending';
  return {
    id: base.id,
    amount: base.amount,
    campaign: base.purpose,
    paymentMethod: (p.gatewayType as string) || '—',
    type: ((p as Record<string, unknown>)['donationType'] as string) || '—',
    status,
    dateCreated: base.date || new Date().toISOString(),
  };
}

export function AllGivings() {
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

        const page = await getCustomerPayments(pageIndex, pageSize);
        const content = page.content ?? [];
        setData(content.map(mapPaymentToGiving));
        setTotalItems(page.totalElements ?? content.length);
        setPageCount(page.totalPages ?? Math.ceil((page.totalElements ?? content.length) / pageSize));
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
      title="Giving History"
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
