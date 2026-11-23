/**
 * Recurring giving types and display utilities.
 *
 * API calls for payment methods and recurring giving schedules are in
 * customer.ts, which is the canonical source for customer-facing operations.
 */

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
