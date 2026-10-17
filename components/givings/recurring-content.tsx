'use client';

/**
 * Recurring giving + saved payment methods.
 *
 * Uses authenticated customer endpoints (verified in 177-path live spec):
 *   GET /customer/payment-methods
 *   GET /customer/recurring-giving
 *   POST /customer/recurring-giving
 *   POST /customer/recurring-giving/{id}/pause|resume|cancel
 *   PUT /customer/payment-methods/{id}/default
 *   DELETE /customer/payment-methods/{id}
 *
 * Blocked on a giving-enabled tenant for live-testing (same as all giving).
 */

import { useEffect, useState } from 'react';
import { useForm, SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { NativeSelect, NativeSelectOption } from '@/components/ui/native-select';
import {
  getPaymentMethods,
  setDefaultPaymentMethod,
  deletePaymentMethod,
  getRecurringGiving,
  createRecurringGiving,
  pauseRecurringGiving,
  resumeRecurringGiving,
  cancelRecurringGiving,
  frequencyLabel,
  cardLabel,
  type PaymentMethod,
  type RecurringGiving,
  type RecurringGivingFrequency,
} from '@/lib/api/giving';
import { USE_LIVE_API } from '@/lib/api/config';

/* ---- Mock data for demo mode ---- */

const MOCK_CARD: PaymentMethod = {
  id: 'pm_demo',
  last4: '4242',
  brand: 'Visa',
  isDefault: true,
};

const MOCK_SCHEDULE: RecurringGiving = {
  id: 'rg_demo',
  amount: 50,
  currency: 'USD',
  frequency: 'MONTHLY',
  fundId: 'fund_tithe',
  status: 'ACTIVE',
  nextPaymentDate: '2026-11-01',
};

const FREQUENCIES: RecurringGivingFrequency[] = [
  'WEEKLY',
  'BIWEEKLY',
  'MONTHLY',
  'QUARTERLY',
  'SEMIANNUALLY',
  'ANNUALLY',
];

const schema = z.object({
  amount: z.string().min(1, 'Enter an amount'),
  currency: z.string().min(1),
  frequency: z.string().min(1, 'Choose a frequency'),
  fundId: z.string().min(1, 'Select a fund'),
  paymentMethodId: z.string().min(1, 'Select a payment method'),
});

type Schema = z.infer<typeof schema>;

export function RecurringContent() {
  const [methods, setMethods] = useState<PaymentMethod[]>([]);
  const [schedules, setSchedules] = useState<RecurringGiving[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [showForm, setShowForm] = useState(false);

  const form = useForm<Schema>({
    resolver: zodResolver(schema),
    defaultValues: {
      amount: '',
      currency: 'USD',
      frequency: 'MONTHLY',
      fundId: '',
      paymentMethodId: '',
    },
  });

  const load = async () => {
    setLoading(true);
    if (!USE_LIVE_API) {
      setMethods([MOCK_CARD]);
      setSchedules([MOCK_SCHEDULE]);
      setLoading(false);
      return;
    }
    try {
      const [pm, rg] = await Promise.all([getPaymentMethods(), getRecurringGiving()]);
      setMethods(Array.isArray(pm) ? pm : []);
      setSchedules(Array.isArray(rg) ? rg : []);
    } catch {
      toast.error('Could not load giving data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const onSubmit: SubmitHandler<Schema> = async (data) => {
    setBusy(true);
    try {
      await createRecurringGiving({
        amount: parseFloat(data.amount),
        currency: data.currency,
        frequency: data.frequency as RecurringGivingFrequency,
        fundId: data.fundId,
        paymentMethodId: data.paymentMethodId,
      });
      toast.success('Recurring gift set up');
      setShowForm(false);
      form.reset();
      await load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to create recurring gift');
    } finally {
      setBusy(false);
    }
  };

  const handlePause = async (id: string) => {
    setBusy(true);
    try {
      await pauseRecurringGiving(id);
      toast.success('Paused');
      await load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed');
    } finally {
      setBusy(false);
    }
  };

  const handleResume = async (id: string) => {
    setBusy(true);
    try {
      await resumeRecurringGiving(id);
      toast.success('Resumed');
      await load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed');
    } finally {
      setBusy(false);
    }
  };

  const handleCancel = async (id: string) => {
    if (!confirm('Cancel this recurring gift?')) return;
    setBusy(true);
    try {
      await cancelRecurringGiving(id);
      toast.success('Cancelled');
      await load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed');
    } finally {
      setBusy(false);
    }
  };

  const handleSetDefault = async (id: string) => {
    setBusy(true);
    try {
      await setDefaultPaymentMethod(id);
      toast.success('Default card updated');
      await load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed');
    } finally {
      setBusy(false);
    }
  };

  const handleDeleteCard = async (id: string) => {
    if (!confirm('Remove this payment method?')) return;
    setBusy(true);
    try {
      await deletePaymentMethod(id);
      toast.success('Card removed');
      await load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed');
    } finally {
      setBusy(false);
    }
  };

  if (loading) {
    return <p className="py-10 text-center text-[14px] text-[#888]">Loading…</p>;
  }

  return (
    <div className="flex flex-col gap-8 px-6 py-8 md:px-[60px]">
      {/* Saved payment methods */}
      <section className="flex flex-col gap-4">
        <h2 className="text-[18px] font-bold">Payment methods</h2>
        {methods.length === 0 ? (
          <p className="text-[14px] text-[#888]">
            No saved cards yet. Complete a one-time gift to save a card.
          </p>
        ) : (
          <ul className="flex flex-col gap-3">
            {methods.map((m) => (
              <li
                key={m.id}
                className="flex items-center justify-between rounded-[12px] border border-[#e5e7eb] px-4 py-3"
              >
                <div className="flex flex-col">
                  <span className="text-[14px] font-medium">{cardLabel(m)}</span>
                  {m.isDefault && (
                    <span className="text-[12px] text-brand-blue">Default</span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {!m.isDefault && (
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => handleSetDefault(m.id)}
                      className="text-[13px] text-brand-blue hover:underline disabled:opacity-50"
                    >
                      Set default
                    </button>
                  )}
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => handleDeleteCard(m.id)}
                    className="text-[13px] text-destructive hover:underline disabled:opacity-50"
                  >
                    Remove
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Recurring schedules */}
      <section className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h2 className="text-[18px] font-bold">Recurring gifts</h2>
          {methods.length > 0 && (
            <Button size="sm" onClick={() => setShowForm((v) => !v)}>
              {showForm ? 'Cancel' : '+ Set up recurring gift'}
            </Button>
          )}
        </div>

        {showForm && (
          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(onSubmit)}
              className="flex max-w-[480px] flex-col gap-4 rounded-[12px] border border-[#e5e7eb] p-5"
            >
              <h3 className="text-[15px] font-bold">New recurring gift</h3>

              <div className="grid grid-cols-2 gap-3">
                <FormField
                  control={form.control}
                  name="amount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Amount</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min={1}
                          placeholder="0"
                          className="h-[44px]"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="currency"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Currency</FormLabel>
                      <FormControl>
                        <NativeSelect className="h-[44px]" {...field}>
                          <NativeSelectOption value="USD">USD</NativeSelectOption>
                          <NativeSelectOption value="NGN">NGN</NativeSelectOption>
                          <NativeSelectOption value="GBP">GBP</NativeSelectOption>
                          <NativeSelectOption value="CAD">CAD</NativeSelectOption>
                        </NativeSelect>
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="frequency"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Frequency</FormLabel>
                    <FormControl>
                      <NativeSelect className="h-[44px]" {...field}>
                        {FREQUENCIES.map((f) => (
                          <NativeSelectOption key={f} value={f}>
                            {frequencyLabel(f)}
                          </NativeSelectOption>
                        ))}
                      </NativeSelect>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="fundId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Fund / Purpose</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Fund ID (e.g. tithe)"
                        className="h-[44px]"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="paymentMethodId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Payment method</FormLabel>
                    <FormControl>
                      <NativeSelect className="h-[44px]" {...field}>
                        <NativeSelectOption value="">
                          Select a card
                        </NativeSelectOption>
                        {methods.map((m) => (
                          <NativeSelectOption key={m.id} value={m.id}>
                            {cardLabel(m)}
                            {m.isDefault ? ' (default)' : ''}
                          </NativeSelectOption>
                        ))}
                      </NativeSelect>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button type="submit" disabled={busy} className="mt-2">
                {busy ? 'Setting up…' : 'Start recurring gift'}
              </Button>
            </form>
          </Form>
        )}

        {schedules.length === 0 ? (
          <p className="text-[14px] text-[#888]">No recurring gifts set up yet.</p>
        ) : (
          <ul className="flex flex-col gap-3">
            {schedules.map((s) => (
              <li
                key={s.id}
                className="flex items-center justify-between rounded-[12px] border border-[#e5e7eb] px-4 py-4"
              >
                <div className="flex flex-col gap-0.5">
                  <span className="text-[15px] font-bold">
                    {s.currency} {s.amount.toLocaleString()} / {frequencyLabel(s.frequency)}
                  </span>
                  <span
                    className={`text-[12px] font-medium ${
                      s.status === 'ACTIVE'
                        ? 'text-green-600'
                        : s.status === 'PAUSED'
                        ? 'text-amber-600'
                        : 'text-[#888]'
                    }`}
                  >
                    {s.status}
                  </span>
                  {s.nextPaymentDate && (
                    <span className="text-[12px] text-[#888]">
                      Next: {new Date(s.nextPaymentDate).toLocaleDateString()}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {s.status === 'ACTIVE' && (
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => handlePause(s.id)}
                      className="text-[13px] text-amber-600 hover:underline disabled:opacity-50"
                    >
                      Pause
                    </button>
                  )}
                  {s.status === 'PAUSED' && (
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => handleResume(s.id)}
                      className="text-[13px] text-green-600 hover:underline disabled:opacity-50"
                    >
                      Resume
                    </button>
                  )}
                  {(s.status === 'ACTIVE' || s.status === 'PAUSED') && (
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => handleCancel(s.id)}
                      className="text-[13px] text-destructive hover:underline disabled:opacity-50"
                    >
                      Cancel
                    </button>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
