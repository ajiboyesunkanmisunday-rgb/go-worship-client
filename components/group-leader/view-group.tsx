'use client';

import { Button } from '@/components/ui/button';
import { SheetPage } from '@/components/ui/sheet-page';
import { ArrowLeft } from 'lucide-react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';

function ReadonlyField({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-[13px] font-medium text-[#333]">{label}</label>
      <div className="flex h-[48px] items-center rounded-[6px] border border-[#e5e5e5] px-3 text-[14px] text-brand-gray-500">
        {value}
      </div>
    </div>
  );
}

export function ViewGroup() {
  const router = useRouter();

  return (
    <SheetPage
      className="w-full max-w-[665px]!"
      backLink="/group-leader/groups"
      title="Group Overview"
    >
      <div className="flex h-full w-full flex-col gap-6 overflow-y-auto px-6 pt-[64px] pb-10 md:px-[60px]">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => router.push('/group-leader/groups')}
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
              Faith Builders Fellowship
            </p>
            <p className="text-[12px] text-brand-gray-500">
              Category: Small Group / Bible Study
            </p>
            <p className="flex items-center gap-1.5 text-[12px] text-brand-gray-500">
              Created on June 10, 2025
              <span className="inline-flex items-center gap-1">
                <span className="size-2 rounded-full bg-[#34a853]" /> Active
              </span>
            </p>
          </div>
        </div>

        <div className="flex flex-col gap-5">
          <h2 className="text-[15px] font-bold">Group Information</h2>
          <ReadonlyField
            label="Group Description*"
            value="A complete breakdown of what happens when a user clicks View on the Group List."
          />
          <ReadonlyField label="Meeting Frequency*" value="Every Tuesdays" />
          <ReadonlyField label="Meeting Day*" value="Tuesdays" />
          <ReadonlyField label="Meeting Time*" value="6:00 PM" />
          <ReadonlyField label="Group Leader*" value="Isaiah Christian" />
          <ReadonlyField label="Venue Name*" value="Canada Ontario" />
          <ReadonlyField
            label="Online Meeting Link*"
            value="http://zoom/canadachurch.com"
          />
        </div>

        <div className="flex flex-col gap-3">
          <Button
            size="lg"
            className="h-[52px] w-full"
            onClick={() => router.push('/group-leader/groups/1/edit')}
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
              onClick={() => router.push('/group-leader/groups')}
            >
              Close
            </button>
          </Button>
        </div>
      </div>
    </SheetPage>
  );
}
