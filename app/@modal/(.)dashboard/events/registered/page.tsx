import { RegisteredEvents } from '@/components/events/registered-events';
import { Suspense } from 'react';

export default function RegisteredEventsPageIntercept() {
  return (
    <Suspense fallback={null}>
      <RegisteredEvents isIntercepted />
    </Suspense>
  );
}
