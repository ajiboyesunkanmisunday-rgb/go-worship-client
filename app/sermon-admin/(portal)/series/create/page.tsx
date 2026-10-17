'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { NativeSelect, NativeSelectOption } from '@/components/ui/native-select';
import { Textarea } from '@/components/ui/textarea';
import { SheetPage } from '@/components/ui/sheet-page';
import { ArrowLeft, Pencil } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { FormEvent, useState } from 'react';
import { api } from '@/lib/api/client';
import { USE_LIVE_API } from '@/lib/api/config';

const back = '/sermon-admin/series';

/** Add new sermon series (Figma sermon-admin portal). */
export default function SermonAdminAddSeriesPage() {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);

  const onSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (USE_LIVE_API) {
      const fd = new FormData(e.currentTarget);
      const payload = {
        name: String(fd.get('name') ?? ''),
        description: String(fd.get('description') ?? ''),
        status: String(fd.get('status') ?? 'Draft'),
      };
      try {
        setSubmitting(true);
        await (api.post('/tenant/admin/media/series', payload) as Promise<unknown>)
          .catch(() => api.post('/tenant/admin/sermon/series', payload) as Promise<unknown>);
      } catch {
        // fall through
      } finally {
        setSubmitting(false);
      }
    }
    router.push(back);
  };

  return (
    <SheetPage className="w-full max-w-[665px]!" backLink={back} title="Add Series">
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
          <h1 className="text-[24px] font-bold">Add New Series</h1>
          <p className="mt-1 text-[13px] text-brand-gray-500">
            Create a new sermon series.
          </p>
        </div>

        <form className="flex flex-col gap-5" onSubmit={onSubmit}>
          <div className="flex flex-col gap-1.5">
            <label className="text-[13px] font-medium text-[#333]">Series Name&#42;</label>
            <div className="relative">
              <Input name="name" placeholder="Enter series name" className="h-[48px] pr-9" required />
              <Pencil className="pointer-events-none absolute right-3 top-1/2 size-3.5 -translate-y-1/2 text-brand-gray-400" />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[13px] font-medium text-[#333]">Description</label>
            <div className="relative">
              <Textarea name="description" className="min-h-[110px] pr-9" placeholder="Enter series description" />
              <Pencil className="pointer-events-none absolute right-3 bottom-3 size-3.5 text-brand-gray-400" />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[13px] font-medium text-[#333]">Status</label>
            <NativeSelect name="status" className="h-[48px]" defaultValue="Draft">
              <NativeSelectOption value="Draft">Draft</NativeSelectOption>
              <NativeSelectOption value="Published">Published</NativeSelectOption>
              <NativeSelectOption value="Scheduled">Scheduled</NativeSelectOption>
            </NativeSelect>
          </div>

          <Button size="lg" type="submit" className="mt-1 h-[52px] w-full" disabled={submitting}>
            {submitting ? 'Saving…' : 'Save Series'}
          </Button>
          <Button asChild size="lg" variant="outline" className="h-[52px] w-full">
            <button type="button" onClick={() => router.push(back)}>
              Cancel
            </button>
          </Button>
        </form>
      </div>
    </SheetPage>
  );
}
