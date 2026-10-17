'use client';

import { cn } from '@/lib/utils';
import {
  ArrowLeftRight,
  Building2,
  UsersRound,
  ChartNoAxesColumn,
  ReceiptText,
  LayoutGrid,
  ScrollText,
  Search,
  Settings,
  LifeBuoy,
  ShieldCheck,
} from 'lucide-react';
import { NotificationsBell } from '@/components/shared/notifications-bell';
import { TopbarSearch } from '@/components/shared/topbar-search';
import { AdminProfileMenu } from '@/components/shared/admin-profile-menu';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const NAV_ITEMS = [
  // Nav matches the design's 9-item System sidebar (778:38441). There is no
  // "Subscriptions" item in the design — plan/subscription management lives
  // under Plans & Billing — so it was removed here. Labels match the design:
  // "Tenants Management" and "Support management" (not "Tenants"/"Support").
  { href: '/system/dashboard', label: 'Dashboard', icon: LayoutGrid },
  { href: '/system/tenants', label: 'Tenants Management', icon: Building2 },
  { href: '/system/transactions', label: 'Transactions', icon: ArrowLeftRight },
  { href: '/system/plans', label: 'Plans & Billing', icon: ReceiptText },
  { href: '/system/platform-users', label: 'Platform Users', icon: UsersRound },
  { href: '/system/roles', label: 'Roles', icon: ShieldCheck },
  { href: '/system/analytics', label: 'Analytics', icon: ChartNoAxesColumn },
  { href: '/system/audit-logs', label: 'Audit Logs', icon: ScrollText },
  { href: '/system/support', label: 'Support management', icon: LifeBuoy },
  { href: '/system/settings', label: 'Settings', icon: Settings },
];

function Sidebar() {
  const pathname = usePathname();
  return (
    <aside className="sticky top-0 hidden h-screen w-[220px] shrink-0 flex-col gap-6 bg-[#152242] p-4 lg:flex">
      <div className="flex items-center gap-2 px-2 pt-2">
        <span className="text-[18px] font-bold text-white">Leadremit</span>
      </div>

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
                  ? 'bg-white font-medium text-[#152242]'
                  : 'text-white/70 hover:bg-white/10'
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
    <header className="flex h-[60px] items-center justify-between gap-4 bg-[#152242] px-6">
      <TopbarSearch tone="dark" />

      <div className="flex items-center gap-4">
        <Link
          href="/system/settings"
          aria-label="Settings"
          className="text-white/70 transition-colors hover:text-white"
        >
          <Settings className="size-5" />
        </Link>
        <NotificationsBell tone="dark" />
        <AdminProfileMenu
          profileHref="/system/settings"
          settingsHref="/system/settings"
          tone="dark"
        />
      </div>
    </header>
  );
}

export function PortalShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen w-full bg-[#152242]">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar />
        <main className="flex-1 rounded-tl-[16px] bg-[#f6f8fc] p-4 lg:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
