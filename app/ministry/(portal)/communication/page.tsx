'use client';

import { useState, useEffect } from 'react';
import { ReceiptButton } from '@/components/ministry/receipt-button';
import { TableCard } from '@/components/shared/table-card';
import { ActionCard, StatCard } from '@/components/ministry/shared';
import { cn } from '@/lib/utils';
import { Bell, Mail, Plus, X } from 'lucide-react';
import {
  getTenantCampaigns,
  cancelCampaign,
  updateTenantCampaign,
  getTenantCommunicationsSent,
  getTenantCommunicationRecipients,
  type CreateCampaignPayload,
} from '@/lib/api/tenant';
import { toast } from 'sonner';
import { Bar, BarChart, Cell, ResponsiveContainer, Tooltip, XAxis } from 'recharts';
import * as Dialog from '@radix-ui/react-dialog';

type Message = {
  id: string;
  title: string;
  recipients: string;
  status: string;
  rate: number;
  date?: string;
  recipientCount?: number;
  channels?: string[];
  batchId?: string;
};

type Recipient = { name?: string; email?: string; phone?: string; status?: string };

function EditCampaignModal({ msg, onClose, onSaved }: { msg: Message; onClose: () => void; onSaved: (id: string, updates: Partial<Message>) => void }) {
  const [form, setForm] = useState({ title: msg.title, recipients: msg.recipients });
  const [saving, setSaving] = useState(false);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload: Partial<CreateCampaignPayload> = { subject: form.title, audienceType: form.recipients };
      await updateTenantCampaign(msg.id, payload);
      onSaved(msg.id, { title: form.title, recipients: form.recipients });
      toast.success('Campaign updated.');
      onClose();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not update campaign.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog.Root open onOpenChange={(v) => { if (!v) onClose(); }}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/40" />
        <Dialog.Content className="fixed top-1/2 left-1/2 z-50 w-[94%] max-w-[460px] -translate-x-1/2 -translate-y-1/2 rounded-[16px] bg-white p-7">
          <div className="flex items-center justify-between mb-5">
            <Dialog.Title className="text-[18px] font-bold">Edit Campaign</Dialog.Title>
            <Dialog.Close className="flex size-8 items-center justify-center rounded-full border border-[#ddd]"><X className="size-4" /></Dialog.Close>
          </div>
          <form onSubmit={(e) => void handleSave(e)} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-[13px] font-medium">Subject</label>
              <input value={form.title} onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))} className="h-[42px] rounded-[8px] border border-[#ddd] px-3 text-[13px] outline-none focus:border-brand-blue" />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-[13px] font-medium">Audience</label>
              <input value={form.recipients} onChange={(e) => setForm((p) => ({ ...p, recipients: e.target.value }))} className="h-[42px] rounded-[8px] border border-[#ddd] px-3 text-[13px] outline-none focus:border-brand-blue" />
            </div>
            <div className="flex items-center justify-end gap-3 pt-1">
              <button type="button" onClick={onClose} className="text-[13px] text-brand-gray-500 hover:opacity-70">Cancel</button>
              <button type="submit" disabled={saving} className="h-[40px] rounded-[8px] bg-brand-blue px-5 text-[13px] font-medium text-white disabled:opacity-50">
                {saving ? 'Saving…' : 'Save'}
              </button>
            </div>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

