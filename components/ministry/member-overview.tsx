'use client';

import { Button } from '@/components/ui/button';
import { SheetPage } from '@/components/ui/sheet-page';
import { cn } from '@/lib/utils';
import { ArrowLeft } from 'lucide-react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { getTenantMember, type TenantMember } from '@/lib/api/tenant';
import { USE_LIVE_API } from '@/lib/api/config';

function ReadonlyField({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-[13px] font-medium text-[#333]">{label}</label>
      <div className="flex min-h-[48px] items-center rounded-[6px] border border-[#e5e5e5] px-3 py-2 text-[13px] text-brand-gray-500">
        {value || '—'}
      </div>
    </div>
  );
}

const MOCK_MEMBER: TenantMember = {
  id: 'M-001',
  name: 'John Adeyemi',
  email: 'john@example.com',
  phone: '+1 555-0101',
  status: 'Active',
  joinedAt: 'Jan 12, 2025',
  groups: ['Faith Builders'],
};

/** Church Admin "Member Overview" slide-over. */
export function MemberOverview({ id }: { id?: string }) {
  const router = useRouter();
  const back = '/ministry/members';
  const [member, setMember] = useState<TenantMember>(
    USE_LIVE_API ? { id: '', name: '', email: '', phone: '', status: 'Active', joinedAt: '', groups: [] } : MOCK_MEMBER
  );

  useEffect(() => {
    if (!USE_LIVE_API || !id) return;
    getTenantMember(id).then((m: TenantMember | null) => { if (m) setMember(m); }).catch(() => {});
  }, [id]);

  return (
    <SheetPage
      className="w-full max-w-[665px]!"
      backLink={back}
      title="Member Overview"
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
          <h1 className="text-[20px] font-bold text-brand-blue">
            Member Overview
          </h1>
        </div>

        <div className="flex items-center gap-3">
          <Image
            src="/auth/infinity-blue.svg"
            alt="Member"
            width={44}
            height={44}
            className="size-11 rounded-full"
          />
          <div>
            <p className="text-[10px] text-brand-gray-500">Member Name:</p>
            <p className="text-[20px] font-bold text-brand-blue">
              {member.name}
            </p>
            <p className="flex items-center gap-1.5 text-[12px] text-brand-gray-500">
              {member.joinedAt ? `Joined ${member.joinedAt}` : ''}
              <span className="inline-flex items-center gap-1">
                <span className={cn(
                  'size-2 rounded-full',
                  member.status === 'Active' ? 'bg-[#34a853]' : 'bg-[#eb0000]'
                )} />
                {member.status}
              </span>
            </p>
          </div>
        </div>

        <div className="flex flex-col gap-5">
          <h2 className="text-[15px] font-bold">Member Information</h2>
          <ReadonlyField label="Full Name*" value={member.name} />
          <ReadonlyField label="Email Address*" value={member.email} />
          <ReadonlyField label="Phone Number" value={member.phone} />
          <ReadonlyField label="Status" value={member.status} />
          <ReadonlyField label="Date Joined" value={member.joinedAt} />
          <ReadonlyField
            label="Groups"
            value={member.groups.length > 0 ? member.groups.join(', ') : 'No groups'}
          />
        </div>

        <div className="flex flex-col gap-3">
          <Button
            size="lg"
            className="h-[52px] w-full"
            onClick={() => router.push(`${back}/${id ?? member.id}/edit`)}
          >
            Edit Member
          </Button>
          <Button asChild size="lg" variant="outline" className="h-[52px] w-full">
            <button type="button" onClick={() => router.push(back)}>
              Close
            </button>
          </Button>
        </div>
      </div>
    </SheetPage>
  );
}
