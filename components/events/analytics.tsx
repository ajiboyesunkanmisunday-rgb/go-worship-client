'use client';

import { useState, useEffect } from 'react';
import { NotepadIcon2 } from '@/icons/notes';
import { cn } from '@/lib/utils';
import { Button } from '../ui/button';
import Link from 'next/link';
import { getSelfEvents } from '@/lib/api/tenant';
import { USE_LIVE_API } from '@/lib/api/config';

type AnalyticsCardProps = {
  title: string;
  value: string;
  className?: string;
  iconBgColor?: string;
  href: string;
};

function AnalyticsCard({
  title,
  value,
  className,
  href,
  iconBgColor,
}: AnalyticsCardProps) {
  return (
    <div
      className={cn(
        'w-full flex-1 aspect-344/113 md:aspect-377/192',
        'px-[28px] py-[23px] md:p-4 lg:px-[35.23px] lg:py-[30.17px]',
        'flex flex-col justify-start items-start gap-0',
        'rounded-[9.36px] md:rounded-[13.55px] relative',
        className
      )}
    >
      <div className="w-full flex flex-row justify-between items-center relative z-1">
        <span className="font-medium leading-[150%] tracking-[0%] text-[14px] lg:text-[16px]">
          {title}
        </span>

        <div
          className="shrink-0 size-[36px] lg:size-[45px] rounded-full flex justify-center items-center"
          style={{
            backgroundColor: iconBgColor ?? 'white',
          }}
        >
          <NotepadIcon2 />
        </div>
      </div>

      <p
        className={cn(
          'font-extrabold leading-[100%] tracking-[0%]',
          'text-[20px] lg:text-[40px] relative z-1 w-full',
          'truncate'
        )}
      >
        {value}
      </p>

      <div className="w-full flex justify-end items-center">
        <Button
          asChild
          size="sm"
          variant="outline"
          className="w-fit! px-4 py-1 rounded-full text-brand-blue border-brand-blue border no-underline"
        >
          <Link href={href}>View</Link>
        </Button>
      </div>
    </div>
  );
}

export function Analytics() {
  const [counts, setCounts] = useState(USE_LIVE_API ? { upcoming: 0, registered: 0, past: 0 } : { upcoming: 5, registered: 9, past: 4 });

  useEffect(() => {
    if (!USE_LIVE_API) return;
    getSelfEvents()
      .then((data) => {
        const upcoming = data.filter((e) => {
          const s = e.status.toLowerCase();
          return s.includes('upcoming') || s === 'active';
        }).length;
        const past = data.filter((e) => {
          const s = e.status.toLowerCase();
          return s.includes('past') || s.includes('completed') || s.includes('ended');
        }).length;
        const registered = data.length;
        setCounts({ upcoming, registered, past });
      })
      .catch(() => {});
  }, []);

  return (
    <div className="w-full flex flex-col justify-start items-start gap-10">
      <div
        className={cn(
          'w-full flex flex-col md:flex-row gap-6 justify-between items-start md:items-center'
        )}
      >
        <div className="flex flex-col justify-start items-start gap-4">
          <h1 className="text-[20px] md:text-[32px] leading-[100%] tracking-[0%] font-bold">
            My Event
          </h1>
          <p className="w-full md:max-w-[400px] lg:max-w-[580px] font-light leading-[150%] tracking-[0%] text-[16px]">
            Stay updated with upcoming gatherings, services, and church
            activities.
          </p>
        </div>

        {/* filter goes here */}
      </div>

      <div className="w-full grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-4">
        <AnalyticsCard
          title="Upcoming Events"
          value={String(counts.upcoming)}
          className="bg-[#E9F2FE]"
          href="/dashboard/events/upcoming"
        />
        <AnalyticsCard
          title="Registered Events"
          value={String(counts.registered)}
          className="bg-[#FFF7E9]"
          href="/dashboard/events/registered"
        />
        <AnalyticsCard
          title="Past Events"
          value={String(counts.past)}
          className="bg-[#FFFFFF]"
          iconBgColor="#F6F6F6"
          href="/dashboard/events/past"
        />
      </div>
    </div>
  );
}
