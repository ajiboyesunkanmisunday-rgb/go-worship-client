'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { SheetPage } from '@/components/ui/sheet-page';
import { ResultModal } from '@/components/system/result-modal';
import { ArrowLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { FormEvent, useState } from 'react';

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

const PLAN = {
  name: 'Professional',
  price: '70000',
  users: '500',
  features:
    'Unlimited Members\nAdvanced Analytics\nPriority support\nCustom branding',
};

/** Create / Edit subscription plan slide-over (System → Plans & Billing). */
export function PlanForm({ mode }: { mode: 'create' | 'edit' }) {
  const router = useRouter();
  const isEdit = mode === 'edit';
  const back = '/system/plans';
  const [result, setResult] = useState<'success' | 'error' | null>(null);

  const onSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setResult('success');
  };

  return (
    <SheetPage
      className="w-full max-w-[665px]!"
      backLink={back}
      title={isEdit ? 'Edit plan' : 'Create New Plan'}
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

        <div>
          <h1 className="text-[22px] font-bold text-brand-blue">
            {isEdit ? 'Edit plan' : 'Create New Plan'}
          </h1>
          <p className="mt-1 text-[13px] text-brand-gray-500">
            {isEdit
              ? "Edit a plan's details for tenants"
              : 'Add a new subscription plan for tenants'}
          </p>
        </div>

        <form className="flex flex-col gap-5" onSubmit={onSubmit}>
          <Field label={<>Plan Name&#42;</>}>
            <Input
              className="h-[48px]"
              placeholder="e.g Professional"
              defaultValue={isEdit ? PLAN.name : undefined}
            />
          </Field>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label={<>Monthly Price&#42;</>}>
              <Input
                type="number"
                className="h-[48px]"
                placeholder="Enter Price"
                defaultValue={isEdit ? PLAN.price : undefined}
              />
            </Field>
            <Field label={<>Max Users&#42;</>}>
              <Input
                type="number"
                className="h-[48px]"
                placeholder="Enter Maximum users"
                defaultValue={isEdit ? PLAN.users : undefined}
              />
            </Field>
          </div>

          <Field label={<>Features (one per line)&#42;</>}>
            <Textarea
              className="min-h-[170px]"
              placeholder={'Feature 1\nFeature 2\nFeature 3'}
              defaultValue={isEdit ? PLAN.features : undefined}
            />
          </Field>

          <Button size="lg" type="submit" className="mt-1 h-[52px] w-full">
            {isEdit ? 'Update plan' : 'Create plan'}
          </Button>

          {isEdit && (
            <button
              type="button"
              onClick={() => setResult('error')}
              className="text-[14px] font-semibold text-[#eb0000]"
            >
              Delete plan
            </button>
          )}
        </form>

        <ResultModal
          variant={result ?? 'success'}
          open={result !== null}
          onOpenChange={(v) => {
            if (!v) {
              setResult(null);
              router.push(back);
            }
          }}
          message={
            result === 'error'
              ? 'Failed due to an unexpected error'
              : isEdit
                ? 'You have successfully updated the subscription plan'
                : 'You have successfully created a new subscription plan'
          }
        />
      </div>
    </SheetPage>
  );
}
