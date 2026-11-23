'use client';

import Image from 'next/image';
import { ArrowLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { SheetPage } from '../ui/sheet-page';
import { getTenantMembers, type TenantMember } from '@/lib/api/tenant';
import { cn } from '@/lib/utils';

export function GroupMembers() {
  const router = useRouter();
  const [members, setMembers] = useState<TenantMember[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getTenantMembers()
      .then(setMembers)
      .catch(() => {})
      .finally(() => setLoading(false));
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
        </div>

        <ul className="mt-4 flex flex-col divide-y divide-[#ededed]">
          {loading ? (
            <li className="py-6 text-center text-[13px] text-brand-gray-400">Loading members…</li>
          ) : members.length === 0 ? (
            <li className="py-6 text-center text-[13px] text-brand-gray-400">No members found.</li>
          ) : null}
          {!loading && members.map((m) => (
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
