/**
 * Google reCAPTCHA **v3** (invisible, execute-on-submit).
 *
 * The backend's own token tool (recaptcha-token.html) uses v3 —
 * `api.js?render=<siteKey>` then `grecaptcha.execute(siteKey, {action})`.
 * There is no checkbox; a token is minted per submit.
 *
 * Site key: the correct 40-char key from the backend tool. The public
 * `GET /auth/captcha/site-key` endpoint currently returns the same key plus a
 * spurious `ff` (42 chars) — a backend typo — so we do NOT use that endpoint's
 * value. Override via NEXT_PUBLIC_RECAPTCHA_SITE_KEY once the backend is fixed.
 */

export const RECAPTCHA_SITE_KEY =
  process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY ??
  '6LfbSHAsAAAAAFnhtf-lPAKUG83fUiXdFPLsxzMx';

declare global {
  interface Window {
    grecaptcha?: {
      ready(cb: () => void): void;
      execute(siteKey: string, opts: { action: string }): Promise<string>;
    };
  }
}

let scriptPromise: Promise<void> | null = null;

function loadScript(siteKey: string) {
  scriptPromise ??= new Promise<void>((resolve, reject) => {
    if (window.grecaptcha) return resolve();
    const s = document.createElement('script');
    s.src = `https://www.google.com/recaptcha/api.js?render=${siteKey}`;
    s.async = true;
    s.defer = true;
    s.onload = () => resolve();
    s.onerror = () => {
      scriptPromise = null; // allow retry
      reject(new Error('Could not load reCAPTCHA'));
    };
    document.head.appendChild(s);
  });
  return scriptPromise;
}

/**
 * Mints a fresh v3 token for the given action. Call it on form submit.
 * Returns null if reCAPTCHA can't load (caller decides how to surface it).
 */
export async function executeRecaptcha(
  action: string,
  siteKey: string = RECAPTCHA_SITE_KEY
): Promise<string | null> {
  try {
    await loadScript(siteKey);
    await new Promise<void>((r) => window.grecaptcha!.ready(() => r()));
    return await window.grecaptcha!.execute(siteKey, { action });
  } catch {
    return null;
  }
}
