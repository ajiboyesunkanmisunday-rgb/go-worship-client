'use client';

import { DollarCircleIcon } from '@/icons/currency';
import { DotsNineIcon } from '@/icons/dots';
import { NotepadIcon } from '@/icons/notes';
import { HandshakeIcon, UserIcon } from '@/icons/socials';
import { cn } from '@/lib/utils';
import { Lock } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { SVGProps, useMemo } from 'react';

const BASE_PATH = '/dashboard';

const SIDEBAR_ITEMS = [
  {
    href: '/dashboard',
    label: 'Dashboard',
    icon: DotsNineIcon,
  },
  {
    href: '/dashboard/givings',
    label: 'Giving',
    icon: DollarCircleIcon,
  },
  {
    href: '/dashboard/events',
    label: 'Event',
    icon: NotepadIcon,
    locked: true,
  },
  {
    href: '/dashboard/groups',
    label: 'Group',
    icon: HandshakeIcon,
    locked: true,
  },
  {
    href: '/dashboard/profile',
    label: 'Profile',
    icon: UserIcon,
  },
];

type SidebarItemProps = {
  href: string;
  label: string;
  icon: React.ComponentType<SVGProps<SVGSVGElement>>;
  locked?: boolean;
  onClick?(): void;
};

function SidebarItem({ href, label, locked, onClick, ...props }: SidebarItemProps) {
  const pathname = usePathname();

  const isActive = useMemo(
    () =>
      (pathname.toLowerCase().includes(href.toLowerCase()) &&
        href.length > 1 &&
        href !== BASE_PATH) ||
      pathname.toLowerCase() === href.toLowerCase(),
    [pathname, href]
  );

  const iconColor = useMemo(
    () => (isActive ? '#243F84' : '#333333'),
    [isActive]
  );

  return (
    <Link
      href={href}
      onClick={onClick}
      className={cn(
        'w-full h-[50px] p-4 flex justify-between items-center rounded-[5px]',
        'gap-4 transition-all no-underline',
        {
          'bg-[#0075FF1A] text-[#243F84] font-bold': isActive,
          'hover:bg-brand-blue/5': !isActive,
        }
      )}
    >
      <span className="flex items-center gap-4">
        <props.icon
          className="shrink-0 size-[24px] transition-all"
          color={iconColor}
        />
        <span className="transition-all">{label}</span>
      </span>
      {locked && <Lock className="size-[16px] shrink-0 text-brand-gray-400" />}
    </Link>
  );
}

export function SidebarDesktop() {
  return (
    <aside
      className={cn(
        'w-[250px] bg-white fixed top-[80px] left-0 h-[calc(100vh-80px)] z-20',
        'hidden lg:flex shadow flex-col justify-start items-start py-10'
      )}
    >
      <div className="w-full h-full overflow-y-auto flex flex-col justify-start items-start px-[20px] py-[10px] gap-2">
        {SIDEBAR_ITEMS.map((item) => (
          <SidebarItem key={item.href} {...item} />
        ))}
      </div>
    </aside>
  );
}

export function Sidebar() {
  return (
    <>
      <SidebarDesktop />
      {/* <SidebarMobile /> */}
    </>
  );
}
