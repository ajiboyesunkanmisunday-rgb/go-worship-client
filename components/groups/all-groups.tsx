'use client';

import Image from 'next/image';
import Link from 'next/link';
import { ArrowLeft, Search } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { SheetPage } from '../ui/sheet-page';

const GROUPS = Array.from({ length: 5 }).map((_, i) => ({
  id: String(i + 1),
  church: 'Celebration Church, Canada',
  type: 'Communication',
  department: 'Campus Ministry',
  leader: 'Joe Doe',
}));

export function AllGroups() {
  const router = useRouter();

  return (
    <SheetPage
      className="w-full max-w-[665px]!"
      backLink="/dashboard/groups"
      title="All My Groups"
    >
      <div className="flex h-full w-full flex-col overflow-y-auto px-6 pt-[56px] pb-8 md:px-[54px]">
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
            All My Groups
          </h1>
          <div className="flex h-9 items-center gap-2 rounded-[6px] border-[0.5px] border-[#cdcdcd] px-3">
            <input
              placeholder="Search your group"
              className="w-[120px] bg-transparent text-[12px] outline-none placeholder:text-brand-gray-400"
            />
            <Search className="size-4 shrink-0 text-brand-gray-400" />
          </div>
        </div>

        <ul className="mt-4 flex flex-col divide-y divide-[#ededed]">
          {GROUPS.map((g) => (
            <li key={g.id} className="flex items-center gap-4 py-5">
              <div className="relative h-[110px] w-[160px] shrink-0 overflow-hidden rounded-[7px]">
                <Image
                  src="/groups/group-card.jpg"
                  alt=""
                  fill
                  sizes="160px"
                  className="object-cover"
                />
              </div>
              <div className="flex-1 text-[13px] leading-[1.5] text-[#1d1d1d]">
                <p>{g.church}</p>
                <p>Type: {g.type}</p>
                <p>Department: {g.department}</p>
                <p>
                  Led by <span className="font-bold">{g.leader}</span>
                </p>
              </div>
            </li>
          ))}
        </ul>

        <Link
          href="/dashboard/groups/discover"
          className="mt-6 flex h-[52px] w-full items-center justify-center rounded-[6px] bg-brand-gray-300 text-[16px] font-semibold text-white no-underline transition-colors hover:bg-brand-gray-300/90"
        >
          Explore more Groups
        </Link>
      </div>
    </SheetPage>
  );
}
