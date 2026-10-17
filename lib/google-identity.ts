/**
 * Google Identity Services (GIS) helper.
 *
 * Wraps the GIS script into a Promise-based `signInWithGoogle()` that resolves
 * with the raw idToken (JWT credential) Google returns.  The BFF route at
 * /bff/auth/google then forwards that to POST /auth/google on the upstream.
 *
 * Authorized by go-worship-auth-endpoints.md (SO-011 / customer variant):
 *   POST /api/v1/auth/google (captcha) {idToken, timestamp, nonce, rememberMe}
 */

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize(config: GoogleIdConfig): void;
          prompt(notification?: (n: PromptNotification) => void): void;
          cancel(): void;
        };
      };
    };
  }
}

type GoogleIdConfig = {
  client_id: string;
  callback: (response: { credential: string }) => void;
  ux_mode?: 'popup' | 'redirect';
  cancel_on_tap_outside?: boolean;
  auto_select?: boolean;
};

type PromptNotification = {
  isNotDisplayed(): boolean;
  isSkippedMoment(): boolean;
  isDismissedMoment(): boolean;
  getNotDisplayedReason(): string;
  getSkippedReason(): string;
  getDismissedReason(): string;
};

export const GOOGLE_CLIENT_ID =
  process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ?? '';

let scriptPromise: Promise<void> | null = null;

function loadGisScript(): Promise<void> {
  if (typeof window === 'undefined') return Promise.reject(new Error('Server-side'));
  if (window.google?.accounts?.id) return Promise.resolve();
  if (scriptPromise) return scriptPromise;

  scriptPromise = new Promise<void>((resolve, reject) => {
    const existing = document.getElementById('gis-script');
    if (existing) {
      existing.addEventListener('load', () => resolve());
      return;
    }
    const script = document.createElement('script');
    script.id = 'gis-script';
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = () =>
      reject(new Error('Failed to load Google Identity Services'));
    document.head.appendChild(script);
  });
  return scriptPromise;
}

/**
 * Opens the Google sign-in popup and resolves with the idToken.
 * Rejects if the user dismisses the prompt or GIS can't display it.
 */
export function signInWithGoogle(): Promise<string> {
  if (!GOOGLE_CLIENT_ID) {
    return Promise.reject(
      new Error('Google sign-in is not configured (NEXT_PUBLIC_GOOGLE_CLIENT_ID missing)')
    );
  }

  return loadGisScript().then(
    () =>
      new Promise<string>((resolve, reject) => {
        window.google!.accounts.id.initialize({
          client_id: GOOGLE_CLIENT_ID,
          callback: ({ credential }) => resolve(credential),
          ux_mode: 'popup',
          cancel_on_tap_outside: true,
          auto_select: false,
        });

        window.google!.accounts.id.prompt((n) => {
          if (n.isNotDisplayed()) {
            reject(
              new Error(
                `Google sign-in unavailable: ${n.getNotDisplayedReason()}`
              )
            );
          } else if (n.isSkippedMoment()) {
            reject(
              new Error(`Google sign-in skipped: ${n.getSkippedReason()}`)
            );
          }
        });
      })
  );
}
