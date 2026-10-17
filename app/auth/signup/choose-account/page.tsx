import { WizardShell } from '@/components/auth/wizard-shell';
import { cn } from '@/lib/utils';
import { BadgeCheck, Crown, ShieldCheck, User } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';

type AccountCard = {
  title: string;
  description: string;
  icon: React.ReactNode;
  cardClass: string;
  iconClass: string;
  buttonClass: string;
  buttonLabel: string;
  href: string;
  verified?: boolean;
};

const CARDS: AccountCard[] = [
  {
    title: 'Church Member',
    description: 'Access giving history, events, groups, and personal dashboard.',
    icon: <User className="size-5" />,
    cardClass: 'bg-[#f6f1ff]',
    iconClass: 'bg-[#8456d6]/15 text-[#8456d6]',
    buttonClass: 'bg-[#8456d6] text-white hover:bg-[#8456d6]/90',
    buttonLabel: 'Sign up',
    href: '/auth/signup/account-details',
  },
  {
    title: 'Staff / Volunteer',
    description: 'Support church operations with attendance and event tools.',
    icon: <Crown className="size-5" />,
    cardClass: 'bg-[#fffaec]',
    iconClass: 'bg-[#e9a23b]/15 text-[#e9a23b]',
    buttonClass: 'bg-[#fff4d5] text-black hover:bg-[#fff4d5]/70',
    buttonLabel: 'Sign in',
    href: '/auth/login',
    verified: true,
  },
  {
    title: 'Church Admin',
    description: 'Manage your church data, people, giving, events, and communication.',
    icon: <ShieldCheck className="size-5" />,
    cardClass: 'bg-[#f0fff8]',
    iconClass: 'bg-[#34a853]/15 text-[#1fa463]',
    buttonClass: 'bg-[#e0fff1] text-black hover:bg-[#e0fff1]/70',
    buttonLabel: 'Sign in',
    href: '/auth/login',
    verified: true,
  },
];

export default function ChooseAccountPage() {
  return (
    <WizardShell backHref="/auth/signup">
      <div className="flex w-full flex-col gap-6">
        <Image
          src="/auth/infinity-blue.svg"
          alt="Go Worship"
          width={64}
          height={22}
          className="h-[22px] w-[64px]"
        />

        <div className="flex flex-col gap-2">
          <h1 className="text-[28px] font-bold -tracking-[0.02em] lg:text-[40px]">
            Choose your account
          </h1>
          <p className="max-w-[520px] text-[16px] font-light lg:text-[20px]">
            Select the type of account you want to create on Go-Worship.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {CARDS.map((card) => (
            <div
              key={card.title}
              className={cn(
                'flex w-full flex-col gap-3 rounded-[10px] p-5',
                card.cardClass
              )}
            >
              <div
                className={cn(
                  'flex size-10 items-center justify-center rounded-full',
                  card.iconClass
                )}
              >
                {card.icon}
              </div>
              <h3 className="flex items-center gap-1.5 text-[18px] font-bold">
                {card.title}
                {card.verified && (
                  <BadgeCheck className="size-[18px] text-[#34a853]" />
                )}
              </h3>
              <p className="min-h-[34px] text-[12px] font-light text-black/80">
                {card.description}
              </p>
              <Link
                href={card.href}
                className={cn(
                  'mt-1 flex h-[43px] items-center justify-center rounded-[4px] text-[16px] font-medium transition-colors',
                  card.buttonClass
                )}
              >
                {card.buttonLabel}
              </Link>
            </div>
          ))}
        </div>

        <p className="text-[15px] font-light">
          Already have a Go worship account?{' '}
          <Link href="/auth/login" className="font-bold text-brand-orange">
            Sign in
          </Link>
        </p>
      </div>
    </WizardShell>
  );
}
