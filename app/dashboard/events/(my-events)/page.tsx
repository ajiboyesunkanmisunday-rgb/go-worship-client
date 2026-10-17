import { Analytics } from '@/components/events/analytics';
import { EventsList } from '@/components/events/events-list';
import { Suspense } from 'react';

export default function EventsPage() {
  return (
    <div className="w-full flex flex-col justify-start items-start gap-10">
      <Analytics />
      <Suspense fallback={<div>Loading events...</div>}>
        <EventsList />
      </Suspense>
    </div>
  );
}
