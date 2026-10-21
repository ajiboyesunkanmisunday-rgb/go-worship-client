'use client';

import Image from 'next/image';
import { ArrowLeft, ChevronDown } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { SheetPage } from '../ui/sheet-page';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu';
import { getTenantMembers, type TenantMember } from '@/lib/api/tenant';
import { USE_LIVE_API } from '@/lib/api/config';
import { cn } from '@/lib/utils';

const MOCK_MEMBERS: TenantMember[] = Array.from({ length: 11 }, (_, i) => ({
  id: String(i + 1),
  name: 'Grace Anita',
  email: '',
  phone: '',
  status: 'Active' as const,
  joinedAt: '',
  groups: [],
}));

const FILTERS = ['All member', 'Youth Fellowship', 'Music Group', 'Prayer Group'];

export function GroupMembers() {
  const router = useRouter();
  const [filter, setFilter] = useState(FILTERS[0]);
  const [members, setMembers] = useState<TenantMember[]>(USE_LIVE_API ? [] : MOCK_MEMBERS);

  useEffect(() => {
    if (!USE_LIVE_API) return;
    getTenantMembers().then(setMembers).catch(() => {});
  }, []);

  return (
    <SheetPage
      className="w-full max-w-[665px]!"
      backLink="/dashboard/groups"
      title="My Group Member"
    >
      <div className="flex h-full w-full flex-col overflow-y-auto px-6 pt-[56px] pb-10 md:px-[54px]">
        <button
          type="button"
          onClick={() => router.push('/dashboard/groups')}
          aria-label="Go back"
          className="text-black transition-opacity hover:opacity-70"
        >
          <ArrowLeft className="size-6" />
        </button>

        <Image
          src="/auth/infinity-blue.svg"
          alt="Go Worship"
          width={64}
          height={22}
          className="mt-6 h-[22px] w-[64px]"
        />

        <div className="mt-3 flex flex-wrap items-center justify-between gap-4">
          <h1 className="font-poppins text-[24px] font-medium -tracking-[0.01em] lg:text-[27px]">
            My Group Member
          </h1>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                className="flex h-9 items-center gap-2 rounded-[6px] border-[0.5px] border-brand-blue px-3 text-[13px] font-medium text-brand-blue transition-colors hover:bg-brand-blue/5"
              >
                {filter}
                <ChevronDown className="size-4" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {FILTERS.map((f) => (
                <DropdownMenuItem key={f} onClick={() => setFilter(f)}>
                  {f}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <ul className="mt-4 flex flex-col divide-y divide-[#ededed]">
          {members.map((m) => (
            <li key={m.id} className="flex items-center gap-4 py-4">
              <div className="flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-brand-gray-200">
                <Image
                  src="/User.svg"
                  alt=""
                  width={28}
                  height={28}
                  className="size-7 opacity-60"
                />
              </div>
              <span className="flex-1 text-[14px] font-medium text-[#1d1d1d]">
                {m.name}
              </span>
              <span className="w-[100px] text-[14px] text-brand-gray-500">
                Member
              </span>
              <span className={cn(
                'w-[70px] text-right text-[14px] font-medium',
                m.status === 'Active' ? 'text-[#34a853]' : 'text-[#eb0000]'
              )}>
                {m.status}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </SheetPage>
  );
}
