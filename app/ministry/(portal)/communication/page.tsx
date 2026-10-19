'use client';

import { useState, useEffect } from 'react';
import { ReceiptButton } from '@/components/ministry/receipt-button';
import { TableCard } from '@/components/shared/table-card';
import { ActionCard, StatCard } from '@/components/ministry/shared';
import { cn } from '@/lib/utils';
import { Bell, Mail, Plus } from 'lucide-react';
import { api } from '@/lib/api/client';
import { USE_LIVE_API } from '@/lib/api/config';

type Message = { title: string; recipients: string; status: string; rate: number; date?: string; recipientCount?: number; channels?: string[] };

const MESSAGES: Message[] = [
  { title: 'Midweek Recharge', recipients: 'All Sub Accounts', status: 'Sent', rate: 100 },
  { title: 'Sunday Service Reminder', recipients: 'Group Leaders', status: 'Sent', rate: 100 },
  { title: 'Midweek Recharge', recipients: 'All Member', status: 'Scheduled', rate: 0 },
  { title: 'Midweek Recharge', recipients: 'All Sub Accounts', status: 'Sent', rate: 100 },
  { title: 'Midweek Recharge', recipients: 'All Sub Accounts', status: 'Sent', rate: 100 },
  { title: 'Midweek Recharge', recipients: 'All Sub Accounts', status: 'Sent', rate: 100 },
];

export default function MinistryCommunicationPage() {
  const [messages, setMessages] = useState<Message[]>(MESSAGES);
  const [activeRecipients, setActiveRecipients] = useState('260');

  useEffect(() => {
    if (!USE_LIVE_API) return;
    (api.get<unknown>('/tenant/admin/communications') as Promise<unknown>)
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
        const mapped: Message[] = arr.map((m) => ({
          title: String(m['subject'] ?? m['title'] ?? m['name'] ?? ''),
          recipients: String(m['recipientGroup'] ?? m['recipients'] ?? m['target'] ?? ''),
          status: String(m['status'] ?? m['deliveryStatus'] ?? 'Sent'),
          rate: Number(m['readRate'] ?? m['openRate'] ?? m['deliveryRate'] ?? 0),
          date: String(m['sentAt'] ?? m['scheduledAt'] ?? m['createdAt'] ?? ''),
          recipientCount: m['recipientCount'] != null ? Number(m['recipientCount']) : m['totalRecipients'] != null ? Number(m['totalRecipients']) : undefined,
          channels: Array.isArray(m['channels']) ? (m['channels'] as string[]).map(String) : Array.isArray(m['deliveryChannels']) ? (m['deliveryChannels'] as string[]).map(String) : undefined,
        })).filter((m) => m.title);
        if (mapped.length > 0) setMessages(mapped);
      })
      .catch(() => {});
    (api.get<Record<string, unknown>>('/tenant/admin/members/count') as Promise<Record<string, unknown>>)
      .catch(() => api.get<Record<string, unknown>>('/tenant/admin/communications/stats') as Promise<Record<string, unknown>>)
      .then((d) => {
        const count = d['activeCount'] ?? d['active'] ?? d['count'] ?? d['total'] ?? d['activeRecipients'];
        if (count != null) setActiveRecipients(String(count));
      })
      .catch(() => {});
  }, []);

  const sentCount = messages.filter((m) => m.status === 'Sent' || m.status === 'SENT').length;
  const scheduledCount = messages.filter((m) => m.status === 'Scheduled' || m.status === 'SCHEDULED').length;

  return (
    <div className="flex flex-col gap-5">
      <h1 className="text-[26px] font-bold lg:text-[32px]">Communication</h1>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
        <StatCard title="Total Messages" value={String(messages.length)} variant="white" subtitle="12% from last week" />
        <StatCard title="Active Recipients" value={activeRecipients} variant="green" subtitle="5% from last week" />
        <StatCard title="Sent Messages" value={String(sentCount)} variant="white" subtitle="Click here to create group" />
        <StatCard title="Scheduled" value={String(scheduledCount)} variant="white" subtitle="Click here to create group" />
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
              {messages.map((m, i) => (
                <tr key={i} className="border-t border-[#f2f2f2] text-[12px]">
                  <td className="py-4">{m.title}</td>
                  <td className="py-4">
                    <p>{m.recipients}</p>
                    <p className="text-brand-gray-500">{m.recipientCount != null ? `${m.recipientCount} recipients` : '245 recipients'}</p>
                  </td>
                  <td className="py-4">
                    <span className="flex items-center gap-2 text-brand-blue">
                      {(!m.channels || m.channels.some((c) => /push|notif|bell/i.test(c))) && <Bell className="size-4" />}
                      {(!m.channels || m.channels.some((c) => /email|mail/i.test(c))) && <Mail className="size-4" />}
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
                  <td className="py-4">{m.date ? new Date(m.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—'}</td>
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
                    <ReceiptButton highlighted={i === 0} name={m.recipients} date={m.date} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
      </TableCard>
    </div>
  );
}
