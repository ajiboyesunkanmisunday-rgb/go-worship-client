import { RegisteredEvents } from '@/components/events/registered-events';
import { Suspense } from 'react';

export default function RegisteredEventsPage() {
  return (
    <Suspense fallback={null}>
      <RegisteredEvents />
    </Suspense>
  );
}
