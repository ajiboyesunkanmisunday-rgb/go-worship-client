/**
 * Customer recurring giving + saved payment methods.
 *
 * Backend (CustomerPaymentMethodController at /api/v1/customer/payment-methods):
 *   GET    /customer/payment-methods
 *   DELETE /customer/payment-methods/{paymentMethodId}
 *   PATCH  /customer/payment-methods/{paymentMethodId}/default
 *
 * Backend (CustomerRecurringGivingController at /api/v1/customer/recurring-giving):
 *   GET   /customer/recurring-giving
 *   POST  /customer/recurring-giving
 *   PATCH /customer/recurring-giving/{scheduleId}/pause
 *   PATCH /customer/recurring-giving/{scheduleId}/resume
 *   PATCH /customer/recurring-giving/{scheduleId}/cancel
 */

import { api } from './client';

/* -------- Payment Methods -------- */

export type PaymentMethod = {
  id: string;
  last4?: string;
  brand?: string;
  expMonth?: number;
  expYear?: number;
  isDefault?: boolean;
  [key: string]: unknown;
};

export const getPaymentMethods = () =>
  api.get<PaymentMethod[]>('/customer/payment-methods');

/** PATCH /customer/payment-methods/{id}/default */
export const setDefaultPaymentMethod = (id: string) =>
  api.patch<unknown>(`/customer/payment-methods/${encodeURIComponent(id)}/default`);

/** DELETE /customer/payment-methods/{id} */
export const deletePaymentMethod = (id: string) =>
  api.del<unknown>(`/customer/payment-methods/${encodeURIComponent(id)}`);

/** Short display label for a saved card, e.g. "Visa ending 4242". */
export function cardLabel(method: PaymentMethod) {
  const brand = method.brand ?? 'Card';
  const last4 = method.last4 ? ` ending ${method.last4}` : '';
  return `${brand}${last4}`;
}

/* -------- Recurring Giving -------- */

export type RecurringGivingFrequency =
  | 'DAILY'
  | 'WEEKLY'
  | 'BIWEEKLY'
  | 'MONTHLY'
  | 'QUARTERLY'
  | 'SEMIANNUALLY'
  | 'ANNUALLY';

export type RecurringGivingStatus =
  | 'ACTIVE'
  | 'PAUSED'
  | 'RETRY_PENDING'
  | 'PAYMENT_FAILED'
  | 'CANCELED'
  | 'COMPLETED'
  | 'EXPIRED';

export type RecurringGiving = {
  id: string;
  amount: number;
  currency: string;
  frequency: RecurringGivingFrequency;
  fundId?: string;
  status: RecurringGivingStatus;
  nextPaymentDate?: string;
  [key: string]: unknown;
};

export type CreateRecurringGivingRequest = {
  amount: number;
  currency: string;
  frequency: RecurringGivingFrequency;
  fundId: string;
  paymentMethodId: string;
};

export const getRecurringGiving = () =>
  api.get<RecurringGiving[]>('/customer/recurring-giving');

export const createRecurringGiving = (payload: CreateRecurringGivingRequest) =>
  api.post<RecurringGiving>('/customer/recurring-giving', payload);

export const pauseRecurringGiving = (id: string) =>
  api.patch<unknown>(`/customer/recurring-giving/${encodeURIComponent(id)}/pause`);

export const resumeRecurringGiving = (id: string) =>
  api.patch<unknown>(`/customer/recurring-giving/${encodeURIComponent(id)}/resume`);

export const cancelRecurringGiving = (id: string) =>
  api.patch<unknown>(`/customer/recurring-giving/${encodeURIComponent(id)}/cancel`);

/** Human-readable frequency label. */
export function frequencyLabel(f: RecurringGivingFrequency): string {
  switch (f) {
    case 'DAILY': return 'Daily';
    case 'WEEKLY': return 'Weekly';
    case 'BIWEEKLY': return 'Every 2 weeks';
    case 'MONTHLY': return 'Monthly';
    case 'QUARTERLY': return 'Every 3 months';
    case 'SEMIANNUALLY': return 'Every 6 months';
    case 'ANNUALLY': return 'Yearly';
    default: return f;
  }
}
