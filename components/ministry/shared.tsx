import { cn } from '@/lib/utils';
import { ArrowUpRight } from 'lucide-react';
import Link from 'next/link';
import { SmartTable, type SmartRow } from '@/components/shared/smart-table';
import { ReceiptButton } from '@/components/ministry/receipt-button';

export function StatCard({
  title,
  value,
  variant,
  subtitle = '40% Increased from Last month',
}: {
  title: string;
  value: string;
  variant: 'blue' | 'green' | 'white';
  subtitle?: string;
}) {
  const blue = variant === 'blue';
  return (
    <div
      className={cn(
        'relative flex min-h-[135px] flex-col justify-between rounded-[14px] p-5',
        blue && 'bg-brand-blue text-white',
        variant === 'green' && 'bg-[#eefaf3]',
        variant === 'white' && 'bg-white'
      )}
    >
      <div className="flex items-start justify-between">
        <span
          className={cn('text-[15px]', blue ? 'text-white' : 'text-[#333]')}
        >
          {title}
        </span>
        <span
          className={cn(
            'flex size-8 items-center justify-center rounded-full',
            blue ? 'bg-white/15' : 'bg-brand-blue/10'
          )}
        >
          <ArrowUpRight
            className={cn('size-4', blue ? 'text-white' : 'text-brand-blue')}
          />
        </span>
      </div>
      <p
        className={cn('text-[32px] font-bold', blue ? 'text-white' : 'text-black')}
      >
        {value}
      </p>
      <p
        className={cn(
          'text-[11px] font-light',
          blue ? 'text-white/80' : 'text-brand-gray-500'
        )}
      >
        {subtitle}
      </p>
    </div>
  );
}

export function ActionCard({
  title,
  subtitle,
  icon,
  variant = 'white',
  href,
}: {
  title: string;
  subtitle: string;
  icon: React.ReactNode;
  variant?: 'white' | 'blue';
  href?: string;
}) {
  const blue = variant === 'blue';
  const className = cn(
    'flex min-h-[135px] flex-col justify-center gap-3 rounded-[14px] p-5 no-underline transition-opacity',
    blue ? 'bg-brand-blue text-white' : 'bg-white',
    href && 'hover:opacity-90'
  );
  const body = (
    <>
      {icon}
      <div>
        <p className="text-[15px] font-semibold">{title}</p>
        <p className={cn('text-[12px]', blue ? 'text-white/80' : 'text-brand-gray-500')}>
          {subtitle}
        </p>
      </div>
    </>
  );

  if (href) {
    return (
      <Link href={href} className={className}>
        {body}
      </Link>
    );
  }
  return <div className={className}>{body}</div>;
}

const STATUS = {
  Pending: 'bg-[#fff4e5] text-[#ff8d28]',
  Success: 'bg-[#e7f7ee] text-[#34a853]',
  Failed: 'bg-[#fde8e8] text-[#eb0000]',
} as const;

export type Transaction = {
  status: keyof typeof STATUS;
  type: string;
  name?: string;
  date?: string;
  amount?: string;
  method?: string;
  paymentId?: string;
};

const DEFAULT_TXNS: Transaction[] = [
  { status: 'Pending', type: 'General Offering' },
  { status: 'Success', type: 'Tithe Offering' },
  { status: 'Failed', type: 'Offering' },
  { status: 'Success', type: 'Thanksgiving' },
  { status: 'Pending', type: 'General Offering' },
  { status: 'Failed', type: 'General Offering' },
];

export function TransactionsTable({
  rows = DEFAULT_TXNS,
}: {
  rows?: Transaction[];
}) {
  const smartRows: SmartRow[] = rows.map((t, i) => ({
    group: t.status,
    text: [
      t.name ?? 'John Christain',
      t.status,
      t.date ?? 'June 12, 2025',
      t.amount ?? '$2000',
      t.method ?? 'Bank transfer',
      t.type,
    ],
    cells: [
      <span key="n" className="flex items-center gap-2">
        <span className="size-6 rounded-full bg-brand-gray-200" />
        {t.name ?? 'John Christain'}
      </span>,
      <span
        key="s"
        className={cn(
          'rounded-full px-2.5 py-1 text-[11px] font-medium',
          STATUS[t.status]
        )}
      >
        {t.status}
      </span>,
      t.date ?? 'June 12, 2025',
      t.amount ?? '$2000',
      t.method ?? 'Bank transfer',
      t.type,
      <ReceiptButton key="a" highlighted={i === 0} />,
    ],
  }));

  return (
    <SmartTable
      title="Transactions"
      headers={['Name', 'Status', 'Date', 'Amount', 'Method', 'Type', 'Action']}
      rows={smartRows}
      filterOptions={['Last 7 days', '30 days', '1 year']}
      filterAll="Today"
      filterByGroup={false}
    />
  );
}
