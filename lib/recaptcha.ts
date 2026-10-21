/**
 * Google reCAPTCHA **v3** (invisible, execute-on-submit).
 *
 * Site key is fetched from GET /bff/gw/auth/captcha/site-key at runtime,
 * with fallback to the hardcoded default (or NEXT_PUBLIC_RECAPTCHA_SITE_KEY).
 * The script is only loaded once the key is resolved.
 */

const FALLBACK_KEY =
  process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY ??
  '6Ld-gSssAAAAAJf4I6RFembg-ljQkh8TEng1ToJ4';

declare global {
  interface Window {
    grecaptcha?: {
      ready(cb: () => void): void;
      execute(siteKey: string, opts: { action: string }): Promise<string>;
    };
  }
}

/** Cached promise for the resolved site key. */
let keyPromise: Promise<string> | null = null;

function getSiteKey(): Promise<string> {
  return (keyPromise ??= (async () => {
    try {
      const res = await fetch('/bff/gw/auth/captcha/site-key', {
        headers: { Accept: 'application/json' },
        credentials: 'same-origin',
      });
      const data = await res.json().catch(() => null);
      const key = String(data?.siteKey ?? data?.data?.siteKey ?? '').trim();
      return key || FALLBACK_KEY;
    } catch {
      return FALLBACK_KEY;
    }
  })());
}

/** Cached promise for the reCAPTCHA script load (keyed to one script at a time). */
let scriptPromise: Promise<void> | null = null;

function loadScript(siteKey: string): Promise<void> {
  return (scriptPromise ??= new Promise<void>((resolve, reject) => {
    if (window.grecaptcha) return resolve();
    const s = document.createElement('script');
    s.src = `https://www.google.com/recaptcha/api.js?render=${siteKey}`;
    s.async = true;
    s.defer = true;
    s.onload = () => resolve();
    s.onerror = () => {
      scriptPromise = null;
      reject(new Error('Could not load reCAPTCHA'));
    };
    document.head.appendChild(s);
  }));
}

/** Warm up the site-key fetch and script load in the background. */
export function preloadRecaptcha(): void {
  getSiteKey().then(loadScript).catch(() => {});
}

/**
 * Mints a fresh v3 token for the given action. Call it on form submit.
 * Returns null if reCAPTCHA can't load (caller decides how to surface it).
 */
export async function executeRecaptcha(action: string): Promise<string | null> {
  try {
    const siteKey = await getSiteKey();
    await loadScript(siteKey);
    await new Promise<void>((r) => window.grecaptcha!.ready(() => r()));
    return await window.grecaptcha!.execute(siteKey, { action });
  } catch {
    return null;
  }
}
