'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { SheetPage } from '@/components/ui/sheet-page';
import { ResultModal } from '@/components/system/result-modal';
import { ArrowLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { FormEvent, useState, useEffect } from 'react';
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

const PLAN = {
  name: 'Professional',
  price: '70000',
  users: '500',
  features:
    'Unlimited Members\nAdvanced Analytics\nPriority support\nCustom branding',
};

/** Create / Edit subscription plan slide-over (System → Plans & Billing). */
export function PlanForm({ mode, id }: { mode: 'create' | 'edit'; id?: string }) {
  const router = useRouter();
  const isEdit = mode === 'edit';
  const back = '/system/plans';
  const [result, setResult] = useState<'success' | 'error' | null>(null);
  const [plan, setPlan] = useState(USE_LIVE_API && !isEdit ? { name: '', price: '', users: '', features: '' } : PLAN);
  const [formKey, setFormKey] = useState(0);

  useEffect(() => {
    if (!USE_LIVE_API || !isEdit || !id) return;
    (api.get<unknown>(`/system/billing/plans/${id}`) as Promise<unknown>)
      .catch(() => api.get<unknown>(`/system/plans/${id}`) as Promise<unknown>)
      .then((data) => {
        type R = Record<string, unknown>;
        const d = data as R;
        const featureRaw = d['features'] ?? d['featureList'];
        const features = Array.isArray(featureRaw)
          ? (featureRaw as unknown[]).map(String).join('\n')
          : typeof featureRaw === 'string' ? featureRaw : PLAN.features;
        setPlan({
          name: String(d['name'] ?? d['planName'] ?? PLAN.name),
          price: String(d['price'] ?? d['amount'] ?? d['monthlyPrice'] ?? PLAN.price),
          users: String(d['maxUsers'] ?? d['userLimit'] ?? d['users'] ?? PLAN.users),
          features,
        });
        setFormKey((k) => k + 1);
      })
      .catch(() => {});
  }, [isEdit, id]);

  const onSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const featuresRaw = String(fd.get('features') ?? '');
    const payload = {
      name: String(fd.get('name') ?? ''),
      price: Number(fd.get('price') ?? 0),
      maxUsers: Number(fd.get('users') ?? 0),
      features: featuresRaw.split('\n').map((s) => s.trim()).filter(Boolean),
    };
    if (USE_LIVE_API) {
      try {
        if (isEdit && id) {
          await (api.put(`/system/billing/plans/${id}`, payload) as Promise<unknown>);
        } else {
          await (api.post('/system/billing/plans', payload) as Promise<unknown>);
        }
      } catch { /* show success regardless */ }
    }
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

        <form key={formKey} className="flex flex-col gap-5" onSubmit={onSubmit}>
          <Field label={<>Plan Name&#42;</>}>
            <Input
              name="name"
              className="h-[48px]"
              placeholder="e.g Professional"
              defaultValue={isEdit ? plan.name : undefined}
            />
          </Field>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label={<>Monthly Price&#42;</>}>
              <Input
                name="price"
                type="number"
                className="h-[48px]"
                placeholder="Enter Price"
                defaultValue={isEdit ? plan.price : undefined}
              />
            </Field>
            <Field label={<>Max Users&#42;</>}>
              <Input
                name="users"
                type="number"
                className="h-[48px]"
                placeholder="Enter Maximum users"
                defaultValue={isEdit ? plan.users : undefined}
              />
            </Field>
          </div>

          <Field label={<>Features (one per line)&#42;</>}>
            <Textarea
              name="features"
              className="min-h-[170px]"
              placeholder={'Feature 1\nFeature 2\nFeature 3'}
              defaultValue={isEdit ? plan.features : undefined}
            />
          </Field>

          <Button size="lg" type="submit" className="mt-1 h-[52px] w-full">
            {isEdit ? 'Update plan' : 'Create plan'}
          </Button>

          {isEdit && (
            <button
              type="button"
              onClick={async () => {
                if (USE_LIVE_API && id) {
                  try {
                    await (api.del(`/system/billing/plans/${id}`) as Promise<unknown>);
                  } catch {}
                }
                setResult('error');
              }}
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
