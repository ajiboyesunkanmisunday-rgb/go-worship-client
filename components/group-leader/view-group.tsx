'use client';

import { Button } from '@/components/ui/button';
import { SheetPage } from '@/components/ui/sheet-page';
import { cn } from '@/lib/utils';
import { ArrowLeft } from 'lucide-react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { getTenantGroup, type TenantGroup } from '@/lib/api/tenant';
import { USE_LIVE_API } from '@/lib/api/config';

function ReadonlyField({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-[13px] font-medium text-[#333]">{label}</label>
      <div className="flex h-[48px] items-center rounded-[6px] border border-[#e5e5e5] px-3 text-[14px] text-brand-gray-500">
        {value || '—'}
      </div>
    </div>
  );
}

const MOCK_GROUP: TenantGroup = {
  id: '1',
  name: 'Faith Builders Fellowship',
  description: 'A complete breakdown of what happens when a user clicks View on the Group List.',
  memberCount: 22,
  leaderId: '',
  leaderName: 'Isaiah Christian',
  status: 'Active',
  createdAt: 'Jun 10, 2025',
};

export function ViewGroup({ id }: { id?: string }) {
  const router = useRouter();
  const back = '/group-leader/groups';
  const [group, setGroup] = useState<TenantGroup>(
    USE_LIVE_API ? { id: '', name: '', description: '', memberCount: 0, leaderId: '', leaderName: '', status: 'Active', createdAt: '' } : MOCK_GROUP
  );

  useEffect(() => {
    if (!USE_LIVE_API || !id) return;
    getTenantGroup(id).then((g: TenantGroup | null) => { if (g) setGroup(g); }).catch(() => {});
  }, [id]);

  return (
    <SheetPage
      className="w-full max-w-[665px]!"
      backLink={back}
      title="Group Overview"
    >
      <div className="flex h-full w-full flex-col gap-6 overflow-y-auto px-6 pt-[64px] pb-10 md:px-[60px]">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => router.push(back)}
            aria-label="Go back"
            className="text-black transition-opacity hover:opacity-70"
          >
            <ArrowLeft className="size-6" />
          </button>
          <h1 className="text-[20px] font-bold text-brand-blue">Group Overview</h1>
        </div>

        <div className="flex items-center gap-3">
          <Image
            src="/auth/infinity-blue.svg"
            alt="Group"
            width={44}
            height={44}
            className="size-11 rounded-full"
          />
          <div>
            <p className="text-[10px] text-brand-gray-500">Group Name:</p>
            <p className="text-[20px] font-bold text-brand-blue">
              {group.name}
            </p>
            <p className="text-[12px] text-brand-gray-500">
              {group.description || 'Small Group'}
            </p>
            <p className="flex items-center gap-1.5 text-[12px] text-brand-gray-500">
              {group.createdAt ? `Created on ${group.createdAt}` : ''}
              <span className="inline-flex items-center gap-1">
                <span className={cn(
                  'size-2 rounded-full',
                  group.status?.toLowerCase() === 'active' ? 'bg-[#34a853]' : 'bg-[#eb0000]'
                )} />
                {group.status || 'Active'}
              </span>
            </p>
          </div>
        </div>

        <div className="flex flex-col gap-5">
          <h2 className="text-[15px] font-bold">Group Information</h2>
          <ReadonlyField label="Group Description*" value={group.description} />
          <ReadonlyField label="Meeting Frequency*" value={group.meetingFrequency || '—'} />
          <ReadonlyField label="Meeting Day*" value={group.meetingDays?.join(', ') || '—'} />
          <ReadonlyField label="Meeting Time*" value={group.meetingTime || '—'} />
          <ReadonlyField label="Group Leader*" value={group.leaderName} />
          <ReadonlyField label="Venue Name*" value={group.venueName || '—'} />
          <ReadonlyField label="Online Meeting Link*" value={group.onlineMeetingLink || '—'} />
        </div>

        <div className="flex flex-col gap-3">
          <Button
            size="lg"
            className="h-[52px] w-full"
            onClick={() => router.push(`${back}/${id ?? group.id}/edit`)}
          >
            Edit Group
          </Button>
          <Button
            asChild
            size="lg"
            variant="outline"
            className="h-[52px] w-full"
          >
            <button
              type="button"
              onClick={() => router.push(back)}
            >
              Close
            </button>
          </Button>
        </div>
      </div>
    </SheetPage>
  );
}
