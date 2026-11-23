'use client';

import { useState, useEffect } from 'react';
import { ReceiptButton } from '@/components/ministry/receipt-button';
import { TableCard } from '@/components/shared/table-card';
import { ActionCard, StatCard } from '@/components/ministry/shared';
import { cn } from '@/lib/utils';
import { Bell, Mail, Plus } from 'lucide-react';
import { getTenantCampaigns } from '@/lib/api/tenant';
import { toast } from 'sonner';
import { Bar, BarChart, Cell, ResponsiveContainer, Tooltip, XAxis } from 'recharts';

type Message = { title: string; recipients: string; status: string; rate: number; date?: string; recipientCount?: number; channels?: string[] };

export default function MinistryCommunicationPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [activeRecipients, setActiveRecipients] = useState('0');

  useEffect(() => {
    getTenantCampaigns()
      .then((arr) => {
        if (arr.length === 0) return;
        const mapped: Message[] = arr.map((m) => ({
          title: String(m.subject ?? m.name ?? ''),
          recipients: String(m.audienceType ?? ''),
          status: String(m.status ?? 'Sent'),
          rate: 0,
          date: String(m.sentAt ?? m.scheduledAt ?? m.createdAt ?? ''),
        })).filter((m) => m.title);
        if (mapped.length > 0) setMessages(mapped);
      })
      .catch(() => { toast.error('Could not load messages.'); });
    // /tenant/admin/members/count not in backend API — disabled.
  }, []);

  const unreadCount = messages.filter((m) => !m.title.includes('READ') && (m.rate === 0 || m.rate == null)).length;
  const scheduledCount = messages.filter((m) => m.status === 'Scheduled' || m.status === 'SCHEDULED').length;
  const sentCount = messages.filter((m) => m.status === 'Sent' || m.status === 'SENT').length;

  const statusData = [
    { name: 'Sent', value: sentCount },
    { name: 'Scheduled', value: scheduledCount },
    { name: 'Unread', value: unreadCount },
  ].filter((d) => d.value > 0);
  const STATUS_COLORS = ['#243f84', '#ff8d28', '#c8d4f5'];

  return (
    <div className="flex flex-col gap-5">
      <h1 className="text-[26px] font-bold lg:text-[32px]">Communication</h1>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
        <StatCard title="Total Messages" value={String(messages.length)} variant="white" trend={[1,2,2,3,3,4,messages.length]} />
        <StatCard title="Active Recipients" value={activeRecipients} variant="green" />
        <StatCard title="Unread Messages" value={String(unreadCount)} variant="white" />
        <StatCard title="Scheduled" value={String(scheduledCount)} variant="white" />
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

      {messages.length > 0 && statusData.length > 0 && (
        <div className="rounded-[14px] bg-white p-6">
          <p className="text-[16px] font-bold">Message Status Breakdown</p>
          <p className="mt-0.5 text-[13px] text-brand-gray-500">Distribution by delivery status</p>
          <div className="mt-4 h-[150px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={statusData} margin={{ top: 4, right: 8, bottom: 0, left: 0 }}>
                <XAxis dataKey="name" tickLine={false} axisLine={false} tick={{ fontSize: 11 }} />
                <Tooltip formatter={(v) => [String(v), 'Messages']} />
                <Bar dataKey="value" radius={[4, 4, 0, 0]} barSize={48} isAnimationActive={false}>
                  {statusData.map((_, i) => <Cell key={i} fill={STATUS_COLORS[i % STATUS_COLORS.length]} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

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
                    <p className="text-brand-gray-500">{m.recipientCount != null ? `${m.recipientCount} recipients` : ''}</p>
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
