'use client';
import { Analytics } from '@/components/home/analytics';
import { RecentGivings } from '@/components/givings/recent-givings';
import { Suspense } from 'react';

export default function DashboardPage() {
  return (
    <div className="w-full flex flex-col justify-start items-start gap-10">
      <Analytics />
      <Suspense fallback={null}>
        <RecentGivings />
      </Suspense>
    </div>
  );
}
