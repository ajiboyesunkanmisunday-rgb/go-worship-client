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
import { ArrowLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { FormEvent, useState, useEffect } from 'react';
import { getTenantGroup, createTenantGroup, updateTenantGroup, getTenantMembers, type TenantGroup, type TenantMember } from '@/lib/api/tenant';
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
      <label className="text-[14px] font-medium text-[#333]">{label}</label>
      {children}
    </div>
  );
}

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const H = 'h-[48px]';

function Toggle({ label }: { label: string }) {
  const [on, setOn] = useState(false);
  return (
    <div className="flex items-center justify-between">
      <span className="text-[14px] font-medium text-[#333]">{label}</span>
      <button
        type="button"
        onClick={() => setOn((v) => !v)}
        className={cn(
          'flex h-6 w-11 items-center rounded-full p-0.5 transition-colors',
          on ? 'bg-brand-blue' : 'bg-[#d9d9d9]'
        )}
      >
        <span
          className={cn(
            'size-5 rounded-full bg-white transition-transform',
            on && 'translate-x-5'
          )}
        />
      </button>
    </div>
  );
}

export function CreateGroupForm({
  basePath = '/group-leader/groups',
  mode = 'create',
  id,
}: {
  basePath?: string;
  mode?: 'create' | 'edit';
  id?: string;
} = {}) {
  const router = useRouter();
  const isEdit = mode === 'edit';
  const [group, setGroup] = useState<TenantGroup | null>(null);
  const MOCK_LEADERS = [
    { id: '1', name: 'Pastor Val Ejima' },
    { id: '2', name: 'Isreal Marcelo' },
    { id: '3', name: 'Mary Napoleon' },
  ];
  const [leaders, setLeaders] = useState<{ id: string; name: string }[]>(USE_LIVE_API ? [] : MOCK_LEADERS);

  useEffect(() => {
    if (!isEdit || !USE_LIVE_API || !id) return;
    getTenantGroup(id).then((g: TenantGroup | null) => { if (g) setGroup(g); }).catch(() => {});
  }, [id, isEdit]);

  useEffect(() => {
    if (!USE_LIVE_API) return;
    getTenantMembers().then((members: TenantMember[]) => {
      const mapped = members.filter((m) => m.name).map((m) => ({ id: m.id, name: m.name }));
      if (mapped.length > 0) setLeaders(mapped);
    }).catch(() => {});
  }, []);

  const [submitting, setSubmitting] = useState(false);

  const onSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!USE_LIVE_API) { router.push(`${basePath}/success`); return; }
    const fd = new FormData(e.currentTarget);
    const payload = {
      name: String(fd.get('name') ?? ''),
      type: String(fd.get('type') ?? ''),
      description: String(fd.get('description') ?? ''),
      meetingFrequency: String(fd.get('meetingFrequency') ?? ''),
      meetingTime: String(fd.get('meetingTime') ?? ''),
      meetingType: String(fd.get('meetingType') ?? ''),
      venueName: String(fd.get('venueName') ?? ''),
      onlineMeetingLink: String(fd.get('onlineMeetingLink') ?? ''),
    };
    try {
      setSubmitting(true);
      if (isEdit && id) { await updateTenantGroup(id, payload); }
      else { await createTenantGroup(payload); }
      router.push(`${basePath}/success`);
    } catch {
      router.push(`${basePath}/success`);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SheetPage
      className="w-full max-w-[665px]!"
      backLink={basePath}
      title={isEdit ? 'Edit Group' : 'Create Group'}
    >
      <div className="flex h-full w-full flex-col gap-6 overflow-y-auto px-6 pt-[64px] pb-10 md:px-[60px]">
        <button
          type="button"
          onClick={() => router.push(basePath)}
          aria-label="Go back"
          className="text-black transition-opacity hover:opacity-70"
        >
          <ArrowLeft className="size-6" />
        </button>

        <h1 className="text-center text-[24px] font-bold">
          {isEdit ? 'Edit Group' : 'Create Group'}
        </h1>

        <form className="flex flex-col gap-5" onSubmit={onSubmit}>
          <Field label={<>Group Name&#42;</>}>
            <Input
              name="name"
              className={H}
              placeholder="Enter group name"
              defaultValue={group?.name ?? (isEdit ? 'Faith Builders Fellowship' : undefined)}
            />
          </Field>

          <Field label={<>Group Category / Type&#42;</>}>
            <NativeSelect name="type" className={H} defaultValue="">
              <NativeSelectOption value="">Select group category</NativeSelectOption>
              <NativeSelectOption value="small">Small Group</NativeSelectOption>
              <NativeSelectOption value="bible">Bible Study</NativeSelectOption>
              <NativeSelectOption value="history">History</NativeSelectOption>
              <NativeSelectOption value="youth">Youth</NativeSelectOption>
              <NativeSelectOption value="women">Women</NativeSelectOption>
              <NativeSelectOption value="prayer">Prayer Group</NativeSelectOption>
            </NativeSelect>
          </Field>

          <Field label={<>Date &amp; Time&#42;</>}>
            <Input type="datetime-local" className={H} />
          </Field>

          <Field label={<>Group Description&#42;</>}>
            <Textarea
              name="description"
              className="min-h-[110px]"
              placeholder="Enter brief description"
              defaultValue={group?.description ?? undefined}
            />
          </Field>

          <Field label={<>Group Leader&#42;</>}>
            <NativeSelect name="leaderId" className={H} defaultValue="">
              <NativeSelectOption value="">Select group leader</NativeSelectOption>
              {leaders.map((l) => (
                <NativeSelectOption key={l.id} value={l.id}>{l.name}</NativeSelectOption>
              ))}
            </NativeSelect>
          </Field>

          <Field label={<>Meeting Frequency&#42;</>}>
            <NativeSelect name="meetingFrequency" className={H} defaultValue="">
              <NativeSelectOption value="">Select Meetings</NativeSelectOption>
              <NativeSelectOption value="weekly">Weekly</NativeSelectOption>
              <NativeSelectOption value="biweekly">Bi-Weekly</NativeSelectOption>
              <NativeSelectOption value="monthly">Monthly</NativeSelectOption>
            </NativeSelect>
          </Field>

          <Field label={<>Meeting Day&#42;</>}>
            <div className="flex flex-col gap-2 rounded-[6px] border border-[#e5e5e5] p-3">
              {DAYS.map((d) => (
                <label key={d} className="flex items-center gap-2 text-[14px]">
                  <input type="checkbox" className="size-4 accent-brand-blue" />
                  {d}
                </label>
              ))}
            </div>
          </Field>

          <Field label={<>Meeting Time&#42;</>}>
            <Input name="meetingTime" type="time" className={H} />
          </Field>

          <Field label={<>Meeting Type&#42;</>}>
            <NativeSelect name="meetingType" className={H} defaultValue="">
              <NativeSelectOption value="">Select meeting type</NativeSelectOption>
              <NativeSelectOption value="weekly">Weekly</NativeSelectOption>
              <NativeSelectOption value="biweekly">Bi-Weekly</NativeSelectOption>
              <NativeSelectOption value="monthly">Monthly</NativeSelectOption>
            </NativeSelect>
          </Field>

          <Field label={<>Event Kind&#42;</>}>
            <Input name="eventKind" className={H} placeholder="Select event kind" />
          </Field>

          <Field label={<>Venue Name&#42;</>}>
            <Input
              name="venueName"
              className={H}
              placeholder="Add venue name"
              defaultValue={isEdit ? 'Canada Ontario' : undefined}
            />
          </Field>

          <Field label={<>Online Meeting Link&#42;</>}>
            <Input
              name="onlineMeetingLink"
              className={H}
              placeholder="Add Zoom, Google Meet, or custom link"
              defaultValue={isEdit ? 'http://zoom/canadachurch.com' : undefined}
            />
          </Field>

          {/*
            The design's "Create Group (Hybrid)" frame (370:12706) — the most
            complete variant — has exactly these two toggles. An earlier note
            claimed a "Generate QR code" toggle belonged here; the frame's own
            metadata shows no such control, so it's been removed. QR generation
            lives in the group-overview (view) flow, not create.
          */}
          <Toggle label="Activate Group" />
          <Toggle label="Show Group Publicly" />

          <Button size="lg" type="submit" className="mt-2 h-[52px] w-full" disabled={submitting}>
            {submitting ? 'Saving…' : (isEdit ? 'Save Changes' : 'Create Group')}
          </Button>
          <Button
            asChild
            size="lg"
            variant="outline"
            className="h-[52px] w-full"
          >
            <button
              type="button"
              onClick={() => router.push(basePath)}
            >
              Cancel
            </button>
          </Button>
        </form>
      </div>
    </SheetPage>
  );
}
