'use client';

import { useMemo, useState, useEffect } from 'react';
import { SheetPage } from '../ui/sheet-page';
import { cn } from '@/lib/utils';
import { EventCard } from './event-card';
import { getSelfEvents, TenantEvent } from '@/lib/api/tenant';
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

export function UpcomingEvents({ isIntercepted = false }: Props) {
  const returnUrl = useMemo(
    () => (isIntercepted ? undefined : '/dashboard/events'),
    [isIntercepted]
  );
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getSelfEvents()
      .then((data) => {
        const upcoming = data
          .filter((e) => e.status.toLowerCase().includes('upcoming') || e.status.toLowerCase() === 'active')
          .map(mapTenantEvent);
        setEvents(upcoming);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
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
          {loading ? (
            <p className="w-full text-center text-[14px] text-brand-gray-400">Loading events…</p>
          ) : events.length === 0 ? (
            <p className="w-full text-center text-[14px] text-brand-gray-400">No upcoming events.</p>
          ) : events.map((event) => (
            <EventCard key={event.id} event={event} />
          ))}
        </div>
      </div>
    </SheetPage>
  );
}
