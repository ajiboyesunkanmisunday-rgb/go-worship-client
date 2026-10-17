import { EventDetail } from '@/components/events/event-detail';
import { Suspense } from 'react';

type Props = {
  params: Promise<{ id: string }>;
};

export default async function EventDetailsPage({ params }: Props) {
  const { id } = await params;

  return (
    <Suspense fallback={null}>
      <EventDetail id={id} />
    </Suspense>
  );
}
