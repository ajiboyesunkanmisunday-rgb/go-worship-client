'use client';

import { AllGivings } from '@/components/givings/all-givings';
import { GivingsChart } from '@/components/givings/givings-chart';
import { cn } from '@/lib/utils';
import { Suspense } from 'react';

export default function GivingsPage() {
  return (
    <div className="w-full flex flex-col justify-start items-start gap-10">
      <div
        className={cn(
          'w-full flex flex-col md:flex-row gap-6 justify-between items-start md:items-center'
        )}
      >
        <div className="flex flex-col justify-start items-start gap-4">
          <h1 className="text-[20px] md:text-[32px] leading-[100%] tracking-[0%] font-bold">
            My Giving
          </h1>
          <p className="w-full md:max-w-[300px] lg:max-w-[455px] font-light leading-[150%] tracking-[0%] text-[16px] text-brand-gray-500">
            Here are the statistics of all your giving to the church
          </p>
        </div>

        {/* filter goes here */}
      </div>

      <Suspense fallback={null}>
        <GivingsChart />
      </Suspense>

      <Suspense fallback={null}>
        <AllGivings />
      </Suspense>
    </div>
  );
}
