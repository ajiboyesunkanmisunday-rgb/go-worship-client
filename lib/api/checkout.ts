/**
 * Public giving checkout API.
 *
 * Confirmed from live OpenAPI spec:
 *   GET  /public/checkout/config
 *   POST /public/checkout/donations
 *   POST /public/checkout/donations/{paymentReference}/token
 *   GET  /public/checkout/sessions/{checkoutToken}/status
 *   GET  /public/checkout/links/{opaqueToken}
 *   GET  /public/checkout/links/{opaqueToken}/qr
 *
 * Flow: getCheckoutConfig → createDonation (returns CheckoutSessionResponse with redirectUrl)
 *       → window.location.href = session.redirectUrl
 *
 * For COLLECT_JS integration type: createDonation first (get paymentReference),
 * then CollectJS captures card → exchangeCollectJsToken → redirect.
 */

import { api } from './client';

/* -------- Pre-checkout config (CheckoutConfigurationResponse) -------- */

export type CheckoutConfig = {
  tenantId?: string;
  tenantDisplayName?: string;
  gatewayType?: 'LEADREMIT_PAY' | 'STRIPE' | 'PAYPAL';
  environment?: 'LOCAL' | 'STAGING' | 'SANDBOX' | 'PRODUCTION';
  supportedIntegrationTypes?: ('COLLECT_JS' | 'COLLECT_CHECKOUT' | 'PROVIDER_REDIRECT' | 'TOKENIZED')[];
  publicKey?: string;
  checkoutUrl?: string;
  branding?: Record<string, unknown>;
  /** Not in current spec — may be populated by future backend additions. */
  campuses?: { id: string; name: string }[];
  funds?: { id: string; name: string }[];
  currencies?: string[];
};

/** GET /public/checkout/config */
export const getCheckoutConfig = () =>
  api.get<CheckoutConfig>('/public/checkout/config').catch((): CheckoutConfig => ({}));

/* -------- Guest donation checkout (DonationCheckoutRequest) -------- */

export type IntegrationType = 'COLLECT_JS' | 'COLLECT_CHECKOUT' | 'PROVIDER_REDIRECT' | 'TOKENIZED';
export type RedirectPreference =
  | 'APPLICATION_DEFAULT'
  | 'PAYMENT_STATUS'
  | 'DONATION_CONFIRMATION'
  | 'SUBSCRIPTION_BILLING'
  | 'NONE';

export type CreateDonationRequest = {
  campusId: string;
  fundId: string;
  amount: number;
  currency: string;
  idempotencyKey: string;
  integrationType: IntegrationType;
  redirectPreference: RedirectPreference;
  checkoutLinkToken?: string;
  paymentMethodId?: string;
  donorName?: string;
  donorEmail?: string;
  note?: string;
};

/** Returned by all donation creation + token exchange endpoints. */
export type CheckoutSessionResponse = {
  checkoutSessionId?: string;
  paymentId?: string;
  paymentReference?: string;
  paymentStatus?: 'PENDING' | 'PROCESSING' | 'REQUIRES_ACTION' | 'AUTHORIZED' | 'SUCCEEDED' | 'FAILED' | 'CANCELED' | 'EXPIRED' | 'PARTIALLY_REFUNDED' | 'REFUNDED';
  sessionStatus?: 'ACTIVE' | 'COMPLETED' | 'CANCELED' | 'EXPIRED' | 'REVOKED';
  gatewayType?: 'LEADREMIT_PAY' | 'STRIPE' | 'PAYPAL';
  integrationType?: IntegrationType;
  requiresRedirect?: boolean;
  redirectUrl?: string;
  issuedAt?: string;
  expiresAt?: string;
};

/** POST /public/checkout/donations — creates a guest donation, returns session with redirectUrl. */
export const createDonation = (payload: CreateDonationRequest) =>
  api.post<CheckoutSessionResponse>('/public/checkout/donations', payload);

/**
 * POST /public/checkout/donations/{paymentReference}/token
 *
 * COLLECT_JS flow only: exchange a CollectJS paymentToken for a checkout session.
 * For COLLECT_CHECKOUT / PROVIDER_REDIRECT, createDonation already returns redirectUrl.
 */
export const exchangeCollectJsToken = (paymentReference: string, paymentToken: string) =>
  api.post<CheckoutSessionResponse>(
    `/public/checkout/donations/${encodeURIComponent(paymentReference)}/token`,
    { paymentToken }
  );

/* -------- Gateway helpers -------- */

/** GET /public/checkout/sessions/{checkoutToken}/status */
export const getCheckoutSessionStatus = (checkoutToken: string) =>
  api.get<{ status?: string; paymentReference?: string; [key: string]: unknown }>(
    `/public/checkout/sessions/${encodeURIComponent(checkoutToken)}/status`
  );

/** GET /public/checkout/links/{opaqueToken} */
export const getCheckoutLink = (opaqueToken: string) =>
  api.get<Record<string, unknown>>(`/public/checkout/links/${encodeURIComponent(opaqueToken)}`);

/** GET /public/checkout/links/{opaqueToken}/qr */
export const getCheckoutLinkQr = (opaqueToken: string) =>
  api.get<unknown>(`/public/checkout/links/${encodeURIComponent(opaqueToken)}/qr`);

export function chooseIntegration(config: CheckoutConfig): IntegrationType {
  const supported = config.supportedIntegrationTypes ?? [];
  if (supported.includes('COLLECT_CHECKOUT')) return 'COLLECT_CHECKOUT';
  if (supported.includes('PROVIDER_REDIRECT')) return 'PROVIDER_REDIRECT';
  if (supported.includes('COLLECT_JS')) return 'COLLECT_JS';
  return 'COLLECT_CHECKOUT';
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
