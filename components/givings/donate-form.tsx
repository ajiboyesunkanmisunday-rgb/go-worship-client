'use client';

/**
 * Member giving form — authenticated customer checkout.
 *
 * Uses the real LeadRemit / CollectCheckout gateway when USE_LIVE_API=true.
 * Falls back to the mock /dashboard/givings/give/pay walkthrough in demo mode.
 *
 * Live flow (confirmed from giving.js + 177-path spec):
 *   GET  /public/checkout/config  (public config; no customer config endpoint)
 *   POST /customer/donations
 *   POST /customer/payments
 *   → COLLECT_JS lightbox  OR  COLLECT_CHECKOUT redirect
 *   POST /customer/payments/{ref}/token  (COLLECT_JS only)
 *   POLL GET /customer/payments/{id}  → /dashboard/givings/give/success?ref=&amount=
 */

import { z } from 'zod';
import { SubmitHandler, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import Image from 'next/image';
import { ArrowLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { SheetPage } from '../ui/sheet-page';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '../ui/form';
import { Input } from '../ui/input';
import { NativeSelect, NativeSelectOption } from '../ui/native-select';
import { Button } from '../ui/button';
import { USE_LIVE_API } from '@/lib/api/config';
import { getCheckoutConfig, chooseIntegration, startCollectJs, launchHostedCheckout, waitForSettlement, type CheckoutConfig } from '@/lib/api/checkout';
import { createCustomerDonation, createCustomerPayment, submitCustomerPaymentToken, getCustomerPaymentStatus } from '@/lib/api/customer';

const schema = z.object({
  fullName: z.string().optional(),
  email: z.email({ message: 'Please enter a valid email address' }),
  donorDetails: z.string().optional(),
  currency: z.string().optional(),
  amount: z.string().min(1, { message: 'Please enter an amount' }),
  purpose: z.string().min(1, { message: 'Please select a purpose' }),
});

type Schema = z.infer<typeof schema>;

export function DonateForm() {
  const router = useRouter();
  const [config, setConfig] = useState<CheckoutConfig | null>(null);
  const [configError, setConfigError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const form = useForm<Schema>({
    resolver: zodResolver(schema),
    defaultValues: {
      fullName: '',
      email: '',
      donorDetails: '',
      currency: 'USD',
      amount: '',
      purpose: '',
    },
  });

  useEffect(() => {
    if (!USE_LIVE_API) return;
    getCheckoutConfig()
      .then((cfg) => {
        setConfig(cfg);
        if (cfg.currencies?.[0]) form.setValue('currency', cfg.currencies[0]);
      })
      .catch((e) => {
        setConfigError(
          e instanceof Error ? e.message : 'Online giving is not available for this site yet.'
        );
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onSubmit: SubmitHandler<Schema> = async (data) => {
    if (!USE_LIVE_API) {
      router.push('/dashboard/givings/give/pay');
      return;
    }

    if (configError || !config) {
      toast.error(configError ?? 'Giving is not available right now.');
      return;
    }

    setSubmitting(true);
    const amount = parseFloat(data.amount);
    const currency = data.currency || 'USD';
    const origin = window.location.origin;

    try {
      // 1. Create the donation record
      const donation = await createCustomerDonation({
        amount,
        currency,
        note: data.purpose,
      });

      // 2. Choose integration type
      const integrationType = chooseIntegration(config);

      // 3. Create the payment record
      const payment = await createCustomerPayment({
        idempotencyKey: crypto.randomUUID(),
        purpose: 'DONATION',
        amount,
        currency,
        businessReference: { type: 'DONATION', id: donation.id },
        integrationType,
        successUrl: `${origin}/dashboard/givings/give/success`,
        cancelUrl: `${origin}/dashboard/givings/give`,
      });

      const ref = payment.paymentReference;

      if (integrationType === 'COLLECT_JS' && config.publicKey) {
        // 4a. Collect.js lightbox
        const token = await startCollectJs(config.publicKey);
        await submitCustomerPaymentToken(ref, token);
      } else if (payment.collectionCheckout) {
        // 4b. Hosted redirect (returns never — page navigates away)
        await launchHostedCheckout(payment.collectionCheckout);
      } else if (payment.redirectUrl) {
        window.location.href = payment.redirectUrl;
        return;
      }

      // 5. Poll for settlement (COLLECT_JS path; COLLECT_CHECKOUT redirects back)
      const settled = await waitForSettlement(ref, getCustomerPaymentStatus);
      if (settled.status === 'SUCCEEDED') {
        router.push(
          `/dashboard/givings/give/success?ref=${ref}&amount=${amount}`
        );
      } else {
        toast.error(`Payment ${settled.status?.toLowerCase() ?? 'did not complete'}.`);
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Payment failed');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SheetPage
      className="w-full max-w-[665px]!"
      backLink="/dashboard/givings"
      title="Give"
    >
      <div className="flex h-full w-full flex-col gap-6 overflow-y-auto px-6 pt-[64px] pb-10 md:px-[60px]">
        <button
          type="button"
          onClick={() => router.push('/dashboard/givings')}
          aria-label="Go back"
          className="text-black transition-opacity hover:opacity-70"
        >
          <ArrowLeft className="size-6" />
        </button>

        <div className="flex flex-col items-center gap-3 text-center">
          <Image
            src="/auth/infinity-blue.svg"
            alt="Go Worship"
            width={64}
            height={22}
            className="h-[22px] w-[64px]"
          />
          <h1 className="text-[26px] leading-[110%] font-bold -tracking-[0.02em] lg:text-[32px]">
            {config?.tenantDisplayName ?? 'Celebration Church'} Giving Platform
          </h1>
          <p className="max-w-[400px] font-poppins text-[15px] font-light">
            A generous person will prosper; whoever refreshes others will be
            refreshed.
          </p>
        </div>

        {configError && (
          <div className="rounded-[10px] bg-amber-50 border border-amber-200 px-4 py-3 text-[14px] text-amber-700">
            {configError}
          </div>
        )}

        <Form {...form}>
          <form
            className="flex w-full flex-col gap-5"
            onSubmit={form.handleSubmit(onSubmit)}
          >
            <FormField
              control={form.control}
              name="fullName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-[15px] font-medium">
                    Full Name
                  </FormLabel>
                  <FormControl>
                    <Input className="h-[52px]" placeholder="Enter full name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-[15px] font-medium">
                    Email Address*
                  </FormLabel>
                  <FormControl>
                    <Input type="email" className="h-[52px]" placeholder="Enter email address" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="donorDetails"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-[15px] font-medium">
                    Donor Details
                  </FormLabel>
                  <FormControl>
                    <NativeSelect className="h-[52px]" {...field}>
                      <NativeSelectOption value="">Select donor type</NativeSelectOption>
                      <NativeSelectOption value="member">Member</NativeSelectOption>
                      <NativeSelectOption value="guest">Guest</NativeSelectOption>
                    </NativeSelect>
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
                  <FormLabel className="text-[15px] font-medium">
                    Choose Currency
                  </FormLabel>
                  <FormControl>
                    <NativeSelect className="h-[52px]" {...field}>
                      {(config?.currencies ?? ['USD', 'CAD', 'NGN', 'GBP']).map((c) => (
                        <NativeSelectOption key={c} value={c}>{c}</NativeSelectOption>
                      ))}
                    </NativeSelect>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="amount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-[15px] font-medium">Amount*</FormLabel>
                  <FormControl>
                    <Input type="number" inputMode="decimal" className="h-[52px]" placeholder="Enter amount" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="purpose"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-[15px] font-medium">
                    Purpose for giving*
                  </FormLabel>
                  <FormControl>
                    <NativeSelect className="h-[52px]" {...field}>
                      <NativeSelectOption value="">Select a purpose</NativeSelectOption>
                      {(config?.funds ?? []).length > 0
                        ? config!.funds!.map((f) => (
                            <NativeSelectOption key={f.id} value={f.id}>
                              {f.name}
                            </NativeSelectOption>
                          ))
                        : (
                          <>
                            <NativeSelectOption value="tithe">Tithe</NativeSelectOption>
                            <NativeSelectOption value="offering">Offering</NativeSelectOption>
                            <NativeSelectOption value="thanksgiving">Thanksgiving</NativeSelectOption>
                            <NativeSelectOption value="others">Others</NativeSelectOption>
                          </>
                        )}
                    </NativeSelect>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button
              size="lg"
              type="submit"
              disabled={submitting || (USE_LIVE_API && !!configError)}
              className="mt-2 h-[56px] w-full"
            >
              {submitting ? 'Processing…' : 'Give Generously'}
            </Button>
          </form>
        </Form>
      </div>
    </SheetPage>
  );
}
