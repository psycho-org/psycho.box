/** Cooldown 에러 시 meta (CHALLENGE_OTP_COOLDOWN_ACTIVE 429) */
export interface ErrorMetaCooldown {
  availableAt: string; // ISO-8601
  retryAfterSeconds: number;
}

export interface ApiResult<T> {
  ok: boolean;
  status: number;
  data?: T;
  message?: string;
  /** 백엔드 에러 코드 (에러 시에만) */
  code?: string | null;
  /** Cooldown 등 특정 에러 시 추가 정보 */
  meta?: ErrorMetaCooldown | null;
}

let refreshInFlight: Promise<boolean> | null = null;

function getPathname(input: RequestInfo | URL): string | null {
  if (typeof input === 'string') {
    if (input.startsWith('/')) return input;
    try {
      return new URL(input).pathname;
    } catch {
      return null;
    }
  }

  if (input instanceof URL) {
    return input.pathname;
  }

  if (typeof Request !== 'undefined' && input instanceof Request) {
    try {
      return new URL(input.url).pathname;
    } catch {
      return input.url.startsWith('/') ? input.url : null;
    }
  }

  return null;
}

function shouldAttemptRefresh(input: RequestInfo | URL): boolean {
  const pathname = getPathname(input);
  if (!pathname?.startsWith('/api/real/')) return false;

  return ![
    '/api/real/auth/login',
    '/api/real/auth/logout',
    '/api/real/auth/refresh',
    '/api/real/auth/me',
  ].includes(pathname);
}

async function performRequest(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
  return fetch(input, {
    ...init,
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...(init?.headers ?? {}),
    },
  });
}

async function refreshAccessToken(): Promise<boolean> {
  if (!refreshInFlight) {
    refreshInFlight = (async () => {
      const response = await performRequest('/api/real/auth/refresh', { method: 'POST' });
      return response.ok;
    })().finally(() => {
      refreshInFlight = null;
    });
  }

  return refreshInFlight;
}

async function handleAuthFailure() {
  try {
    await performRequest('/api/real/auth/logout', { method: 'POST' });
  } catch {
    // Ignore cleanup failure and continue to login redirect.
  }

  if (typeof window !== 'undefined' && window.location.pathname !== '/login') {
    window.location.assign('/login');
  }
}

async function toApiResult<T>(response: Response): Promise<ApiResult<T>> {
  const payload = await response.json().catch(() => null);

  if (response.ok) {
    const data =
      payload && typeof payload === 'object' && 'data' in payload
        ? (payload as { data?: T }).data
        : (payload as T);
    return { ok: true, status: response.status, data };
  }

  const meta =
    payload && typeof payload === 'object' && payload !== null && 'meta' in payload
      ? (payload as { meta?: ErrorMetaCooldown }).meta ?? null
      : null;

  if (typeof window !== 'undefined') {
    console.warn('[apiRequest] request failed', {
      status: response.status,
      url: response.url,
      payload,
    });
  }

  return {
    ok: false,
    status: response.status,
    message: payload?.message ?? 'Request failed',
    code: payload?.code ?? null,
    meta: meta ?? undefined,
  };
}

export async function apiRequest<T>(
  input: RequestInfo | URL,
  init?: RequestInit,
): Promise<ApiResult<T>> {
  let response = await performRequest(input, init);

  if (response.status === 401 && shouldAttemptRefresh(input)) {
    const refreshSucceeded = await refreshAccessToken();

    if (refreshSucceeded) {
      response = await performRequest(input, init);
    } else {
      await handleAuthFailure();
      return toApiResult<T>(response);
    }

    if (response.status === 401) {
      await handleAuthFailure();
    }
  }

  return toApiResult<T>(response);
}
