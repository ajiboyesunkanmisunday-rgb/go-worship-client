import { UpcomingEvents } from '@/components/events/upcoming-events';
import { Suspense } from 'react';

export default function UpcomingEventsPage() {
  return (
    <Suspense fallback={null}>
      <UpcomingEvents />
    </Suspense>
  );
}