export default function MinistryCommunicationPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [recipientsModal, setRecipientsModal] = useState<{ batchId: string; title: string } | null>(null);
  const [recipients, setRecipients] = useState<Recipient[]>([]);
  const [loadingRecipients, setLoadingRecipients] = useState(false);
  const [editingCampaign, setEditingCampaign] = useState<Message | null>(null);

  useEffect(() => {
    // Load campaigns (notification-based)
    getTenantCampaigns()
      .then((arr) => {
        const mapped: Message[] = arr.map((m) => ({
          id: String(m.id ?? ''),
          title: String(m.subject ?? m.name ?? ''),
          recipients: String(m.audienceType ?? ''),
          status: String(m.status ?? 'Sent'),
          rate: 0,
          date: String(m.sentAt ?? m.scheduledAt ?? m.createdAt ?? ''),
          batchId: undefined,
        })).filter((m) => m.title);
        setMessages(mapped);
      })
      .catch(() => { toast.error('Could not load messages.'); });

    // Also load sent communications
    getTenantCommunicationsSent()
      .then((page) => {
        type R = Record<string, unknown>;
        const items: R[] = Array.isArray(page) ? (page as R[]) : (Array.isArray((page as R)?.['content']) ? (page as R)['content'] as R[] : []);
        if (items.length === 0) return;
        const mapped: Message[] = items.map((m) => ({
          id: String(m['id'] ?? ''),
          title: String(m['subject'] ?? m['name'] ?? ''),
          recipients: String(m['audienceType'] ?? m['targetGroup'] ?? ''),
          status: 'Sent',
          rate: 0,
          date: String(m['sentAt'] ?? m['createdAt'] ?? ''),
          batchId: String(m['batchId'] ?? m['id'] ?? ''),
        })).filter((m) => m.title);
        if (mapped.length > 0) {
          setMessages((prev) => {
            const existingIds = new Set(prev.map((p) => p.id));
            const newOnes = mapped.filter((m) => !existingIds.has(m.id));
            return [...prev, ...newOnes];
          });
        }
      })
      .catch(() => {});
  }, []);

  function openRecipients(msg: Message) {
    if (!msg.batchId) return;
    setRecipientsModal({ batchId: msg.batchId, title: msg.title });
    setRecipients([]);
    setLoadingRecipients(true);
    getTenantCommunicationRecipients(msg.batchId)
      .then((data) => {
        type R = Record<string, unknown>;
        const arr: R[] = Array.isArray(data) ? (data as R[]) : [];
        setRecipients(arr.map((r) => ({
          name: String(r['name'] ?? r['fullName'] ?? r['username'] ?? ''),
          email: String(r['email'] ?? ''),
          phone: String(r['phone'] ?? r['phoneNumber'] ?? ''),
          status: String(r['status'] ?? r['deliveryStatus'] ?? ''),
        })));
      })
      .catch(() => { toast.error('Could not load recipients.'); })
      .finally(() => setLoadingRecipients(false));
  }

  function handleCampaignSaved(id: string, updates: Partial<Message>) {
    setMessages((prev) => prev.map((m) => m.id === id ? { ...m, ...updates } : m));
  }

  function handleCancel(msg: Message) {
    if (!msg.id) return;
    cancelCampaign(msg.id)
      .then(() => {
        setMessages((prev) => prev.map((m) => m.id === msg.id ? { ...m, status: 'Cancelled' } : m));
        toast.success('Campaign cancelled.');
      })
      .catch((e: unknown) => { toast.error(e instanceof Error ? e.message : 'Could not cancel campaign.'); });
  }

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
        <StatCard title="Total Sent" value={String(sentCount)} variant="green" />
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
                <tr key={m.id || i} className="border-t border-[#f2f2f2] text-[12px]">
                  <td className="py-4">{m.title}</td>
                  <td className="py-4">
                    <p>{m.recipients}</p>
                    <p className="text-brand-gray-500">{m.recipientCount != null ? `${m.recipientCount} recipients` : ''}</p>
                    {m.batchId && (
                      <button
                        type="button"
                        onClick={() => openRecipients(m)}
                        className="text-[11px] text-brand-blue underline hover:no-underline"
                      >
                        View recipients
                      </button>
                    )}
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
                        m.status === 'Sent' || m.status === 'SENT'
                          ? 'bg-[#e7f7ee] text-[#34a853]'
                          : m.status === 'Cancelled' || m.status === 'CANCELLED'
                          ? 'bg-[#fde8e8] text-[#eb0000]'
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
                    <span className="flex items-center gap-2">
                      <ReceiptButton highlighted={i === 0} name={m.recipients} date={m.date} />
                      {(m.status === 'Scheduled' || m.status === 'SCHEDULED' || m.status === 'Pending') && m.id && (
                        <>
                          <button
                            type="button"
                            onClick={() => setEditingCampaign(m)}
                            className="text-[11px] font-medium text-brand-blue hover:underline"
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            onClick={() => handleCancel(m)}
                            className="text-[11px] font-medium text-[#eb0000] hover:underline"
                          >
                            Cancel
                          </button>
                        </>
                      )}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
      </TableCard>

      {/* Recipients Modal */}
      <Dialog.Root open={!!recipientsModal} onOpenChange={(v) => { if (!v) setRecipientsModal(null); }}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 z-50 bg-black/40 data-[state=open]:animate-in data-[state=open]:fade-in-0" />
          <Dialog.Content className="fixed top-1/2 left-1/2 z-50 w-[92%] max-w-[500px] max-h-[80vh] -translate-x-1/2 -translate-y-1/2 overflow-hidden rounded-[16px] bg-white data-[state=open]:animate-in data-[state=open]:zoom-in-95 flex flex-col">
            <div className="flex items-start justify-between p-6 pb-4">
              <div>
                <Dialog.Title className="text-[18px] font-bold">Recipients</Dialog.Title>
                <p className="text-[12px] text-brand-gray-500 mt-0.5">{recipientsModal?.title}</p>
              </div>
              <Dialog.Close aria-label="Close">
                <span className="flex size-8 items-center justify-center rounded-full border border-[#ddd]">
                  <X className="size-4" />
                </span>
              </Dialog.Close>
            </div>
            <div className="overflow-y-auto px-6 pb-6">
              {loadingRecipients ? (
                <p className="py-8 text-center text-[13px] text-brand-gray-500">Loading…</p>
              ) : recipients.length === 0 ? (
                <p className="py-8 text-center text-[13px] text-brand-gray-500">No recipients found</p>
              ) : (
                <table className="w-full border-collapse text-[12px]">
                  <thead>
                    <tr className="text-left text-[11px] text-brand-gray-500">
                      {['Name', 'Email', 'Status'].map((h) => (
                        <th key={h} className="py-2 font-medium">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {recipients.map((r, i) => (
                      <tr key={i} className="border-t border-[#f2f2f2]">
                        <td className="py-2.5">{r.name || '—'}</td>
                        <td className="py-2.5 text-brand-gray-500">{r.email || '—'}</td>
                        <td className="py-2.5">{r.status || '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>

      {editingCampaign && (
        <EditCampaignModal
          msg={editingCampaign}
          onClose={() => setEditingCampaign(null)}
          onSaved={handleCampaignSaved}
        />
      )}
    </div>
  );
}
