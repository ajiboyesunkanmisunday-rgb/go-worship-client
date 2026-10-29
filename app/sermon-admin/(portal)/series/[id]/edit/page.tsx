'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { SheetPage } from '@/components/ui/sheet-page';
import { ArrowLeft, Pencil } from 'lucide-react';
import { useRouter, useParams } from 'next/navigation';
import { FormEvent, useState, useEffect } from 'react';
import { getTenantSeriesById, updateTenantSeries } from '@/lib/api/tenant';
import { USE_LIVE_API } from '@/lib/api/config';

const back = '/sermon-admin/series';

const MOCK = { title: 'Faith in Action', description: 'Weekly faith teaching series.' };

/** Edit an existing sermon series (GET + PUT /tenant/admin/content/series/:id). */
export default function SermonAdminEditSeriesPage() {
  const router = useRouter();
  const { id } = useParams<{ id: string }>();
  const [series, setSeries] = useState(USE_LIVE_API ? { title: '', description: '' } : MOCK);
  const [formKey, setFormKey] = useState(0);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!USE_LIVE_API || !id) return;
    getTenantSeriesById(id)
      .then((d) => {
        setSeries({
          title: String(d.title ?? MOCK.title),
          description: String(d.description ?? MOCK.description),
        });
        setFormKey((k) => k + 1);
      })
      .catch(() => {});
  }, [id]);

  const onSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (USE_LIVE_API && id) {
      const fd = new FormData(e.currentTarget);
      // SeriesRequest schema: title, description
      const payload = {
        title: String(fd.get('title') ?? ''),
        description: String(fd.get('description') ?? ''),
      };
      try {
        setSubmitting(true);
        await updateTenantSeries(id, payload);
      } catch {
        // fall through
      } finally {
        setSubmitting(false);
      }
    }
    router.push(back);
  };

  return (
    <SheetPage className="w-full max-w-[665px]!" backLink={back} title="Edit Series">
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
          <h1 className="text-[24px] font-bold">Edit Series</h1>
          <p className="mt-1 text-[13px] text-brand-gray-500">
            Update this sermon series.
          </p>
        </div>

        <form key={formKey} className="flex flex-col gap-5" onSubmit={onSubmit}>
          <div className="flex flex-col gap-1.5">
            <label className="text-[13px] font-medium text-[#333]">Series Name&#42;</label>
            <div className="relative">
              <Input
                name="title"
                placeholder="Enter series name"
                className="h-[48px] pr-9"
                defaultValue={series.title}
                required
              />
              <Pencil className="pointer-events-none absolute right-3 top-1/2 size-3.5 -translate-y-1/2 text-brand-gray-400" />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[13px] font-medium text-[#333]">Description</label>
            <div className="relative">
              <Textarea
                name="description"
                className="min-h-[110px] pr-9"
                placeholder="Enter series description"
                defaultValue={series.description}
              />
              <Pencil className="pointer-events-none absolute right-3 bottom-3 size-3.5 text-brand-gray-400" />
            </div>
          </div>

          <Button size="lg" type="submit" className="mt-1 h-[52px] w-full" disabled={submitting}>
            {submitting ? 'Saving…' : 'Save Changes'}
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
