'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { NativeSelect, NativeSelectOption } from '@/components/ui/native-select';
import { SheetPage } from '@/components/ui/sheet-page';
import { ArrowLeft, Pencil } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { FormEvent, useEffect, useState } from 'react';
import { api } from '@/lib/api/client';
import { getTenantMember, type TenantMember } from '@/lib/api/tenant';
import { USE_LIVE_API } from '@/lib/api/config';
import { use } from 'react';

const back = '/ministry/members';

const MOCK: TenantMember = {
  id: 'M-001',
  name: 'John Adeyemi',
  email: 'john@example.com',
  phone: '+1 555-0101',
  status: 'Active',
  joinedAt: 'Jan 12, 2025',
  groups: [],
};

export default function MinistryEditMemberPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const [member, setMember] = useState<TenantMember>(MOCK);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!USE_LIVE_API) return;
    getTenantMember(id).then((m) => { if (m) setMember(m); }).catch(() => {});
  }, [id]);

  const onSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (USE_LIVE_API) {
      const fd = new FormData(e.currentTarget);
      const payload = {
        displayName: String(fd.get('name') ?? ''),
        phone: String(fd.get('phone') ?? '') || undefined,
        status: String(fd.get('status') ?? 'ACTIVE'),
      };
      try {
        setSubmitting(true);
        await (api.put(`/tenant/admin/users/${id}`, payload) as Promise<unknown>)
          .catch(() => api.patch(`/tenant/admin/users/${id}`, payload) as Promise<unknown>);
      } catch {
        // fall through to navigate
      } finally {
        setSubmitting(false);
      }
    }
    router.push(back);
  };

  return (
    <SheetPage className="w-full max-w-[665px]!" backLink={back} title="Edit Member">
      <div className="flex h-full w-full flex-col gap-6 overflow-y-auto px-6 pt-[64px] pb-10 md:px-[60px]">
        <button
          type="button"
          onClick={() => router.push(`${back}/${id}`)}
          aria-label="Go back"
          className="w-fit text-black transition-opacity hover:opacity-70"
        >
          <ArrowLeft className="size-6" />
        </button>

        <div className="text-center">
          <h1 className="text-[24px] font-bold">Edit Member</h1>
          <p className="mt-1 text-[13px] text-brand-gray-500">Update member information below.</p>
        </div>

        <form className="flex flex-col gap-5" onSubmit={onSubmit}>
          <div className="flex flex-col gap-1.5">
            <label className="text-[13px] font-medium text-[#333]">Full Name&#42;</label>
            <div className="relative">
              <Input name="name" defaultValue={member.name} className="h-[48px] pr-9" required />
              <Pencil className="pointer-events-none absolute right-3 top-1/2 size-3.5 -translate-y-1/2 text-brand-gray-400" />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[13px] font-medium text-[#333]">Email Address&#42;</label>
            <Input
              type="email"
              defaultValue={member.email}
              className="h-[48px]"
              disabled
              title="Email cannot be changed"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[13px] font-medium text-[#333]">Phone Number</label>
            <div className="relative">
              <Input name="phone" defaultValue={member.phone} className="h-[48px] pr-9" placeholder="+1 000-0000" />
              <Pencil className="pointer-events-none absolute right-3 top-1/2 size-3.5 -translate-y-1/2 text-brand-gray-400" />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[13px] font-medium text-[#333]">Status</label>
            <NativeSelect name="status" className="h-[48px]" defaultValue={member.status === 'Active' ? 'ACTIVE' : 'INACTIVE'}>
              <NativeSelectOption value="ACTIVE">Active</NativeSelectOption>
              <NativeSelectOption value="INACTIVE">Inactive</NativeSelectOption>
            </NativeSelect>
          </div>

          <Button size="lg" type="submit" className="mt-1 h-[52px] w-full" disabled={submitting}>
            {submitting ? 'Saving…' : 'Save Changes'}
          </Button>
          <Button asChild size="lg" variant="outline" className="h-[52px] w-full">
            <button type="button" onClick={() => router.push(`${back}/${id}`)}>
              Cancel
            </button>
          </Button>
        </form>
      </div>
    </SheetPage>
  );
}
