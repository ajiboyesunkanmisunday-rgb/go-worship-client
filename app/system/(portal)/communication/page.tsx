'use client';

import { useState, useEffect } from 'react';
import { Bell, Mail, MessageSquare, Send, Users, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  sendSystemCommunication,
  getSystemCommunicationsSent,
  getSystemCommunicationRecipients,
  getSystemCommunicationTargets,
} from '@/lib/api/system';
import { toast } from 'sonner';
import * as Dialog from '@radix-ui/react-dialog';

type SentBatch = {
  id: string;
  subject: string;
  channels: string[];
  sentAt: string;
  recipientCount: number;
};

function parseSent(data: unknown): SentBatch[] {
  type R = Record<string, unknown>;
  let arr: R[] = [];
  if (Array.isArray(data)) arr = data as R[];
  else if (data && typeof data === 'object') {
    const d = data as R;
    for (const k of ['content', 'data', 'items', 'results']) {
      if (Array.isArray(d[k])) { arr = d[k] as R[]; break; }
    }
  }
  return arr.map((b) => ({
    id: String(b['id'] ?? b['batchId'] ?? ''),
    subject: String(b['subject'] ?? b['title'] ?? b['name'] ?? ''),
    channels: Array.isArray(b['channels']) ? (b['channels'] as string[]) : [],
    sentAt: String(b['sentAt'] ?? b['createdAt'] ?? ''),
    recipientCount: Number(b['recipientCount'] ?? b['recipients'] ?? 0),
  })).filter((b) => b.id);
}

type Target = { id?: string; name?: string; type?: string; label?: string };

const CHANNELS = [
  { key: 'push', label: 'Push', icon: Bell },
  { key: 'email', label: 'Email', icon: Mail },
  { key: 'sms', label: 'SMS', icon: MessageSquare },
];

