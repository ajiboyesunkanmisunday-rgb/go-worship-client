'use client';

import { cn } from '@/lib/utils';
import { Search } from 'lucide-react';
import { CurrencyCircleDollarIcon } from '@/icons/currency';
import { NotificationsBell } from '@/components/shared/notifications-bell';
import { RoleSwitcher } from '@/components/shared/role-switcher';
import { ProfileMenu } from '@/components/shared/profile-menu';
import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { getTenantBranding } from '@/lib/api/tenant';
import { api } from '@/lib/api/client';
import { USE_LIVE_API } from '@/lib/api/config';

function CompanyInfo() {
  const [name, setName] = useState(USE_LIVE_API ? '' : 'Celebration Church Int.');
  const [location, setLocation] = useState(USE_LIVE_API ? '' : 'Ontario Canada, Canada City');

  useEffect(() => {
    if (!USE_LIVE_API) return;
    getTenantBranding().then((b) => {
      if (b.organizationName) setName(b.organizationName);
    }).catch(() => {});
    (api.get<Record<string, unknown>>('/tenant/admin/organization') as Promise<Record<string, unknown>>)
      .then((d) => {
        const loc = (d['city'] as string | undefined) ?? (d['location'] as string | undefined) ?? (d['address'] as string | undefined) ?? (d['country'] as string | undefined);
        if (loc) setLocation(loc);
      }).catch(() => {});
  }, []);

  return (
    <div className="flex flex-row items-center justify-start gap-3">
      <Image
        src="/Group 1000007662.svg"
        alt="Go Worship"
        width={40}
        height={40}
      />
      <div className="hidden flex-col items-start justify-start gap-1 md:flex">
        <p className="text-[14px] leading-[100%] font-bold tracking-[0%] md:text-[16px]">
          {name}
        </p>
        <span className="text-[13px] leading-[100%] tracking-[0%] text-brand-gray-500 md:text-[14px]">
          {location}
        </span>
      </div>
    </div>
  );
}

function HeaderActions() {
  return (
    <div className="flex items-center gap-3 lg:gap-5">
      <Link
        href="/dashboard/givings/give"
        className="flex h-10 items-center gap-1.5 rounded-[6px] bg-[#34a853] px-4 text-[14px] font-bold text-white no-underline transition-colors hover:bg-[#34a853]/90"
      >
        <CurrencyCircleDollarIcon color="#ffffff" className="size-5" />
        Give
      </Link>

      <NotificationsBell />

      <div className="hidden h-9 w-[180px] items-center gap-2 rounded-[6px] border-[0.5px] border-[#cdcdcd] px-3 xl:flex">
        <input
          placeholder="Search your group"
          className="w-full bg-transparent text-[12px] outline-none placeholder:text-brand-gray-400"
        />
        <Search className="size-4 shrink-0 text-brand-gray-400" />
      </div>

      <ProfileMenu />
    </div>
  );
}

export function Header() {
  return (
    <header
      className={cn(
        // z-30 keeps the header (and its role-switcher / notifications dropdowns)
        // above the fixed sidebar (z-20), while staying below dialogs (z-50).
        'fixed top-0 z-30 flex h-[80px] w-full items-center gap-4 border-b border-[#EDEDED]',
        'bg-white px-6'
      )}
    >
      <RoleSwitcher />
      <div className="h-8 w-px bg-[#EDEDED]" />
      <CompanyInfo />
      <div className="ml-auto">
        <HeaderActions />
      </div>
    </header>
  );
}
