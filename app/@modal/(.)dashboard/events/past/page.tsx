import { PastEvents } from '@/components/events/past-events';
import { Suspense } from 'react';

export default function PastEventsPageIntercept() {
  return (
    <Suspense fallback={null}>
      <PastEvents isIntercepted />
    </Suspense>
  );
}
