'use client';

import { StatCard } from '@/components/ministry/shared';
import { cn } from '@/lib/utils';
import { Check, Pencil, Plus } from 'lucide-react';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { getSystemStats } from '@/lib/api/system';
import { api } from '@/lib/api/client';
import { USE_LIVE_API } from '@/lib/api/config';
import { toast } from 'sonner';

type Plan = {
  id: number;
  name: string;
  price: string;
  cycle: string;
  blurb: string;
  features: string[];
  highlight?: boolean;
};

const PLANS: Plan[] = [
  {
    id: 1,
    name: 'Starter',
    price: '$0',
    cycle: '/monthly',
    blurb: 'Perfect for getting started',
    features: [
      'Up to 100 members',
      'Basic giving tools',
      'Event management',
      'Email support',
    ],
  },
  {
    id: 2,
    name: 'Professional',
    price: '$70,000',
    cycle: '/quarterly',
    blurb: 'Perfect for growing teams',
    features: [
      'Unlimited members',
      'Advanced analytics',
      'Priority support',
      'Custom branding',
      'Group management',
    ],
    highlight: true,
  },
  {
    id: 3,
    name: 'Enterprise',
    price: '$250,000',
    cycle: '/yearly',
    blurb: 'For large multi-campus churches',
    features: [
      'Everything in Professional',
      'Multi-campus support',
      'Dedicated account manager',
      'API access',
      'Custom integrations',
    ],
  },
];

const TABS = ['Plan', 'Feature'];