export default function SystemCommunicationPage() {
  const [sent, setSent] = useState<SentBatch[]>([]);
  const [targets, setTargets] = useState<Target[]>([]);
  const [channels, setChannels] = useState<string[]>(['push', 'email']);
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [audienceType, setAudienceType] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [recipientsModal, setRecipientsModal] = useState<{ batchId: string; subject: string } | null>(null);
  const [recipients, setRecipients] = useState<unknown[]>([]);
  const [recipientsLoading, setRecipientsLoading] = useState(false);

  useEffect(() => {
    getSystemCommunicationsSent(0, 50)
      .then((data) => { setSent(parseSent(data)); })
      .catch(() => {});
    getSystemCommunicationTargets()
      .then((arr) => { setTargets(arr as Target[]); })
      .catch(() => {});
  }, []);

  const toggle = (k: string) =>
    setChannels((c) => (c.includes(k) ? c.filter((x) => x !== k) : [...c, k]));

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject.trim() || !body.trim()) {
      toast.error('Subject and message are required.');
      return;
    }
    setSubmitting(true);
    try {
      await sendSystemCommunication({
        subject: subject.trim(),
        body: body.trim(),
        audienceType: audienceType || undefined,
        channels,
      });
      toast.success('Communication sent.');
      setSubject(''); setBody(''); setAudienceType(''); setChannels(['push', 'email']);
      getSystemCommunicationsSent(0, 50)
        .then((data) => { setSent(parseSent(data)); })
        .catch(() => {});
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to send.');
    } finally {
      setSubmitting(false);
    }
  };

  const openRecipients = (batch: SentBatch) => {
    setRecipientsModal({ batchId: batch.id, subject: batch.subject });
    setRecipients([]);
    setRecipientsLoading(true);
    getSystemCommunicationRecipients(batch.id)
      .then((arr) => setRecipients(arr))
      .catch(() => toast.error('Could not load recipients.'))
      .finally(() => setRecipientsLoading(false));
  };

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-start gap-4">
        <span className="flex size-11 shrink-0 items-center justify-center rounded-[10px] bg-[#e9f0ff]">
          <Send className="size-5 text-brand-blue" />
        </span>
        <div>
          <h1 className="text-[26px] font-bold lg:text-[32px]">Communications</h1>
          <p className="mt-1 text-[14px] text-brand-gray-500">Send platform-wide messages to tenants</p>
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-[1fr_380px]">
        {/* Compose */}
        <div className="rounded-[14px] bg-white p-6">
          <p className="text-[16px] font-bold">New Message</p>
          <form onSubmit={(e) => void handleSend(e)} className="mt-5 flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-[13px] font-medium">Subject <span className="text-[#eb0000]">*</span></label>
              <input
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                required
                className="h-[42px] rounded-[8px] border border-[#ddd] px-3 text-[13px] outline-none focus:border-brand-blue"
                placeholder="Message subject"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[13px] font-medium">Audience</label>
              <select
                value={audienceType}
                onChange={(e) => setAudienceType(e.target.value)}
                className="h-[42px] rounded-[8px] border border-[#ddd] px-3 text-[13px] outline-none focus:border-brand-blue bg-white"
              >
                <option value="">All tenants</option>
                {targets.length > 0 ? (
                  targets.map((t, i) => (
                    <option key={t.id ?? i} value={String(t.id ?? t.type ?? t.name ?? '')}>
                      {t.label ?? t.name ?? t.type ?? String(t.id ?? '')}
                    </option>
                  ))
                ) : null}
              </select>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[13px] font-medium">Channels</label>
              <div className="flex flex-wrap gap-2">
                {CHANNELS.map((c) => {
                  const on = channels.includes(c.key);
                  return (
                    <button
                      key={c.key}
                      type="button"
                      onClick={() => toggle(c.key)}
                      className={cn(
                        'flex items-center gap-2 rounded-[8px] border px-3 py-2 text-[13px] transition-colors',
                        on
                          ? 'border-brand-blue bg-[#e9f0ff] font-medium text-brand-blue'
                          : 'border-[#e5e5e5] text-[#333] hover:bg-[#f7f9fc]'
                      )}
                    >
                      <c.icon className="size-4" />
                      {c.label}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[13px] font-medium">Message <span className="text-[#eb0000]">*</span></label>
              <textarea
                value={body}
                onChange={(e) => setBody(e.target.value)}
                required
                rows={5}
                className="rounded-[8px] border border-[#ddd] px-3 py-2.5 text-[13px] outline-none focus:border-brand-blue resize-none"
                placeholder="Write your message…"
              />
            </div>

            <button
              type="submit"
              disabled={submitting || !subject.trim() || !body.trim()}
              className="flex h-[44px] items-center justify-center gap-2 rounded-[8px] bg-brand-blue text-[13px] font-medium text-white disabled:opacity-50"
            >
              <Send className="size-4" />
              {submitting ? 'Sending…' : 'Send Message'}
            </button>
          </form>
        </div>

        {/* Sent history */}
        <div className="rounded-[14px] bg-white p-6">
          <p className="text-[16px] font-bold">Sent Messages</p>
          <div className="mt-4 flex flex-col gap-3">
            {sent.length === 0 ? (
              <p className="py-8 text-center text-[13px] text-brand-gray-500">No messages sent yet</p>
            ) : (
              sent.map((b) => (
                <div key={b.id} className="rounded-[10px] border border-[#f0f0f0] p-4">
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-[13px] font-medium text-[#333] leading-snug">{b.subject}</p>
                    <button
                      type="button"
                      onClick={() => openRecipients(b)}
                      title="View recipients"
                      className="shrink-0 text-brand-gray-500 hover:text-brand-blue"
                    >
                      <Users className="size-4" />
                    </button>
                  </div>
                  <div className="mt-2 flex items-center gap-3 text-[11px] text-brand-gray-500">
                    {b.channels.map((ch) => (
                      <span key={ch} className="rounded-full bg-[#f2f2f2] px-2 py-0.5">{ch}</span>
                    ))}
                    {b.sentAt && (
                      <span>{new Date(b.sentAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                    )}
                    {b.recipientCount > 0 && <span>{b.recipientCount} recipients</span>}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Recipients modal */}
      <Dialog.Root open={!!recipientsModal} onOpenChange={(v) => { if (!v) setRecipientsModal(null); }}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 z-50 bg-black/40" />
          <Dialog.Content className="fixed top-1/2 left-1/2 z-50 w-[94%] max-w-[500px] max-h-[70vh] -translate-x-1/2 -translate-y-1/2 overflow-hidden rounded-[16px] bg-white flex flex-col">
            <div className="flex items-center justify-between p-6 pb-4 border-b border-[#eee]">
              <div>
                <Dialog.Title className="text-[18px] font-bold">Recipients</Dialog.Title>
                {recipientsModal && <p className="text-[12px] text-brand-gray-500 mt-0.5">{recipientsModal.subject}</p>}
              </div>
              <Dialog.Close className="flex size-8 items-center justify-center rounded-full border border-[#ddd]">
                <X className="size-4" />
              </Dialog.Close>
            </div>
            <div className="overflow-y-auto px-6 pb-6 pt-4">
              {recipientsLoading ? (
                <p className="py-8 text-center text-[13px] text-brand-gray-500">Loading…</p>
              ) : recipients.length === 0 ? (
                <p className="py-8 text-center text-[13px] text-brand-gray-500">No recipients found</p>
              ) : (
                <div className="flex flex-col gap-2">
                  {recipients.map((r, i) => {
                    const rec = r as Record<string, unknown>;
                    const name = String(rec['name'] ?? rec['orgName'] ?? rec['tenantName'] ?? '');
                    const email = String(rec['email'] ?? rec['adminEmail'] ?? '');
                    return (
                      <div key={i} className="flex items-center justify-between rounded-[8px] bg-[#f8f8f8] px-3 py-2.5">
                        <span className="text-[13px] font-medium">{name || `Tenant ${i + 1}`}</span>
                        {email && <span className="text-[12px] text-brand-gray-500">{email}</span>}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </div>
  );
}
