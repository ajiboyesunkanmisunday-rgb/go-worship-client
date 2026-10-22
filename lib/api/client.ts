import { apiUrl } from './config';

export class ApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly body?: unknown
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

type RequestOptions = Omit<RequestInit, 'body'> & { body?: unknown };

async function parse(res: Response) {
  const text = await res.text();
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

/**
 * Calls the same-origin BFF proxy. Tokens live in httpOnly cookies, so there's
 * no Authorization header here and no client-side refresh dance — the proxy
 * attaches the token, refreshes on 401, and replays the request.
 */
export async function apiFetch<T = unknown>(
  path: string,
  options: RequestOptions = {}
): Promise<T> {
  const { body, headers, ...rest } = options;

  const res = await fetch(apiUrl(path), {
    ...rest,
    credentials: 'same-origin',
    headers: {
      Accept: 'application/json',
      ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}),
      ...headers,
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  if (!res.ok) {
    const errBody = await parse(res);
    const message =
      (errBody && typeof errBody === 'object' && 'message' in errBody
        ? String((errBody as { message: unknown }).message)
        : null) ?? `Request failed (${res.status})`;

    // Session expired — redirect to login with the appropriate reason flag so
    // the login page can show the right banner.
    if (res.status === 401 && typeof window !== 'undefined') {
      const code =
        errBody && typeof errBody === 'object' && 'code' in errBody
          ? String((errBody as { code: unknown }).code)
          : null;
      const reason = code === 'IDLE_TIMEOUT' ? 'idle' : 'unauthorized';
      // Derive the portal login path from the current URL pathname.
      const { pathname } = window.location;
      let loginPath = '/auth/login';
      if (pathname.startsWith('/system'))             loginPath = '/system/login';
      else if (pathname.startsWith('/ministry-admin')) loginPath = '/ministry-admin/login';
      else if (pathname.startsWith('/ministry'))       loginPath = '/ministry/login';
      else if (pathname.startsWith('/sermon-admin'))   loginPath = '/sermon-admin/login';
      else if (pathname.startsWith('/group-leader'))   loginPath = '/group-leader/login';

      if (reason === 'idle') {
        // Let the IdleTimeout component show the countdown before redirecting,
        // mirroring the DO deployment behaviour where the user can click Stay.
        window.dispatchEvent(new CustomEvent('gw:session-expired'));
      } else {
        window.location.replace(`${loginPath}?reason=${reason}`);
      }
      // Throw so the caller's error boundary handles the in-flight state.
      throw new ApiError(message, res.status, errBody);
    }

    throw new ApiError(message, res.status, errBody);
  }

  return (await parse(res)) as T;
}

export const api = {
  get: <T>(path: string, o?: RequestOptions) =>
    apiFetch<T>(path, { ...o, method: 'GET' }),
  post: <T>(path: string, body?: unknown, o?: RequestOptions) =>
    apiFetch<T>(path, { ...o, method: 'POST', body }),
  put: <T>(path: string, body?: unknown, o?: RequestOptions) =>
    apiFetch<T>(path, { ...o, method: 'PUT', body }),
  patch: <T>(path: string, body?: unknown, o?: RequestOptions) =>
    apiFetch<T>(path, { ...o, method: 'PATCH', body }),
  del: <T>(path: string, o?: RequestOptions) =>
    apiFetch<T>(path, { ...o, method: 'DELETE' }),
};
