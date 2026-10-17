import { api, ApiError } from './client';

/** Endpoints from the Go-Worship backend (auth, self-service, MFA). */

export type LoginRequest = {
  email: string;
  password: string;
  captchaToken: string;
  rememberMe?: boolean;
  tenantId?: string | null;
};

export type CompleteFirstLoginRequest = {
  challengeToken: string;
  newPassword: string;
  confirmPassword: string;
  rememberMe?: boolean;
  tenantId?: string | null;
};

export type LoginResponse = {
  ok?: boolean;
  passwordChangeRequired?: boolean;
  challengeToken?: string | null;
  expiresInSeconds?: number | null;
  tenantId?: string | null;
  username?: string;
  message?: string;
  userType?: string | null;
  roles?: string[];
  authLevel?: string | null;
  mfa?: { enabled?: boolean; optionalSetup?: boolean } | null;
  mfaRequired?: boolean;
  mfaSessionId?: string | null;
  allowedMethods?: string[];
  primaryFactor?: string | null;
};

async function authRoute<T>(path: string, body?: unknown): Promise<T> {
  const res = await fetch(path, {
    method: 'POST',
    credentials: 'same-origin',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body ?? {}),
  });
  const data = await res.json().catch(() => null);
  if (!res.ok) {
    throw new ApiError(data?.message ?? 'Request failed', res.status, data);
  }
  return data as T;
}

export const login = (payload: LoginRequest) =>
  authRoute<LoginResponse>('/bff/auth/login', payload);

export type GoogleLoginRequest = {
  idToken: string;
  captchaToken: string;
  rememberMe?: boolean;
};

export const googleLogin = (payload: GoogleLoginRequest) =>
  authRoute<LoginResponse>('/bff/auth/google', payload);

export const logout = () => authRoute<{ ok: true }>('/bff/auth/logout');

export const completeFirstLogin = (payload: CompleteFirstLoginRequest) =>
  authRoute<{ ok: true; roles: string[] }>(
    '/bff/auth/first-login/complete',
    payload
  );

/* ---------------- Login MFA (no session yet) ---------------- */

export type MfaBeginRequest = {
  mfaSessionId: string;
  method: string;
};

export type MfaBeginResponse = {
  /** For OTP_EMAIL/SMS: the token the verify call needs. */
  tokenId?: string | null;
  /** For TOTP: "ENTER_TOTP" */
  challengeType?: string | null;
  payloadJson?: { tokenId?: string } | null;
};

export type MfaVerifyRequest = {
  mfaSessionId: string;
  method: string;
  code: string;
  /** OTP_EMAIL/SMS only — from the begin response. */
  tokenId?: string | null;
};

export type MfaVerifyResponse = {
  ok: boolean;
  userType?: string | null;
  roles?: string[];
  authLevel?: string | null;
};

/** ARM a login-MFA challenge (step after login returns mfaRequired). */
export const beginLoginMfa = (payload: MfaBeginRequest) =>
  authRoute<MfaBeginResponse>('/bff/auth/mfa/begin', payload);

/** VERIFY the login-MFA code and complete the login (sets cookies). */
export const verifyLoginMfa = (payload: MfaVerifyRequest) =>
  authRoute<MfaVerifyResponse>('/bff/auth/mfa/verify', payload);

/* ---------------- Password recovery ---------------- */

export const forgotPassword = (email: string, captchaToken: string) =>
  api.post('/auth/forgot-password', { email, captchaToken });

export const resetPassword = (token: string, newPassword: string) =>
  api.post('/auth/reset-password', { token, newPassword });

export const changePassword = (
  currentPassword: string,
  newPassword: string,
  confirmPassword: string
) =>
  api.post('/auth/password/change', {
    currentPassword,
    newPassword,
    confirmPassword,
  });

/* ---------------- Self profile ---------------- */

export type Profile = {
  id?: string;
  firstName?: string;
  lastName?: string;
  displayName?: string;
  email?: string;
  mobilePhone?: string;
  roles?: string[];
};

export const getProfile = () => api.get<Profile>('/self/profile');
export const updateProfile = (payload: Partial<Profile>) =>
  api.put<Profile>('/self/profile', payload);

/* ---------------- MFA self-service (Bearer via /bff/gw) ---------------- */

export type MfaSettings = {
  mfaEnabled: boolean;
  preferredMethod: string | null;
  enrolledMethods: string[];
  totpEnrolled: boolean;
  otpEmailAvailable: boolean;
  eligibleMethods: string[];
};

