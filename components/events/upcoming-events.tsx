'use client';

import { useMemo } from 'react';
import { SheetPage } from '../ui/sheet-page';
import { cn } from '@/lib/utils';
import { events } from '@/data/events';
import { EventCard } from './event-card';

type Props = {
  isIntercepted?: boolean;
};

export function UpcomingEvents({ isIntercepted = false }: Props) {
  const returnUrl = useMemo(
    () => (isIntercepted ? undefined : '/dashboard/events'),
    [isIntercepted]
  );

  return (
    <SheetPage className="w-full max-w-[700px]! gap-0" backLink={returnUrl}>
      <div
        className={cn(
          'w-full h-full flex flex-col justify-start items-center gap-6 md:gap-10',
          'px-6 pt-[50px] md:pt-[80px] md:px-[40px] pb-6 overflow-y-auto'
        )}
      >
        <div className="w-full flex flex-col justify-start items-center gap-4">
          <h2
            className={cn(
              'text-[#212121] text-center text-[20px] md:text-[32px]',
              'font-bold font-poppins leading-[109%] tracking-[-1%]'
            )}
          >
            Upcoming Events
          </h2>
          <p
            className={cn(
              'font-poppins font-light text-center text-[18px]',
              'leading-[149%] tracking-[0%] max-w-[332px] md:max-w-[427px]'
            )}
          >
            Stay updated with upcoming gatherings, services, and church
            activities.
          </p>
        </div>

        <div className="w-full flex flex-col justify-start items-start gap-6">
          {events.map((event) => (
            <EventCard key={event.id} event={event} />
          ))}
        </div>
      </div>
    </SheetPage>
  );
}
