'use client';

import { useMemo, useState, useEffect } from 'react';
import { SheetPage } from '../ui/sheet-page';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import { fetchEvent } from '@/data/events';
import type { Event } from '@/types/event';
import { NoDataPlaceholder } from '../ui/no-data-placeholder';
import { Button } from '../ui/button';
import { getSelfEvent } from '@/lib/api/tenant';
import { USE_LIVE_API } from '@/lib/api/config';

type Props = {
  isIntercepted?: boolean;
  id: string;
};

export function EventDetail({ isIntercepted = false, id }: Props) {
  const returnUrl = useMemo(
    () => (isIntercepted ? undefined : '/dashboard/events'),
    [isIntercepted]
  );

  const mockEvent = useMemo(() => fetchEvent(id), [id]);
  const [event, setEvent] = useState<Event | null>(mockEvent ?? null);

  useEffect(() => {
    if (!USE_LIVE_API) return;
    getSelfEvent(id).then((e) => {
      if (!e) return;
      setEvent({
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
      });
    }).catch(() => {});
  }, [id]);

  let content = null;
  if (event) {
    content = (
      <>
        <Image
          src="/Layer_1.svg"
          alt="Church Logo"
          width={174}
          height={30.72}
          className="shrink-0 aspect-174/30.72 w-[146px] md:w-[174px]"
        />

        <Image
          src="/Frame 1321316418.png"
          alt="Event Image"
          width={528}
          height={408}
          className={cn(
            'w-full asepct-367/279 md:aspect-528/408 rounded-[17.69px] md:rounded-[25.87px]'
          )}
        />

        <div className="w-full flex flex-col justify-start items-start gap-4">
          <h1 className="font-medium text-[18px] md:text-[22px] leading-[119%] tracking-[0%]">
            {event.name}
          </h1>

          <p className="leading-[128%] tracking-[0%] text-justify">
            Midweek Recharge is a refreshing midweek gathering designed to
            strengthen your faith, refuel your spirit, and refocus your heart on
            God. Through passionate worship, practical teachings, and heartfelt
            prayers, it helps believers stay spiritually energized for the rest
            of the week.
          </p>
        </div>

        <div className="w-full flex flex-col justify-start items-start gap-4">
          {event.registered && (
            <span
              className={cn(
                'h-[20px] md:h-[45.8px] px-6 py-4 bg-[#34A853] font-medium',
                'flex justify-center items-center text-white rounded-[8px]'
              )}
            >
              I&apos;m Attending
            </span>
          )}

          {!event.registered && (
            <Button className="w-full font-medium text-[18px]!" size="lg">
              Register
            </Button>
          )}
        </div>
      </>
    );
  }

  if (!event) {
    content = (
      <NoDataPlaceholder
        message="Sorry, we couldn't find the event you were looking for."
        color="#243F84"
        iconClassName="size-[45px]"
      />
    );
  }

  return (
    <SheetPage className="w-full max-w-[600px]! gap-0" backLink={returnUrl}>
      <div
        className={cn(
          'w-full h-full flex flex-col justify-start items-center gap-6 md:gap-10',
          'px-6 pt-[50px] md:pt-[80px] md:px-[60px] pb-6'
        )}
      >
        {content}
      </div>
    </SheetPage>
  );
}
