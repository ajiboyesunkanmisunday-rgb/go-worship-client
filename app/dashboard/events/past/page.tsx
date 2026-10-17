import { PastEvents } from '@/components/events/past-events';
import { Suspense } from 'react';

export default function PastEventsPage() {
  return (
    <Suspense fallback={null}>
      <PastEvents />
    </Suspense>
  );
}
