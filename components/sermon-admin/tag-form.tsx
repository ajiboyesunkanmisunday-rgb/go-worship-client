'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  NativeSelect,
  NativeSelectOption,
} from '@/components/ui/native-select';
import { Textarea } from '@/components/ui/textarea';
import { SheetPage } from '@/components/ui/sheet-page';
import { ArrowLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { FormEvent, useState, useEffect } from 'react';
import { api } from '@/lib/api/client';
import { USE_LIVE_API } from '@/lib/api/config';

type TagData = { name: string; description: string; status: string };

const DEFAULT_TAG: TagData = {
  name: 'Walking in Faith',
  description: 'Sermons about walking daily in faith and trust.',
  status: 'Inactive',
};

/** Add / Edit tag slide-over (Figma 151:12062 add, 151:12406 edit). */
export function TagForm({
  mode,
  backTo,
  id,
}: {
  mode: 'add' | 'edit';
  backTo?: string;
  id?: string;
}) {
  const router = useRouter();
  const isEdit = mode === 'edit';
  const back = backTo ?? '/sermon-admin/tags';
  const [tag, setTag] = useState<TagData>(USE_LIVE_API && !isEdit ? { name: '', description: '', status: 'Active' } : DEFAULT_TAG);
  const [formKey, setFormKey] = useState(0);

  useEffect(() => {
    if (!USE_LIVE_API || !isEdit || !id) return;
    (api.get<unknown>(`/tenant/admin/sermon/tags/${id}`) as Promise<unknown>)
      .catch(() => api.get<unknown>(`/tenant/admin/tags/${id}`) as Promise<unknown>)
      .then((data) => {
        type R = Record<string, unknown>;
        const d = data as R;
        const rawStatus = String(d['status'] ?? '').toUpperCase();
        const status = rawStatus === 'ACTIVE' ? 'Active' : rawStatus === 'INACTIVE' ? 'Inactive' : DEFAULT_TAG.status;
        setTag({
          name: String(d['name'] ?? d['tagName'] ?? DEFAULT_TAG.name),
          description: String(d['description'] ?? d['desc'] ?? DEFAULT_TAG.description),
          status,
        });
        setFormKey((k) => k + 1);
      })
      .catch(() => {});
  }, [isEdit, id]);

  const onSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const payload = {
      name: String(fd.get('tagName') ?? ''),
      description: String(fd.get('description') ?? ''),
      status: String(fd.get('status') ?? ''),
    };
    if (USE_LIVE_API) {
      try {
        if (isEdit && id) {
          await (api.put(`/tenant/admin/sermon/tags/${id}`, payload) as Promise<unknown>)
            .catch(() => api.put(`/tenant/admin/tags/${id}`, payload) as Promise<unknown>);
        } else {
          await (api.post('/tenant/admin/sermon/tags', payload) as Promise<unknown>)
            .catch(() => api.post('/tenant/admin/tags', payload) as Promise<unknown>);
        }
      } catch {}
    }
    router.push(back);
  };

  return (
    <SheetPage
      className="w-full max-w-[665px]!"
      backLink={back}
      title={isEdit ? 'Edit tag' : 'Add new tag'}
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

        <h1 className="text-center text-[24px] font-bold">
          {isEdit ? 'Edit tag' : 'Add new tag'}
        </h1>

        <form key={formKey} className="flex flex-col gap-5" onSubmit={onSubmit}>
          <div className="flex flex-col gap-1.5">
            <label className="text-[13px] font-medium text-[#333]">
              Tag Name &#42;
            </label>
            <Input
              name="tagName"
              className="h-[48px]"
              placeholder="Enter tag name"
              defaultValue={isEdit ? tag.name : undefined}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[13px] font-medium text-[#333]">
              Description / Summary
            </label>
            <Textarea
              name="description"
              className="min-h-[120px]"
              placeholder="Enter brief description"
              defaultValue={isEdit ? tag.description : undefined}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[13px] font-medium text-[#333]">Status</label>
            <NativeSelect
              name="status"
              className="h-[48px]"
              defaultValue={isEdit ? tag.status : 'Active'}
            >
              <NativeSelectOption value="Active">Active</NativeSelectOption>
              <NativeSelectOption value="Inactive">Inactive</NativeSelectOption>
            </NativeSelect>
          </div>

          <Button size="lg" type="submit" className="mt-2 h-[52px] w-full">
            Save
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
