'use client';

import { useMemo, useState, useEffect } from 'react';
import { SheetPage } from '../ui/sheet-page';
import { cn } from '@/lib/utils';
import { events as MOCK_EVENTS } from '@/data/events';
import { EventCard } from './event-card';
import { getSelfEvents, TenantEvent } from '@/lib/api/tenant';
import { USE_LIVE_API } from '@/lib/api/config';
import type { Event } from '@/types/event';

function mapTenantEvent(e: TenantEvent): Event {
  return {
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
  };
}

type Props = {
  isIntercepted?: boolean;
};

export function PastEvents({ isIntercepted = false }: Props) {
  const returnUrl = useMemo(
    () => (isIntercepted ? undefined : '/dashboard/events'),
    [isIntercepted]
  );
  const [events, setEvents] = useState<Event[]>(MOCK_EVENTS.slice(0, 6));

  useEffect(() => {
    if (!USE_LIVE_API) return;
    getSelfEvents()
      .then((data) => {
        const past = data
          .filter((e) => {
            const s = e.status.toLowerCase();
            return s.includes('past') || s.includes('completed') || s.includes('ended');
          })
          .map(mapTenantEvent);
        if (past.length > 0) setEvents(past);
      })
      .catch(() => {});
  }, []);

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
            Past Events
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
            <EventCard key={event.id} event={event} isPast />
          ))}
        </div>
      </div>
    </SheetPage>
  );
}
