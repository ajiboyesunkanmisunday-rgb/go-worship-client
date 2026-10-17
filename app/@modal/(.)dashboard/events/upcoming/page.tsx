import { UpcomingEvents } from '@/components/events/upcoming-events';
import { Suspense } from 'react';

export default function UpcomingEventsPageIntercept() {
  return (
    <Suspense fallback={null}>
      <UpcomingEvents isIntercepted />
    </Suspense>
  );
}
