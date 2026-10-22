/**
 * Public giving checkout API.
 *
 * Backend reality (no /public/checkout/* endpoints exist):
 *
 *   Guest donation intent:
 *     POST /public/contributions/guest/intents
 *     Request:  ContributionIntentRequest { fundId, amount, currency, donorName, donorEmail, userProfileId }
 *     Response: ContributionResponse { donationId, tenantId, fundId, amount, currency, status, ... }
 *
 *   LeadRemit checkout config (after donation intent is created):
 *     GET  /public/payments/leadremit/checkout-config/{donationId}?tenantId={tenantId}
 *     Response: { paymentReference, tenantId, scriptUrl (checkoutScriptUrl), checkoutPublicKey,
 *                 successUrl, cancelUrl, qrUrl }
 *
 *   The actual card capture is fully hosted by LeadRemit CollectCheckout:
 *     CollectCheckout.redirectToCheckout({ scriptUrl, checkoutPublicKey, lineItems: [] })
 *   The page navigates away; the user is redirected back to successUrl/cancelUrl.
 *
 *   NOTE: There is no global /public/checkout/config endpoint, no /public/checkout/donations,
 *   no /public/checkout/payments, and no payment-status polling endpoint.
 *   getCheckoutConfig() returns an empty config; campuses/funds are not publicly served.
 */

import { api } from './client';

/* -------- Pre-checkout config (stub — no backend endpoint) -------- */

export type CheckoutConfig = {
  tenantDisplayName?: string;
  branding?: { primaryColor?: string };
  campuses?: { id: string; name: string }[];
  funds?: { id: string; name: string }[];
  currencies?: string[];
  publicKey?: string;
  supportedIntegrationTypes?: ('COLLECT_JS' | 'COLLECT_CHECKOUT')[];
};

/**
 * No global checkout config endpoint exists in the backend.
 * Returns an empty config so the checkout form renders with its defaults.
 */
export const getCheckoutConfig = async (): Promise<CheckoutConfig> => ({});

/* -------- Guest donation intent -------- */

export type CreateDonationRequest = {
  fundId?: string;
  amount: number;
  currency: string;
  donorName?: string;
  donorEmail: string;
  userProfileId?: string;
};

export type DonationResponse = {
  donationId: string;
  tenantId?: string;
  fundId?: string;
  amount?: number;
  currency?: string;
  status?: string;
  donorName?: string;
  donorEmail?: string;
  receivedAt?: string;
  [key: string]: unknown;
};

/** POST /public/contributions/guest/intents — creates a guest donation intent. */
export const createDonation = (payload: CreateDonationRequest) =>
  api.post<DonationResponse>('/public/contributions/guest/intents', payload);

/* -------- LeadRemit hosted checkout config -------- */

export type LeadremitCheckoutConfig = {
  paymentReference?: string;
  tenantId?: string;
  scriptUrl?: string;
  checkoutPublicKey?: string;
  successUrl?: string;
  cancelUrl?: string;
  qrUrl?: string;
  [key: string]: unknown;
};

/**
 * GET /public/payments/leadremit/checkout-config/{donationId}?tenantId={tenantId}
 *
 * Called after creating a donation intent; returns the CollectCheckout script URL
 * and public key needed to launch the hosted payment page.
 */
export const getLeadremitCheckoutConfig = (donationId: string, tenantId?: string) => {
  const qs = tenantId ? `?tenantId=${encodeURIComponent(tenantId)}` : '';
  return api.get<LeadremitCheckoutConfig>(
    `/public/payments/leadremit/checkout-config/${encodeURIComponent(donationId)}${qs}`
  );
};

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
 * The page navigates away and never returns; call sites should treat this as final.
 */
export async function launchHostedCheckout(opts: {
  scriptUrl: string;
  checkoutPublicKey: string;
  lineItems?: unknown[];
  [key: string]: unknown;
}): Promise<never> {
  await loadScript(opts.scriptUrl);
  if (!window.CollectCheckout) throw new Error('CollectCheckout not available');
  window.CollectCheckout.redirectToCheckout({
    ...opts,
    lineItems: opts.lineItems ?? [],
  });
  return new Promise(() => {}); // never resolves — page navigates away
}
