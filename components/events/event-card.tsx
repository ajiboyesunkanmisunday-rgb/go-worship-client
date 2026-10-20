import { MapPinIcon } from '@/icons/location';
import { NotepadIcon } from '@/icons/notes';
import { cn } from '@/lib/utils';
import { Event } from '@/types/event';
import { format } from 'date-fns';
import Image from 'next/image';
import Link from 'next/link';
import { Button } from '../ui/button';

type Props = {
  event: Event;
  isPast?: boolean;
};

export function EventCard({ event, isPast }: Props) {
  return (
    <article
      className={cn(
        'w-full md:min-h-[180px] p-4 border border-[#E0E0E0] rounded-[16px]',
        'flex justify-start items-center gap-5 lg:gap-6'
      )}
    >
      <Image
        src={event.eventImg}
        alt={event.name}
        width={225.43}
        height={164.64}
        className={cn(
          'shrink-0 w-[40%] aspect-square rounded-[11px] object-cover'
        )}
        unoptimized
      />

      <div className="w-full flex flex-col justify-start items-left gap-3">
        <p className="text-[#212121] md:text-[18px] leading-[96%] -tracking-[1%]">
          {event.name}
        </p>

        <p className="font-light text-[14px] md:text-[16px] leading-[137%] -tracking-[1%] line-clamp-2">
          Join us this Thursday for a mid week prayer, tagged “ Breaking the
          yoke of poverty”
        </p>

        <div className="w-full flex justify-start items-center gap-4">
          <span className="flex justify-start items-center gap-2">
            <NotepadIcon />
            <span className="text-[14px]">
              {format(event.eventDate, 'MMM d, yyyy')} | {event.eventTime}
            </span>
          </span>

          <span className="flex justify-start items-center gap-2">
            <MapPinIcon />
            <span className="text-[14px]">{event.location}</span>
          </span>
        </div>

        {isPast && <Button className="w-fit!">Download</Button>}
        {!isPast && event.registered && (
          <div
            className={cn(
              'h-[40px] px-6 py-2 bg-[#34A853] w-fit',
              'flex justify-center items-center text-white rounded-[8px]'
            )}
          >
            I&apos;m attending
          </div>
        )}
        {!isPast && !event.registered && (
          <div className="flex items-center gap-3">
            <Button variant="outline" asChild className="h-[40px] w-fit! px-6">
              <Link href={`/dashboard/events/${event.id}`} className="no-underline">
                Attend
              </Link>
            </Button>
            <Button asChild className="h-[40px] w-fit! px-6">
              <Link
                href={`/dashboard/events/${event.id}/register`}
                className="no-underline"
              >
                Register
              </Link>
            </Button>
          </div>
        )}
      </div>
    </article>
  );
}
