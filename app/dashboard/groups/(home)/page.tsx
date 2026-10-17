import { Analytics } from '@/components/groups/analytics';
import { AllGroupActivities } from '@/components/groups/group-activities-table';
import { Suspense } from 'react';

export default function GroupsHomePage() {
  return (
    <div className="w-full flex flex-col justify-start items-start gap-10">
      <Suspense fallback={null}>
        <Analytics />
      </Suspense>

      <Suspense fallback={null}>
        <AllGroupActivities />
      </Suspense>
    </div>
  );
}
