'use client';

import { ReceiptButton } from '@/components/ministry/receipt-button';

import { TableCard } from '@/components/shared/table-card';
import { ActionCard, StatCard } from '@/components/ministry/shared';
import { cn } from '@/lib/utils';
import { Bell, Mail, Plus } from 'lucide-react';

const MESSAGES = [
  { title: 'Midweek Recharge', recipients: 'All Sub Accounts', status: 'Sent', rate: 100 },
  { title: 'Sunday Service Reminder', recipients: 'Group Leaders', status: 'Sent', rate: 100 },
  { title: 'Midweek Recharge', recipients: 'All Member', status: 'Scheduled', rate: 0 },
  { title: 'Midweek Recharge', recipients: 'All Sub Accounts', status: 'Sent', rate: 100 },
  { title: 'Midweek Recharge', recipients: 'All Sub Accounts', status: 'Sent', rate: 100 },
  { title: 'Midweek Recharge', recipients: 'All Sub Accounts', status: 'Sent', rate: 100 },
];

export default function MinistryCommunicationPage() {
  return (
    <div className="flex flex-col gap-5">
      <h1 className="text-[26px] font-bold lg:text-[32px]">Communication</h1>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
        <StatCard title="Total Messages" value="6" variant="white" subtitle="12% from last week" />
        <StatCard title="Active Recipients" value="260" variant="green" subtitle="5% from last week" />
        <StatCard title="Unread Messages" value="460" variant="white" subtitle="Click here to create group" />
        <StatCard title="Scheduled" value="4" variant="white" subtitle="Click here to create group" />
        <ActionCard
          variant="blue"
          href="/ministry/communication/new"
          title="New Message"
          subtitle="Click here to Send messages"
          icon={
            <span className="flex size-9 items-center justify-center rounded-full bg-white/20">
              <Plus className="size-5 text-white" />
            </span>
          }
        />
      </div>

      <TableCard
        title="Recent Messages"
        filterOptions={['Sent', 'Scheduled']}
        filterAll="All status"
      >
        <table className="w-full min-w-[880px] border-collapse">
            <thead>
              <tr className="text-left text-[13px] text-[#333]">
                {['Title', 'Recipients', 'Channels', 'Status', 'Date', 'Read Rate', 'Action'].map((h) => (
                  <th key={h} className="py-3 font-medium">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {MESSAGES.map((m, i) => (
                <tr key={i} className="border-t border-[#f2f2f2] text-[12px]">
                  <td className="py-4">{m.title}</td>
                  <td className="py-4">
                    <p>{m.recipients}</p>
                    <p className="text-brand-gray-500">245 recipients</p>
                  </td>
                  <td className="py-4">
                    <span className="flex items-center gap-2 text-brand-blue">
                      <Bell className="size-4" />
                      <Mail className="size-4" />
                    </span>
                  </td>
                  <td className="py-4">
                    <span
                      className={cn(
                        'rounded-full px-2.5 py-1 text-[11px] font-medium',
                        m.status === 'Sent'
                          ? 'bg-[#e7f7ee] text-[#34a853]'
                          : 'bg-[#fff4e5] text-[#ff8d28]'
                      )}
                    >
                      {m.status}
                    </span>
                  </td>
                  <td className="py-4">Jan 13, 2026</td>
                  <td className="py-4">
                    <span className="flex items-center gap-2">
                      <span className="h-1.5 w-[70px] rounded-full bg-[#eaeaea]">
                        <span
                          className={cn(
                            'block h-full rounded-full',
                            m.rate > 0 ? 'bg-[#34a853]' : 'bg-transparent'
                          )}
                          style={{ width: `${m.rate}%` }}
                        />
                      </span>
                      {m.rate}%
                    </span>
                  </td>
                  <td className="py-4">
                    <ReceiptButton highlighted={i === 0} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
      </TableCard>
    </div>
  );
}
