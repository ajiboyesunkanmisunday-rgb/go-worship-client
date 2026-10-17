import { GivingsDetail } from '@/components/givings/givings-detail';
import { Suspense } from 'react';

type Props = {
  params: Promise<{ id: string }>;
};

export default async function GivingsDetailPageIntercept({ params }: Props) {
  const { id } = await params;

  return (
    <Suspense fallback={null}>
      <GivingsDetail isIntercepted id={id} />
    </Suspense>
  );
}
