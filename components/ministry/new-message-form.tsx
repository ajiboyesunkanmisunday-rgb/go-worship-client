'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  NativeSelect,
  NativeSelectOption,
} from '@/components/ui/native-select';
import { Textarea } from '@/components/ui/textarea';
import { SheetPage } from '@/components/ui/sheet-page';
import { cn } from '@/lib/utils';
import { ArrowLeft, Bell, Mail, MessageSquare } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { FormEvent, useState } from 'react';
import { api } from '@/lib/api/client';
import { USE_LIVE_API } from '@/lib/api/config';

function Field({
  label,
  children,
}: {
  label: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-[13px] font-medium text-[#333]">{label}</label>
      {children}
    </div>
  );
}

const CHANNELS = [
  { key: 'push', label: 'Push notification', icon: Bell },
  { key: 'email', label: 'Email', icon: Mail },
  { key: 'sms', label: 'SMS', icon: MessageSquare },
];

/**
 * Communication → New Message compose slide-over.
 *
 * NOTE: there is no located Figma frame for this compose form. Node 649:38992
 * ("Communication (New message)") is the LIST page — stat cards + a Recent
 * Messages table whose columns are Title / Recipients / Channels / Status /
 * Date / Read Rate. This form's fields are inferred from those columns
 * (Title, Recipients, Channels, Message) plus a schedule option; the design
 * has not been confirmed. Flagged in docs/design-audit.md for the designer.
 */
export function NewMessageForm() {
  const router = useRouter();
  const back = '/ministry/communication';
  const [channels, setChannels] = useState<string[]>(['push', 'email']);
  const [schedule, setSchedule] = useState(false);

  const toggle = (k: string) =>
    setChannels((c) => (c.includes(k) ? c.filter((x) => x !== k) : [...c, k]));

  const onSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    if (USE_LIVE_API) {
      const payload = {
        title: String(fd.get('title') ?? ''),
        recipients: String(fd.get('recipients') ?? ''),
        channels,
        body: String(fd.get('body') ?? ''),
        scheduledAt: schedule ? String(fd.get('scheduledAt') ?? '') : undefined,
      };
      try {
        await (api.post('/tenant/admin/notifications/campaigns', payload) as Promise<unknown>);
      } catch {}
    }
    router.push(back);
  };

  return (
    <SheetPage
      className="w-full max-w-[665px]!"
      backLink={back}
      title="New Message"
    >
      <div className="flex h-full w-full flex-col gap-6 overflow-y-auto px-6 pt-[64px] pb-10 md:px-[60px]">
        <button
          type="button"
          onClick={() => router.push(back)}
          aria-label="Go back"
          className="w-fit text-black transition-opacity hover:opacity-70"
        >
          <ArrowLeft className="size-6" />
        </button>

        <div className="text-center">
          <h1 className="text-[24px] font-bold">New Message</h1>
          <p className="mt-1 text-[13px] text-brand-gray-500">
            Send an announcement to your church members.
          </p>
        </div>

        <form className="flex flex-col gap-5" onSubmit={onSubmit}>
          <Field label={<>Title&#42;</>}>
            <Input name="title" className="h-[48px]" placeholder="Enter message title" />
          </Field>

          <Field label={<>Recipients&#42;</>}>
            <NativeSelect name="recipients" className="h-[48px]" defaultValue="">
              <NativeSelectOption value="">Select recipients</NativeSelectOption>
              <NativeSelectOption value="all">All Sub Accounts</NativeSelectOption>
              <NativeSelectOption value="members">All Members</NativeSelectOption>
              <NativeSelectOption value="leaders">Group Leaders</NativeSelectOption>
              <NativeSelectOption value="staff">Staff / Volunteers</NativeSelectOption>
            </NativeSelect>
          </Field>

          <Field label={<>Channels&#42;</>}>
            <div className="flex flex-wrap gap-3">
              {CHANNELS.map((c) => {
                const on = channels.includes(c.key);
                return (
                  <button
                    key={c.key}
                    type="button"
                    onClick={() => toggle(c.key)}
                    className={cn(
                      'flex items-center gap-2 rounded-[8px] border px-4 py-2.5 text-[13px] transition-colors',
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
          </Field>

          <Field label={<>Message&#42;</>}>
            <Textarea
              name="body"
              className="min-h-[140px]"
              placeholder="Write your message..."
            />
          </Field>

          <label className="flex items-center gap-2 text-[13px]">
            <input
              type="checkbox"
              checked={schedule}
              onChange={(e) => setSchedule(e.target.checked)}
              className="size-4 accent-brand-blue"
            />
            Schedule for later
          </label>

          {schedule && (
            <Field label="Send at">
              <Input name="scheduledAt" type="datetime-local" className="h-[48px]" />
            </Field>
          )}

          <Button size="lg" type="submit" className="mt-1 h-[52px] w-full">
            {schedule ? 'Schedule Message' : 'Send Message'}
          </Button>
          <Button asChild size="lg" variant="outline" className="h-[52px] w-full">
            <button type="button" onClick={() => router.push(back)}>
              Save as Draft
            </button>
          </Button>
        </form>
      </div>
    </SheetPage>
  );
}
