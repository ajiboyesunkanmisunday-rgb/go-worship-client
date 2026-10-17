'use client';

import { useEffect, useState } from 'react';
import { getSelfGroups, type TenantGroup } from '@/lib/api/tenant';
import { USE_LIVE_API } from '@/lib/api/config';
import { cn } from '@/lib/utils';
import { Button } from '../ui/button';
import Link from 'next/link';
import { HandshakeIcon } from '@/icons/socials';
import { PlusIcon } from 'lucide-react';

function DiscoverGroupsCard() {
  return (
    <div
      className={cn(
        'bg-white w-full flex-1 aspect-344/113 md:aspect-377/192',
        'px-[28px] py-[23px] md:p-4 lg:px-[35.23px] lg:py-[30.17px]',
        'flex flex-col justify-start items-start gap-0',
        'rounded-[9.36px] md:rounded-[13.55px] relative'
      )}
    >
      <span className="font-medium leading-[150%] tracking-[0%] text-[14px] lg:text-[16px]">
        Discover Groups
      </span>

      <p className="font-extrabold leading-[100%] tracking-[0%] text-[20px] lg:text-[40px] relative z-1 w-full truncate">
        9
      </p>

      <div className="w-full flex justify-end items-center">
        <Button
          asChild
          size="icon-lg"
          variant="outline"
          className="size-[48px]! rounded-full no-underline bg-[#F6F6F6] border-[0.5px]"
        >
          <Link href="/dashboard/groups/discover">
            <PlusIcon />
          </Link>
        </Button>
      </div>
    </div>
  );
}

type AnalyticsCardProps = {
  title: string;
  value: string;
  className?: string;
  iconBgColor?: string;
  href: string;
};

function AnalyticsCard({
  title,
  value,
  className,
  href,
  iconBgColor,
}: AnalyticsCardProps) {
  return (
    <div
      className={cn(
        'w-full flex-1 aspect-344/113 md:aspect-377/192',
        'px-[28px] py-[23px] md:p-4 lg:px-[35.23px] lg:py-[30.17px]',
        'flex flex-col justify-start items-start gap-0',
        'rounded-[9.36px] md:rounded-[13.55px] relative',
        className
      )}
    >
      <div className="w-full flex flex-row justify-between items-center relative z-1">
        <span className="font-medium leading-[150%] tracking-[0%] text-[14px] lg:text-[16px]">
          {title}
        </span>

        <div
          className="shrink-0 size-[36px] lg:size-[45px] rounded-full flex justify-center items-center"
          style={{
            backgroundColor: iconBgColor ?? 'white',
          }}
        >
          <HandshakeIcon color="#243F84" className="size-[20px]! shrink-0" />
        </div>
      </div>

      <p
        className={cn(
          'font-extrabold leading-[100%] tracking-[0%]',
          'text-[20px] lg:text-[40px] relative z-1 w-full',
          'truncate'
        )}
      >
        {value}
      </p>

      <div className="w-full flex justify-end items-center">
        <Button
          asChild
          size="sm"
          className="w-fit! px-4 py-1 rounded-full no-underline"
        >
          <Link href={href}>View</Link>
        </Button>
      </div>
    </div>
  );
}

export function Analytics() {
  const [groups, setGroups] = useState<TenantGroup[]>([]);

  useEffect(() => {
    if (!USE_LIVE_API) return;
    getSelfGroups().then(setGroups).catch(() => {});
  }, []);

  const totalGroups = USE_LIVE_API ? groups.length : 4;
  const totalMembers = USE_LIVE_API ? groups.reduce((s, g) => s + g.memberCount, 0) : 45;

  return (
    <div className="w-full flex flex-col justify-start items-start gap-10">
      <div
        className={cn(
          'w-full flex flex-col md:flex-row gap-6 justify-between items-start md:items-center'
        )}
      >
        <div className="flex flex-col justify-start items-start gap-4">
          <h1 className="text-[20px] md:text-[32px] leading-[100%] tracking-[0%] font-bold">
            My Group
          </h1>
          <p className="w-full md:max-w-[400px] lg:max-w-[580px] font-light leading-[150%] tracking-[0%] text-[16px]">
            Connect with smaller communities and grow spiritually through
            fellowship.
          </p>
        </div>

        {/* filter goes here */}
      </div>

      <div className="w-full grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-4">
        <AnalyticsCard
          title="Total groups"
          value={String(totalGroups)}
          className="bg-[#E9F2FE]"
          href="/dashboard/groups/all"
        />
        <AnalyticsCard
          title="Total group members"
          value={String(totalMembers)}
          className="bg-[#FFF7E9]"
          href="/dashboard/groups/members"
        />
        <DiscoverGroupsCard />
      </div>
    </div>
  );
}
