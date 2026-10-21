/**
 * Customer (member) giving history.
 *
 * NOTE: GET /customer/donations is gone in the 177-path spec — that endpoint
 * was removed in the backend refactor. Member giving history now uses:
 *   GET /customer/payments  (paged PaymentResponse list)
 *   GET /customer/payments/{id}  (PaymentStatusResponse for detail/receipt)
 *   GET /customer/documents/{id}  via /bff/gw  → receipt download
 */

import { api } from './client';

export type PaymentResponse = {
  id: string;
  paymentReference: string;
  purpose?: string;
  status?: 'PENDING' | 'SUCCEEDED' | 'FAILED' | 'CANCELED' | 'EXPIRED';
  amount?: number;
  currency?: string;
  gatewayType?: string;
  requestedAt?: string;
  paidAt?: string;
  [key: string]: unknown;
};

export type CustomerPaymentsPage = {
  content?: PaymentResponse[];
  totalElements?: number;
  totalPages?: number;
  page?: number;
  size?: number;
};

/** Map a PaymentResponse to the giving display shape used in the UI. */
export function paymentToGiving(p: PaymentResponse) {
  return {
    id: p.id,
    reference: p.paymentReference,
    amount: p.amount ?? 0,
    currency: p.currency ?? 'USD',
    purpose: p.purpose ?? 'Donation',
    status: p.status ?? 'UNKNOWN',
    date: p.paidAt ?? p.requestedAt ?? '',
  };
}

export const getCustomerPayments = (page = 0, size = 20) =>
  api.get<CustomerPaymentsPage>(
    `/customer/payments?page=${page}&size=${size}`
  );

export type PaymentStatusResponse = {
  id?: string;
  paymentReference?: string;
  status?: string;
  amount?: number;
  currency?: string;
  documentId?: string;
  [key: string]: unknown;
};

export const getCustomerPaymentById = (id: string) =>
  api.get<PaymentStatusResponse>(`/customer/payments/${encodeURIComponent(id)}`);

/** URL to download/view a payment receipt (PDF document). */
export function receiptUrl(documentId: string) {
  return `/bff/gw/customer/documents/${documentId}`;
}

/* -------- Customer giving (authenticated donate flow) -------- */

export type CustomerDonationRequest = {
  campusId?: string;
  fundId?: string;
  amount: number;
  currency: string;
  note?: string;
};

export type CustomerDonationResponse = {
  id: string;
  [key: string]: unknown;
};

export const createCustomerDonation = (payload: CustomerDonationRequest) =>
  api.post<CustomerDonationResponse>('/customer/donations', payload);

export type CustomerPaymentRequest = {
  idempotencyKey: string;
  purpose: 'DONATION';
  amount: number;
  currency: string;
  businessReference: { type: 'DONATION'; id: string };
  integrationType: 'COLLECT_JS' | 'COLLECT_CHECKOUT';
  successUrl: string;
  cancelUrl: string;
  metadata?: Record<string, unknown>;
};

import type { CreatePaymentResponse, PaymentStatus } from './checkout';

export const createCustomerPayment = (payload: CustomerPaymentRequest) =>
  api.post<CreatePaymentResponse>('/customer/payments', payload);

export const submitCustomerPaymentToken = (ref: string, paymentToken: string) =>
  api.post(`/customer/payments/${encodeURIComponent(ref)}/token`, { paymentToken });

export const getCustomerPaymentStatus = (id: string) =>
  api.get<PaymentStatus>(`/customer/payments/${encodeURIComponent(id)}`);
