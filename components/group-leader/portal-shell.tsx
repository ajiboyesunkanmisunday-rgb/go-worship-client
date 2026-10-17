'use client';

import { cn } from '@/lib/utils';
import {
  CircleUser,
  Handshake,
  Layers,
  LayoutGrid,
  Search,
  UsersRound,
} from 'lucide-react';
import { NotificationsBell } from '@/components/shared/notifications-bell';
import { TopbarSearch } from '@/components/shared/topbar-search';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { RoleSwitcher } from '@/components/shared/role-switcher';

const NAV_ITEMS = [
  { href: '/group-leader/dashboard', label: 'Dashboard', icon: LayoutGrid },
  { href: '/group-leader/groups', label: 'Groups', icon: Handshake },
  { href: '/group-leader/members', label: 'Members', icon: UsersRound },
  {
    href: '/group-leader/engagement',
    label: 'Engagement Metrics',
    icon: Layers,
  },
  { href: '/group-leader/profile', label: 'Profile', icon: CircleUser },
];

function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="sticky top-0 hidden h-screen w-[210px] shrink-0 flex-col gap-4 border-r border-[#ededed] bg-white p-4 lg:flex">
      <RoleSwitcher />

      <nav className="flex flex-1 flex-col gap-1">
        {NAV_ITEMS.map((item) => {
          const isActive = pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex h-[44px] items-center gap-3 rounded-[6px] px-3 text-[13px] no-underline transition-colors',
                isActive
                  ? 'bg-brand-blue font-medium text-white'
                  : 'text-[#343434] hover:bg-brand-blue/5'
              )}
            >
              <item.icon className="size-[18px] shrink-0" />
              {item.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}

function Topbar() {
  return (
    <header className="flex h-[64px] items-center justify-between gap-4 border-b border-[#ededed] bg-white px-6">
      <TopbarSearch />

      <div className="flex items-center gap-5">
        <NotificationsBell />

        <div className="flex items-center gap-3">
          <Image
            src="/Group 1000007662.svg"
            alt="Go Worship"
            width={39}
            height={39}
          />
          <div className="hidden flex-col md:flex">
            <p className="text-[13px] font-bold">Celebration Church Int.</p>
            <span className="text-[12px] text-brand-gray-500">
              Ontario Canada, Canada City
            </span>
          </div>
        </div>
      </div>
    </header>
  );
}

export function PortalShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen w-full bg-white">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar />
        <main className="flex-1 bg-[#fbfcff] p-4 lg:p-6">{children}</main>
      </div>
    </div>
  );
}
