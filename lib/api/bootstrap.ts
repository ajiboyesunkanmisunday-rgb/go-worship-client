import { upstreamFetch, UPSTREAM } from './server';

export type SiteBranding = {
  logoUrl?: string;
  faviconUrl?: string;
  primaryColor?: string;
  secondaryColor?: string;
  accentColor?: string;
  fontFamily?: string;
  organizationName?: string;
};

export type SiteAuthentication = {
  customerPasswordLogin?: boolean;
  customerGoogleLogin?: boolean;
  tenantUserLogin?: boolean;
  systemOwnerLogin?: boolean;
};

export type SiteRegistration = {
  customerRegistration?: boolean;
  tenantRegistration?: boolean;
};

export type SubscriptionAccess = 'FULL_ACCESS' | 'MINIMAL_ACCESS' | 'NO_ACCESS';

export type SiteContext = {
  contextType: 'SYSTEM_OWNER' | 'TENANT' | 'UNKNOWN';
  tenantId?: string;
  tenantSlug?: string;
  displayName?: string;
  branding?: SiteBranding;
  authentication?: SiteAuthentication;
  registration?: SiteRegistration;
  subscriptionAccess?: SubscriptionAccess;
};

type R = Record<string, unknown>;

function str(v: unknown): string | undefined {
  return typeof v === 'string' && v ? v : undefined;
}

function bool(v: unknown): boolean | undefined {
  return typeof v === 'boolean' ? v : undefined;
}

/**
 * Fetches the public site context for the current host.
 * Authorized by go-worship-frontend-spec.md — GET /public/site?templateType=WEB.
 * Returns null on any error or non-2xx response (caller falls back to defaults).
 */
export async function fetchSiteContext(
  upstreamBase: string = UPSTREAM
): Promise<SiteContext | null> {
  try {
    const res = await upstreamFetch(
      '/public/site?templateType=WEB',
      { method: 'GET' },
      upstreamBase
    );
    if (!res.ok) return null;
    const json = (await res.json()) as R;
    // response may nest payload under `data`
    const d = ((json?.data ?? json) || {}) as R;

    const raw = (
      (d.branding ?? d.brand ?? d.brandingConfig ?? {}) as R
    );
    const auth = (
      (d.authentication ?? d.authOptions ?? d.auth ?? {}) as R
    );
    const reg = ((d.registration ?? d.register ?? {}) as R);

    const ctxRaw = str(d.contextType ?? d.context);
    const contextType: SiteContext['contextType'] =
      ctxRaw === 'SYSTEM_OWNER' || ctxRaw === 'TENANT' ? ctxRaw : 'UNKNOWN';

    const subAccRaw = str(d.subscriptionAccess ?? d.accessLevel ?? d.access);
    const subscriptionAccess: SubscriptionAccess | undefined =
      subAccRaw === 'FULL_ACCESS' || subAccRaw === 'MINIMAL_ACCESS' || subAccRaw === 'NO_ACCESS'
        ? subAccRaw
        : undefined;

    return {
      contextType,
      tenantId: str(d.tenantId),
      tenantSlug: str(d.tenantSlug ?? d.slug),
      displayName: str(d.displayName ?? d.name),
      subscriptionAccess,
      branding: {
        logoUrl: str(raw.logoUrl ?? raw.logo),
        faviconUrl: str(raw.faviconUrl ?? raw.favicon),
        primaryColor: str(raw.primaryColor ?? raw.primary),
        secondaryColor: str(raw.secondaryColor ?? raw.secondary),
        accentColor: str(raw.accentColor ?? raw.accent),
        fontFamily: str(raw.fontFamily ?? raw.font),
        organizationName: str(raw.organizationName ?? raw.name),
      },
      authentication: {
        customerPasswordLogin: bool(auth.customerPasswordLogin),
        customerGoogleLogin: bool(auth.customerGoogleLogin),
        tenantUserLogin: bool(auth.tenantUserLogin),
        systemOwnerLogin: bool(auth.systemOwnerLogin),
      },
      registration: {
        customerRegistration: bool(reg.customerRegistration),
        tenantRegistration: bool(reg.tenantRegistration),
      },
    };
  } catch {
    return null;
  }
}
