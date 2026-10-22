/**
 * Customer (member) giving history and donation intents.
 *
 * Backend (CustomerDonationController at /api/v1/customer/donations):
 *   GET  /customer/donations           → List<ContributionResponse>
 *   GET  /customer/donations/{id}      → ContributionResponse
 *   POST /customer/donations/intents   → ContributionResponse
 *
 * ContributionResponse: { donationId, tenantId, fundId, amount, currency,
 *   status, donorName, donorEmail, userProfileId, receivedAt }
 *
 * Backend (CustomerReceiptController at /api/v1/customer/receipts):
 *   GET  /customer/receipts/{id}       → GivingReceipt
 *   GET  /customer/receipts/{id}/pdf   → FileReferenceResponse (MinIO PDF link)
 *
 * NOTE: No /customer/payments endpoint exists. Payment is embedded in the
 * contribution intent; the hosted checkout redirect is via LeadRemit.
 */

import { api } from './client';

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
  const receivedAt = c['receivedAt'] as string | undefined;
  return {
    id: String(c['donationId'] ?? ''),
    paymentReference: String(c['donationId'] ?? ''),
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

/** GET /customer/donations — returns list; client-side paged for component compatibility. */
export const getCustomerPayments = async (page = 0, size = 20): Promise<CustomerPaymentsPage> => {
  const data = await api.get<unknown>('/customer/donations');
  const arr: R[] = Array.isArray(data) ? (data as R[]) : [];
  const all = arr.map(mapContribution);
  const start = page * size;
  const content = all.slice(start, start + size);
  return {
    content,
    totalElements: all.length,
    totalPages: Math.ceil(all.length / size) || 1,
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

/** GET /customer/donations/{id} */
export const getCustomerPaymentById = async (id: string): Promise<PaymentStatusResponse> => {
  const data = await api.get<R>(`/customer/donations/${encodeURIComponent(id)}`);
  return {
    id: String(data['donationId'] ?? ''),
    paymentReference: String(data['donationId'] ?? ''),
    status: String(data['status'] ?? ''),
    amount: data['amount'] != null ? Number(data['amount']) : undefined,
    currency: String(data['currency'] ?? 'USD'),
    ...data,
  };
};

/** URL to view a giving receipt PDF (MinIO reference via BFF proxy). */
export function receiptUrl(receiptId: string) {
  return `/bff/gw/customer/receipts/${receiptId}/pdf`;
}

/* -------- Customer donation intent (authenticated giving flow) -------- */

export type CustomerDonationRequest = {
  fundId?: string;
  amount: number;
  currency: string;
  donorName?: string;
  donorEmail?: string;
  userProfileId?: string;
};

export type CustomerDonationResponse = {
  donationId: string;
  tenantId?: string;
  [key: string]: unknown;
};

/** POST /customer/donations/intents — creates a contribution intent for an authenticated member. */
export const createCustomerDonation = (payload: CustomerDonationRequest) =>
  api.post<CustomerDonationResponse>('/customer/donations/intents', payload);
