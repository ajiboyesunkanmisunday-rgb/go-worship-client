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
import { FormEvent } from 'react';

/** Add / Edit tag slide-over (Figma 151:12062 add, 151:12406 edit). */
export function TagForm({
  mode,
  backTo,
}: {
  mode: 'add' | 'edit';
  backTo?: string;
}) {
  const router = useRouter();
  const isEdit = mode === 'edit';
  const back = backTo ?? '/sermon-admin/tags';

  const onSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
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

        <form className="flex flex-col gap-5" onSubmit={onSubmit}>
          <div className="flex flex-col gap-1.5">
            <label className="text-[13px] font-medium text-[#333]">
              Tag Name &#42;
            </label>
            <Input
              className="h-[48px]"
              placeholder="Enter tag name"
              defaultValue={isEdit ? 'Walking in Faith' : undefined}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[13px] font-medium text-[#333]">
              Description / Summary
            </label>
            <Textarea
              className="min-h-[120px]"
              placeholder="Enter brief description"
              defaultValue={
                isEdit
                  ? 'Sermons about walking daily in faith and trust.'
                  : undefined
              }
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[13px] font-medium text-[#333]">Status</label>
            <NativeSelect
              className="h-[48px]"
              defaultValue={isEdit ? 'Inactive' : 'Active'}
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