function PlanCard({ plan }: { plan: Plan }) {
  const hi = plan.highlight;
  return (
    <div
      className={cn(
        'relative flex flex-col gap-4 rounded-[14px] p-6',
        hi ? 'bg-brand-blue text-white' : 'border border-[#ededed] bg-white'
      )}
    >
      <Link
        href={`/system/plans/${plan.id}/edit`}
        aria-label={`Edit ${plan.name}`}
        className={cn(
          'absolute right-5 top-5 flex size-8 items-center justify-center rounded-full transition-colors',
          hi ? 'bg-white/15 text-white hover:bg-white/25' : 'bg-[#f2f2f2] text-[#333] hover:bg-[#e6e6e6]'
        )}
      >
        <Pencil className="size-3.5" />
      </Link>

      <p className={cn('text-[15px] font-medium', hi ? 'text-white/80' : 'text-brand-gray-500')}>
        {plan.name}
      </p>

      <p className="text-[30px] font-bold leading-none">
        {plan.price}
        <span className={cn('text-[13px] font-normal', hi ? 'text-white/70' : 'text-brand-gray-500')}>
          {' '}
          {plan.cycle}
        </span>
      </p>

      <p className={cn('text-[12px]', hi ? 'text-white/80' : 'text-brand-gray-500')}>
        {plan.blurb}
      </p>

      <div className={cn('h-px w-full', hi ? 'bg-white/20' : 'bg-[#ededed]')} />

      <p className="text-[13px] font-semibold">Features You&apos;ll Love:</p>
      <ul className="flex flex-col gap-2">
        {plan.features.map((f) => (
          <li key={f} className="flex items-start gap-2 text-[12px]">
            <Check
              className={cn(
                'mt-0.5 size-3.5 shrink-0',
                hi ? 'text-white' : 'text-[#34a853]'
              )}
            />
            <span className={hi ? 'text-white/90' : 'text-[#333]'}>{f}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

/** System → Plans & Billing (board 778:38441). */
export default function SystemPlansPage() {
  const [tab, setTab] = useState(0);
  const [revenue, setRevenue] = useState(USE_LIVE_API ? '$0' : '$1300');
  const [overdue, setOverdue] = useState(USE_LIVE_API ? '$0' : '$150');
  const [pendingPayments, setPendingPayments] = useState(USE_LIVE_API ? '$0' : '$830');
  const [plans, setPlans] = useState<Plan[]>(USE_LIVE_API ? [] : PLANS);

  useEffect(() => {
    if (!USE_LIVE_API) return;
    // /system/billing/stats not in backend API — disabled.

    (api.get<unknown>('/system/billing/plans') as Promise<unknown>)
      .then((data) => {
        type R = Record<string, unknown>;
        const arr: R[] = Array.isArray(data)
          ? (data as R[])
          : Array.isArray((data as R)?.['content'])
            ? ((data as R)['content'] as R[])
            : Array.isArray((data as R)?.['data'])
              ? ((data as R)['data'] as R[])
              : [];
        if (arr.length === 0) return;
        const mapped: Plan[] = arr.map((p, i) => {
          const featureRaw = p['features'] ?? p['featureList'];
          const features: string[] = Array.isArray(featureRaw)
            ? (featureRaw as unknown[]).map(String)
            : typeof featureRaw === 'string'
              ? featureRaw.split(/\n|,/).map((s) => s.trim()).filter(Boolean)
              : (PLANS[i % PLANS.length]?.features ?? []);
          const priceNum = Number(p['price'] ?? p['amount'] ?? p['monthlyPrice'] ?? 0);
          const price = priceNum
            ? new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(priceNum)
            : String(p['price'] ?? '$0');
          return {
            id: Number(p['id'] ?? p['planId'] ?? i + 1),
            name: String(p['name'] ?? p['planName'] ?? ''),
            price,
            cycle: String(p['billingCycle'] ?? p['cycle'] ?? '/monthly'),
            blurb: String(p['description'] ?? p['blurb'] ?? ''),
            features,
            highlight: i === 1,
          };
        }).filter((p) => p.name);
        if (mapped.length > 0) setPlans(mapped);
      })
      .catch(() => { toast.error('Could not load plans.'); });
  }, []);

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h1 className="text-[26px] font-bold lg:text-[32px]">Plans &amp; Billing</h1>
        <p className="mt-1 text-[14px] text-brand-gray-500">
          Manage subscription plans and billing
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard
          title="Total Revenue (This Month)"
          value={revenue}
          variant="blue"
        />
        <StatCard
          title="Pending Payments"
          value={pendingPayments}
          variant="green"
          subtitle="5% of total"
        />
        <StatCard
          title="Overdue Amount"
          value={overdue}
          variant="white"
          subtitle="-5% from last month"
        />
      </div>

      <div className="rounded-[14px] bg-white p-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-2 rounded-full bg-[#f2f2f2] p-1 text-[12px]">
            {TABS.map((t, i) => (
              <button
                key={t}
                type="button"
                onClick={() => setTab(i)}
                className={cn(
                  'rounded-full px-5 py-1.5 transition-colors',
                  i === tab ? 'bg-brand-blue text-white' : 'text-brand-gray-500'
                )}
              >
                {t}
              </button>
            ))}
          </div>

          <Link
            href="/system/plans/create"
            className="flex h-10 items-center gap-2 rounded-[8px] bg-[#22a45d] px-4 text-[13px] font-medium text-white no-underline transition-colors hover:bg-[#1c8c4f]"
          >
            <Plus className="size-4" />
            Add Plan
          </Link>
        </div>

        {tab === 0 ? (
          <div className="mt-6 grid grid-cols-1 gap-5 lg:grid-cols-3">
            {plans.map((p) => (
              <PlanCard key={p.id} plan={p} />
            ))}
          </div>
        ) : (
          <div className="mt-6 overflow-x-auto">
            <table className="w-full min-w-[560px] border-collapse">
              <thead>
                <tr className="bg-[#f7f9fc] text-left text-[13px] text-[#333]">
                  <th className="rounded-l-[8px] px-3 py-3 font-medium">Feature</th>
                  {plans.map((p) => (
                    <th key={p.id} className="px-3 py-3 text-center font-medium last:rounded-r-[8px]">
                      {p.name}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {[...new Set(plans.flatMap((p) => p.features))].map((f) => (
                  <tr key={f} className="border-t border-[#f2f2f2] text-[12px]">
                    <td className="px-3 py-3">{f}</td>
                    {plans.map((p) => (
                      <td key={p.id} className="px-3 py-3 text-center">
                        {p.features.includes(f) ? (
                          <Check className="mx-auto size-4 text-[#34a853]" />
                        ) : (
                          <span className="text-brand-gray-400">—</span>
                        )}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
