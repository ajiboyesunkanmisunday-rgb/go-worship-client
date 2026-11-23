'use client';

import { DollarCircleIcon } from '@/icons/currency';
import { DotsNineIcon } from '@/icons/dots';
import { NotepadIcon } from '@/icons/notes';
import { HandshakeIcon, UserIcon } from '@/icons/socials';
import { useCommunications } from '@/components/shared/communications-provider';
import { cn } from '@/lib/utils';
import { Bell, Lock, Mail } from 'lucide-react';
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

function CommunicationBadge({ count }: { count: number }) {
  if (count <= 0) return null;
  return (
    <span className="flex h-5 min-w-[20px] items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
      {count > 99 ? '99+' : count}
    </span>
  );
}

function CommunicationLinks() {
  const pathname = usePathname();
  const { summary } = useCommunications();

  const links = [
    {
      href: '/dashboard/messages',
      label: 'Messages',
      icon: Mail,
      badge: summary.unreadMessages,
    },
    {
      href: '/dashboard/notifications',
      label: 'Notifications',
      icon: Bell,
      badge: summary.unreadNotifications,
    },
  ];

  return (
    <div className="flex w-full flex-col gap-1 border-t border-[#f0f0f0] pt-2">
      {links.map(({ href, label, icon: Icon, badge }) => {
        const isActive = pathname.toLowerCase().startsWith(href.toLowerCase());
        return (
          <Link
            key={href}
            href={href}
            className={cn(
              'w-full h-[50px] p-4 flex justify-between items-center rounded-[5px]',
              'gap-4 transition-all no-underline',
              isActive
                ? 'bg-[#0075FF1A] text-[#243F84] font-bold'
                : 'hover:bg-brand-blue/5',
            )}
          >
            <span className="flex items-center gap-4">
              <Icon className="shrink-0 size-[24px] transition-all" />
              <span className="transition-all">{label}</span>
            </span>
            <CommunicationBadge count={badge} />
          </Link>
        );
      })}
    </div>
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
        <CommunicationLinks />
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