export type MfaSettingsResponse = {
  ok: boolean;
  code?: string;
  data: MfaSettings;
};

export const getMfaSettings = () =>
  api.get<MfaSettingsResponse>('/self/security/mfa');

/* ---- Enrollment ---- */

export type EnrollBeginRequest = {
  method: 'OTP_EMAIL' | 'TOTP';
};

export type OtpEmailEnrollBeginResponse = {
  tokenId?: string;
  method: string;
};

export type TotpEnrollBeginResponse = {
  secret?: string;
  otpauthUri?: string;
  method: string;
};

export const beginMfaEnrollment = (payload: EnrollBeginRequest) =>
  api.post<OtpEmailEnrollBeginResponse | TotpEnrollBeginResponse>(
    '/self/security/mfa/enrollment/begin',
    payload
  );

export type OtpEmailEnrollCompleteRequest = {
  method: 'OTP_EMAIL';
  tokenId: string;
  code: string;
};

export type TotpEnrollCompleteRequest = {
  method: 'TOTP';
  secret: string;
  code: string;
  makePreferred?: boolean;
};

export const completeEmailMfaEnrollment = (
  payload: OtpEmailEnrollCompleteRequest
) => api.post('/self/security/mfa/enrollment/complete', payload);

export const completeTotpMfaEnrollment = (
  payload: TotpEnrollCompleteRequest
) => api.post('/self/security/mfa/enrollment/complete', payload);

/* ---- Preferences ---- */

export type MfaPreferencesRequest = {
  enabled: boolean;
  preferredMethod?: string | null;
};

export const updateMfaPreferences = (payload: MfaPreferencesRequest) =>
  api.put('/self/security/mfa/preferences', payload);

/* ---- Disable ---- */

export const disableMfaEnrollment = (method: string) =>
  // TN-034: collection shows GET with body — almost certainly a typo; using
  // POST (sendable, consistent with all sibling enrollment endpoints).
  // Flagged to backend (docs/backend-issues.md).
  api.post('/self/security/mfa/enrollment/disable', { method });

/* ---------------- Step-up MFA for sensitive actions ---------------- */

/**
 * Response shape when a protected write returns 200 with ok:false and
 * code:"MFA_REQUIRED" (step-up, not enrollment-required).
 */
export type StepUpMfaChallengeResponse = {
  ok: false;
  code: 'MFA_REQUIRED';
  mfaSessionId: string;
  allowedMethods: string[];
  pendingActionId: string;
  nextAction: { type: string; path: string };
};

/** Detect the step-up MFA response from any provisioning/sensitive-action call. */
export function isStepUpChallenge(data: unknown): data is StepUpMfaChallengeResponse {
  return (
    typeof data === 'object' &&
    data !== null &&
    (data as Record<string, unknown>).ok === false &&
    (data as Record<string, unknown>).code === 'MFA_REQUIRED'
  );
}

export type StepUpBeginRequest = {
  mfaSessionId: string;
  method: string;
};

export type StepUpVerifyRequest = {
  mfaSessionId: string;
  method: string;
  code: string;
  /** Carries the pending action to commit on successful verification. */
  pendingActionId: string;
};

/** Begin a step-up challenge (authenticated, via /bff/gw). */
export const stepUpBeginMfa = (payload: StepUpBeginRequest) =>
  api.post('/auth/mfa/begin', payload);

/** Verify step-up + commit the pending action (authenticated, via /bff/gw). */
export const stepUpVerifyMfa = (payload: StepUpVerifyRequest) =>
  api.post('/auth/mfa/verify', payload);

/* ---------------- Public registration ---------------- */

/** TN-001A/B  POST /api/v1/public/tenants/register (via /bff/auth/register-tenant). */
export type TenantRegistration = {
  tenant: {
    name: string;
    shortName?: string;
    slug: string;
    legalName?: string;
    billingEmail: string;
    /** Bare subdomain label, e.g. "rccgros" → rccgros.go-worship.com. Null when customDomain is set. */
    subDomain?: string | null;
    /** Full custom domain, e.g. "worship.rccg.org". Null when subDomain is set. */
    customDomain?: string | null;
    countryCode?: string;
    currency?: string;
  };
  adminEmail: string;
  rawPassword: string;
  confirmPassword: string;
  displayName: string;
  phone?: string;
  captchaToken: string;
};

export const registerTenant = (payload: TenantRegistration) =>
  authRoute<{ ok: true }>('/bff/auth/register-tenant', payload);
