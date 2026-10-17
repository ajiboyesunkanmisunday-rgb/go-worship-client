import { api, ApiError } from './client';

/**
 * Customer (church member) sign-up.
 *
 * How the sign-up form maps onto CustomerProvisionRequest:
 *
 *   firstName + lastName  -> displayName and profile.fullName
 *   email                 -> email and profile.email
 *   phoneNumber           -> profile.phone
 *   churchPosition        -> profile.jobTitle (the QA guide's own example
 *                            registers a CUSTOMER with jobTitle "Member")
 *   username              -> the email itself; the API requires it and the
 *                            design never asks for one
 *
 * Two fields deliberately do NOT go into the request body:
 *
 *   church          The tenant. The backend registers the user "in the current
 *                   tenant", resolved from the request host — it is never
 *                   accepted from the body. The form shows it read-only.
 *   location        The user's campus. The data model does support this —
 *                   UserAccount.campus exists — but CustomerProvisionRequest
 *                   has no campusId, and campuses are only listable via
 *                   /tenant/admin/campuses, which a signed-out visitor cannot
 *                   call. So it can't be set at registration yet.
 *
 *   gender          Not present anywhere in the API.
 *
 * The last three are open questions with the backend team; see
 * docs/backend-issues.md. Until they're resolved these values are collected
 * and kept client-side rather than silently discarded.
 */

export type SignUpDetails = {
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  churchPosition: string;
  gender?: string;
  location?: string;
};

export type CustomerProvisionRequest = {
  email: string;
  username: string;
  displayName: string;
  password: string;
  confirmPassword: string;
  captchaToken: string;
  profile: {
    fullName: string;
    email: string;
    phone?: string;
    jobTitle?: string;
    preferredLocale?: string;
    preferredTimezone?: string;
  };
};

/**
 * The QA guide's own example registers `"username": "member1@rccg.org"` — the
 * full email, not the local-part. Matching that rather than inventing a
 * shorter handle.
 */
export function usernameFromEmail(email: string) {
  return email.trim().toLowerCase();
}

export function toProvisionRequest(
  details: SignUpDetails,
  password: string,
  confirmPassword: string,
  captchaToken: string
): CustomerProvisionRequest {
  const fullName = `${details.firstName} ${details.lastName}`.trim();
  return {
    email: details.email,
    username: usernameFromEmail(details.email),
    displayName: fullName,
    password,
    confirmPassword,
    captchaToken,
    profile: {
      fullName,
      email: details.email,
      phone: details.phoneNumber,
      // The QA guide's example puts "Member" in jobTitle for a CUSTOMER, so
      // this is where Church Position belongs after all.
      jobTitle: details.churchPosition,
      preferredTimezone:
        Intl.DateTimeFormat().resolvedOptions().timeZone || undefined,
      preferredLocale:
        typeof navigator !== 'undefined' ? navigator.language : undefined,
    },
  };
}

/**
 * Posts to the dedicated BFF route which lifts captchaToken into the
 * X-Captcha-* headers before forwarding to the backend (the backend captcha
 * filter reads from headers, not the body — this was the original bug).
 *
 * Uses a direct fetch (not api.post) so the path is NOT prefixed with /bff/gw.
 */
export async function registerCustomer(payload: CustomerProvisionRequest) {
  const res = await fetch('/bff/auth/register', {
    method: 'POST',
    credentials: 'same-origin',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const data = await res.json().catch(() => null);
  if (!res.ok) {
    throw new ApiError(data?.message ?? 'Registration failed', res.status, data);
  }
  return data;
}
