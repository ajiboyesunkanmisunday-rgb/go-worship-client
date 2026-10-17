import { EventDetail } from '@/components/events/event-detail';
import { Suspense } from 'react';

type Props = {
  params: Promise<{ id: string }>;
};

export default async function EventDetailsPageIntercept({ params }: Props) {
  const { id } = await params;

  return (
    <Suspense fallback={null}>
      <EventDetail isIntercepted id={id} />
    </Suspense>
  );
}
