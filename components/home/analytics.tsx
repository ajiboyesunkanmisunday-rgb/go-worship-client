'use client';

import { useEffect, useState } from 'react';
import { getSelfEvents, getSelfGroups } from '@/lib/api/tenant';
import { getProfile } from '@/lib/api/auth';
import { getCustomerPayments } from '@/lib/api/customer';
import { USE_LIVE_API } from '@/lib/api/config';
import { CurrencyCircleDollarIcon } from '@/icons/currency';
import { CalendarDays, Handshake } from 'lucide-react';
import { ReactNode, SVGProps } from 'react';

function CardBackgroundPattern({
  width = 271,
  height = 192,
  color = '#00479B',
  ...props
}: SVGProps<SVGSVGElement>) {
  return (
    <svg
      width={width}
      height={height}
      viewBox="0 0 271 192"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <g opacity="0.16">
        <path
          d="M167.104 116.06C212.762 114.45 251.161 151.009 252.811 197.783C254.461 244.558 218.733 283.731 173.075 285.342C127.418 286.952 89.0189 250.393 87.3689 203.619C85.7191 156.844 121.447 117.671 167.104 116.06Z"
          stroke={color}
          strokeWidth="2.68868"
        />
        <path
          opacity="0.8"
          d="M249.237 80.1093C294.92 78.4979 333.268 114.31 334.883 160.105C336.498 205.899 300.769 244.325 255.086 245.936C209.403 247.547 171.056 211.735 169.441 165.94C167.826 120.146 203.554 81.7206 249.237 80.1093Z"
          stroke={color}
          strokeWidth="2.68868"
        />
      </g>
    </svg>
  );
}

/**
 * Member dashboard stat card (design 31:1361): title + icon-in-white-circle on
 * top, big value below, faint decorative circles bottom-right.
 */
function StatCard({
  title,
  value,
  bg,
  patternColor,
  icon,
}: {
  title: string;
  value: string;
  bg: string;
  patternColor: string;
  icon: ReactNode;
}) {
  return (
    <div
      className="relative flex min-h-[160px] flex-1 flex-col justify-between overflow-hidden rounded-[14px] border border-[#EDEDED] p-6 lg:min-h-[192px] lg:p-8"
      style={{ backgroundColor: bg }}
    >
      <CardBackgroundPattern
        color={patternColor}
        className="absolute right-0 bottom-0"
      />
      <div className="relative z-1 flex w-full items-center justify-between">
        <span className="text-[14px] font-medium lg:text-[16px]">{title}</span>
        <div className="flex size-[36px] items-center justify-center rounded-full bg-white lg:size-[45px]">
          {icon}
        </div>
      </div>
      <p className="relative z-1 text-[28px] font-extrabold lg:text-[40px]">
        {value}
      </p>
    </div>
  );
}

export function Analytics() {
  const [totalGiven, setTotalGiven] = useState(USE_LIVE_API ? '$0' : '$1000');
  const [totalGroups, setTotalGroups] = useState(USE_LIVE_API ? 0 : 9);
  const [upcomingEvents, setUpcomingEvents] = useState(USE_LIVE_API ? 0 : 4);
  const [userName, setUserName] = useState('');

  useEffect(() => {
    if (!USE_LIVE_API) return;
    getProfile().then((p) => {
      const name = [p.firstName, p.lastName].filter(Boolean).join(' ');
      if (name) setUserName(name);
    }).catch(() => {});

    getCustomerPayments(0, 100).then((page) => {
      const sum = (page?.content ?? [])
        .filter((p) => p.status === 'SUCCEEDED')
        .reduce((s, p) => s + (p.amount ?? 0), 0);
      const currency = page?.content?.[0]?.currency ?? 'USD';
      setTotalGiven(
        sum > 0
          ? new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(sum)
          : '$0'
      );
    }).catch(() => {});

    getSelfGroups().then((groups) => setTotalGroups(groups.length)).catch(() => {});

    getSelfEvents().then((events) => {
      const upcoming = events.filter((e) => e.status.toLowerCase() === 'upcoming').length;
      setUpcomingEvents(upcoming);
    }).catch(() => {});
  }, []);

  return (
    <div className="flex w-full flex-col items-start justify-start gap-8">
      <div className="flex flex-col items-start justify-start gap-3">
        <h1 className="text-[24px] leading-[100%] font-bold md:text-[32px]">
          Hello{userName ? `, ${userName}` : ''} 👋
        </h1>
        <p className="max-w-[356px] text-[16px] leading-[150%] font-light text-brand-gray-500">
          Go-Worship church administration and giving platform.
        </p>
      </div>

      <div className="grid w-full grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard
          title="Total Given"
          value={totalGiven}
          bg="#E9F2FE"
          patternColor="#00479B"
          icon={
            <CurrencyCircleDollarIcon className="size-[19px] shrink-0 lg:size-[26px]" />
          }
        />
        <StatCard
          title="Total Group"
          value={String(totalGroups)}
          bg="#FFF7E9"
          patternColor="#E9A23B"
          icon={
            <Handshake className="size-[19px] shrink-0 text-[#00479B] lg:size-[26px]" />
          }
        />
        <StatCard
          title="Upcoming Event"
          value={String(upcomingEvents)}
          bg="#FFFFFF"
          patternColor="#9AA4B2"
          icon={
            <CalendarDays className="size-[19px] shrink-0 text-[#00479B] lg:size-[26px]" />
          }
        />
      </div>
    </div>
  );
}
