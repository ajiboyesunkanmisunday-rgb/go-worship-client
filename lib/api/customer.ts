/**
 * Customer (member) payment history, payment methods and recurring giving.
 *
 * Backend:
 *   GET  /customer/payments            → Page<EntityTransport>
 *   GET  /customer/payments/{id}       → EntityTransport
 *   GET  /customer/payment-methods     → PaymentMethodResponse[]
 *   GET  /customer/recurring-giving    → RecurringGivingSchedule[]
 *   POST /customer/payments/donations  → CheckoutSessionResponse
 *
 * Backend (CustomerReceiptController at /api/v1/customer/receipts):
 *   GET  /customer/receipts/{id}       → GivingReceipt
 *   GET  /customer/receipts/{id}/pdf   → FileReferenceResponse (MinIO PDF link)
 */

import { api } from './client';
import type { CheckoutSessionResponse, IntegrationType, RedirectPreference } from './checkout';

export type PaymentResponse = {
  id: string;
  paymentReference: string;
  purpose?: string;
  status?: string;
  amount?: number;
  currency?: string;
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

type R = Record<string, unknown>;

function mapContribution(c: R): PaymentResponse {
  const receivedAt = (c['receivedAt'] ?? c['paidAt'] ?? c['requestedAt']) as string | undefined;
  const id = String(c['id'] ?? c['donationId'] ?? '');
  return {
    id,
    paymentReference: String(c['paymentReference'] ?? id),
    status: String(c['status'] ?? ''),
    amount: c['amount'] != null ? Number(c['amount']) : undefined,
    currency: String(c['currency'] ?? 'USD'),
    paidAt: receivedAt,
    requestedAt: receivedAt,
    fundId: c['fundId'],
    donorName: c['donorName'],
    donorEmail: c['donorEmail'],
    tenantId: c['tenantId'],
  };
}

/** Map a PaymentResponse to the giving display shape used in the UI. */
export function paymentToGiving(p: PaymentResponse) {
  return {
    id: p.id,
    reference: p.paymentReference,
    amount: p.amount ?? 0,
    currency: p.currency ?? 'USD',
    purpose: (p['fundId'] as string) ?? p.purpose ?? 'Donation',
    status: p.status ?? 'UNKNOWN',
    date: p.paidAt ?? p.requestedAt ?? '',
  };
}

/** GET /customer/payments — server-paged payment history. */
export const getCustomerPayments = async (page = 0, size = 20): Promise<CustomerPaymentsPage> => {
  const data = await api.get<unknown>(`/customer/payments?page=${page}&size=${size}`);
  const d = (data && typeof data === 'object') ? data as R : {};
  const arr: R[] = Array.isArray(d['content']) ? (d['content'] as R[]) : Array.isArray(data) ? (data as R[]) : [];
  return {
    content: arr.map(mapContribution),
    totalElements: d['totalElements'] != null ? Number(d['totalElements']) : arr.length,
    totalPages: d['totalPages'] != null ? Number(d['totalPages']) : (Math.ceil(arr.length / size) || 1),
    page,
    size,
  };
};

export type PaymentStatusResponse = {
  id?: string;
  paymentReference?: string;
  status?: string;
  amount?: number;
  currency?: string;
  [key: string]: unknown;
};

/** GET /customer/payments/{id} */
export const getCustomerPaymentById = async (id: string): Promise<PaymentStatusResponse> => {
  const data = await api.get<R>(`/customer/payments/${encodeURIComponent(id)}`);
  const resolvedId = String(data['id'] ?? data['donationId'] ?? '');
  return {
    id: resolvedId,
    paymentReference: String(data['paymentReference'] ?? resolvedId),
    status: String(data['status'] ?? ''),
    amount: data['amount'] != null ? Number(data['amount']) : undefined,
    currency: String(data['currency'] ?? 'USD'),
    ...data,
  };
};

/** GET /customer/payment-methods */
export const getCustomerPaymentMethods = () =>
  api.get<R[]>('/customer/payment-methods').then((d) => Array.isArray(d) ? d : []);

/** GET /customer/recurring-giving */
export const getCustomerRecurringGiving = () =>
  api.get<R[]>('/customer/recurring-giving').then((d) => Array.isArray(d) ? d : []);

/** POST /customer/recurring-giving */
export const createCustomerRecurringGiving = (payload: R) =>
  api.post<R>('/customer/recurring-giving', payload);

/** PATCH /customer/recurring-giving/{scheduleId}/pause */
export const pauseCustomerRecurringGiving = (scheduleId: string) =>
  api.patch<unknown>(`/customer/recurring-giving/${encodeURIComponent(scheduleId)}/pause`);

/** PATCH /customer/recurring-giving/{scheduleId}/resume */
export const resumeCustomerRecurringGiving = (scheduleId: string) =>
  api.patch<unknown>(`/customer/recurring-giving/${encodeURIComponent(scheduleId)}/resume`);

/** PATCH /customer/recurring-giving/{scheduleId}/cancel */
export const cancelCustomerRecurringGiving = (scheduleId: string) =>
  api.patch<unknown>(`/customer/recurring-giving/${encodeURIComponent(scheduleId)}/cancel`);

/** DELETE /customer/payment-methods/{paymentMethodId} */
export const revokeCustomerPaymentMethod = (paymentMethodId: string) =>
  api.del<unknown>(`/customer/payment-methods/${encodeURIComponent(paymentMethodId)}`);

/** PATCH /customer/payment-methods/{paymentMethodId}/default */
export const setDefaultCustomerPaymentMethod = (paymentMethodId: string) =>
  api.patch<unknown>(`/customer/payment-methods/${encodeURIComponent(paymentMethodId)}/default`);

/** URL to view a giving receipt PDF (MinIO reference via BFF proxy). */
export function receiptUrl(receiptId: string) {
  return `/bff/gw/customer/receipts/${receiptId}/pdf`;
}

/* -------- Customer donation checkout (authenticated giving flow) -------- */

export type CustomerDonationRequest = {
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

/** POST /customer/payments/donations — creates a donation payment, returns session with redirectUrl. */
export const createCustomerDonation = (payload: CustomerDonationRequest) =>
  api.post<CheckoutSessionResponse>('/customer/payments/donations', payload);
