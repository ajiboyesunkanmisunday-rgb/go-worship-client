'use client';

import { cn } from '@/lib/utils';
import {
  CheckSquare,
  ClipboardList,
  Layers,
  LayoutGrid,
  NotepadText,
  Search,
  UserCircle,
} from 'lucide-react';
import { NotificationsBell } from '@/components/shared/notifications-bell';
import { AdminProfileMenu } from '@/components/shared/admin-profile-menu';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { RoleSwitcher } from '@/components/shared/role-switcher';
import { useState, useEffect } from 'react';
import { getTenantBranding } from '@/lib/api/tenant';
import { api } from '@/lib/api/client';
import { USE_LIVE_API } from '@/lib/api/config';

const NAV_ITEMS = [
  { href: '/ministry-admin/dashboard', label: 'Dashboard', icon: LayoutGrid },
  { href: '/ministry-admin/events', label: 'Events List', icon: NotepadText },
  {
    href: '/ministry-admin/registrations',
    label: 'Registrations',
    icon: ClipboardList,
  },
  { href: '/ministry-admin/check-in', label: 'Check in', icon: CheckSquare },
  {
    href: '/ministry-admin/attendance',
    label: 'Attendance List',
    icon: Layers,
  },
  { href: '/ministry-admin/profile', label: 'Profile', icon: UserCircle },
];

function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="sticky top-4 hidden h-[calc(100vh-2rem)] w-[240px] shrink-0 flex-col gap-4 rounded-[10px] bg-[#f8fbff] p-4 lg:flex">
      {/* Role switcher */}
      <RoleSwitcher />

      <nav className="flex flex-col gap-1">
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
              <item.icon className="size-[19px] shrink-0" />
              {item.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}

function Topbar() {
  const [orgName, setOrgName] = useState('Celebration Church Int.');
  const [orgLocation, setOrgLocation] = useState('Ontario Canada, Canada City');
  useEffect(() => {
    if (!USE_LIVE_API) return;
    getTenantBranding().then((b) => { if (b.organizationName) setOrgName(b.organizationName); }).catch(() => {});
    (api.get<Record<string, unknown>>('/tenant/profile') as Promise<Record<string, unknown>>)
      .then((d) => {
        const loc = (d['city'] as string | undefined) ?? (d['location'] as string | undefined) ?? (d['address'] as string | undefined) ?? (d['country'] as string | undefined);
        if (loc) setOrgLocation(loc);
      }).catch(() => {});
  }, []);
  return (
    <header className="flex h-[64px] items-center justify-between gap-4 rounded-[10px] bg-[#f8fbff] px-4">
      <div className="flex h-[46px] w-full max-w-[270px] items-center gap-3 rounded-full bg-white px-4">
        <Search className="size-[17px] shrink-0 text-brand-gray-500" />
        <input
          placeholder="Search"
          className="w-full bg-transparent text-[12px] outline-none placeholder:text-brand-gray-500"
        />
      </div>

      <div className="flex items-center gap-4">
        <NotificationsBell />

        <div className="flex items-center gap-3">
          <Image
            src="/Group 1000007662.svg"
            alt="Go Worship"
            width={39}
            height={39}
          />
          <div className="hidden flex-col md:flex">
            <p className="text-[12px] font-bold">{orgName}</p>
            <span className="text-[11px] text-brand-gray-500">
              {orgLocation}
            </span>
          </div>
        </div>

        <AdminProfileMenu
          profileHref="/ministry-admin/profile"
          settingsHref="/ministry-admin/profile"
        />
      </div>
    </header>
  );
}

export function PortalShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen w-full gap-4 bg-white p-4">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col gap-4">
        <Topbar />
        <main className="flex-1 rounded-[10px] bg-[#f8fbff] p-4 lg:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
