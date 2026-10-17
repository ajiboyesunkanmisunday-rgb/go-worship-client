/**
 * Public giving checkout API.
 *
 * The real payment gateway is LeadRemit / CollectCheckout (NMI Collect.js).
 * Cards are NOT collected in-app; the gateway handles it via:
 *   A) COLLECT_JS lightbox (Apple Pay supported)
 *   B) COLLECT_CHECKOUT hosted redirect
 *
 * Flow confirmed from backend canonical tools (checkout.js / giving.js):
 *   GET  /public/checkout/config
 *   POST /public/checkout/donations       → donationId
 *   POST /public/checkout/payments        → paymentRef + integrationType + redirectUrl/collectionCheckout
 *   if COLLECT_JS: load script, CollectJS.configure({variant:"lightbox"}), on token →
 *     POST /public/checkout/payments/{ref}/token
 *   if COLLECT_CHECKOUT: CollectCheckout.redirectToCheckout(...)
 *   POLL GET /public/checkout/payments/{ref}  → status SUCCEEDED/FAILED/CANCELED/EXPIRED
 */

import { api } from './client';

/* -------- Config -------- */

export type CheckoutConfig = {
  tenantDisplayName?: string;
  branding?: { primaryColor?: string };
  campuses?: { id: string; name: string }[];
  funds?: { id: string; name: string }[];
  currencies?: string[];
  /** Collect.js tokenization key */
  publicKey?: string;
  supportedIntegrationTypes?: ('COLLECT_JS' | 'COLLECT_CHECKOUT')[];
};

export const getCheckoutConfig = () =>
  api.get<CheckoutConfig>('/public/checkout/config');

/* -------- Donation -------- */

export type CreateDonationRequest = {
  campusId?: string;
  fundId?: string;
  amount: number;
  currency: string;
  donorName?: string;
  donorEmail: string;
  note?: string;
};

export type DonationResponse = {
  id: string;
  [key: string]: unknown;
};

export const createDonation = (payload: CreateDonationRequest) =>
  api.post<DonationResponse>('/public/checkout/donations', payload);

/* -------- Payment -------- */

export type CreatePaymentRequest = {
  idempotencyKey: string;
  purpose: 'DONATION';
  source?: string;
  amount: number;
  currency: string;
  businessReference: { type: 'DONATION'; id: string };
  payer: { name?: string; email: string };
  integrationType: 'COLLECT_JS' | 'COLLECT_CHECKOUT';
  successUrl: string;
  cancelUrl: string;
  metadata?: Record<string, unknown>;
};

export type CreatePaymentResponse = {
  paymentReference: string;
  integrationType: 'COLLECT_JS' | 'COLLECT_CHECKOUT';
  redirectUrl?: string;
  collectionCheckout?: {
    scriptUrl: string;
    checkoutPublicKey: string;
    lineItems: unknown[];
    [key: string]: unknown;
  };
  [key: string]: unknown;
};

export const createCheckoutPayment = (payload: CreatePaymentRequest) =>
  api.post<CreatePaymentResponse>('/public/checkout/payments', payload);

/* -------- Token submission (COLLECT_JS only) -------- */

export const submitPaymentToken = (ref: string, paymentToken: string) =>
  api.post(`/public/checkout/payments/${ref}/token`, { paymentToken });

/* -------- Payment status polling -------- */

export type PaymentStatus = {
  id?: string;
  paymentReference?: string;
  status?: 'PENDING' | 'SUCCEEDED' | 'FAILED' | 'CANCELED' | 'EXPIRED';
  amount?: number;
  currency?: string;
  [key: string]: unknown;
};

export const getPaymentStatus = (ref: string) =>
  api.get<PaymentStatus>(`/public/checkout/payments/${ref}`);

/* -------- Gateway helpers -------- */

export function chooseIntegration(
  config: CheckoutConfig
): 'COLLECT_JS' | 'COLLECT_CHECKOUT' {
  const supported = config.supportedIntegrationTypes ?? [];
  return supported.includes('COLLECT_JS') ? 'COLLECT_JS' : 'COLLECT_CHECKOUT';
}

export async function loadScript(src: string): Promise<void> {
  return new Promise((resolve, reject) => {
    if (document.querySelector(`script[src="${src}"]`)) return resolve();
    const s = document.createElement('script');
    s.src = src;
    s.async = true;
    s.onload = () => resolve();
    s.onerror = () => reject(new Error(`Failed to load script: ${src}`));
    document.head.appendChild(s);
  });
}

declare global {
  interface Window {
    CollectJS?: {
      configure(opts: {
        variant: 'lightbox' | 'inline';
        callback?: (token: { token: string }) => void;
        [key: string]: unknown;
      }): void;
    };
    CollectCheckout?: {
      redirectToCheckout(opts: {
        scriptUrl: string;
        checkoutPublicKey: string;
        lineItems: unknown[];
        [key: string]: unknown;
      }): void;
    };
  }
}

const COLLECT_JS_CDN =
  'https://leadremit.transactiongateway.com/token/Collect.js';

/**
 * Load the Collect.js script, show the lightbox, return the payment token.
 */
export async function startCollectJs(publicKey: string): Promise<string> {
  await loadScript(`${COLLECT_JS_CDN}?tokenization-key=${publicKey}`);
  return new Promise<string>((resolve, reject) => {
    if (!window.CollectJS) return reject(new Error('CollectJS not available'));
    window.CollectJS.configure({
      variant: 'lightbox',
      callback: (token) => resolve(token.token),
    });
    // Trigger the lightbox by simulating the launch
    const btn = document.createElement('button');
    btn.setAttribute('data-tokenization-key', publicKey);
    btn.style.display = 'none';
    document.body.appendChild(btn);
    btn.click();
    document.body.removeChild(btn);
  });
}

/**
 * Trigger the CollectCheckout hosted redirect.
 */
export async function launchHostedCheckout(
  opts: NonNullable<CreatePaymentResponse['collectionCheckout']>
): Promise<never> {
  await loadScript(opts.scriptUrl);
  if (!window.CollectCheckout) throw new Error('CollectCheckout not available');
  window.CollectCheckout.redirectToCheckout(opts as Parameters<typeof window.CollectCheckout.redirectToCheckout>[0]);
  return new Promise(() => {}); // never resolves (page navigates away)
}

/**
 * Poll a payment reference until it settles (or times out after 5 minutes).
 * Uses the provided getter (public or customer variant).
 */
export async function waitForSettlement(
  ref: string,
  getter: (ref: string) => Promise<PaymentStatus> = getPaymentStatus,
  maxMs = 5 * 60 * 1000
): Promise<PaymentStatus> {
  const deadline = Date.now() + maxMs;
  while (Date.now() < deadline) {
    const status = await getter(ref);
    if (
      status.status === 'SUCCEEDED' ||
      status.status === 'FAILED' ||
      status.status === 'CANCELED' ||
      status.status === 'EXPIRED'
    ) {
      return status;
    }
    await new Promise((r) => setTimeout(r, 2000));
  }
  throw new Error('Payment timed out waiting for settlement');
}
