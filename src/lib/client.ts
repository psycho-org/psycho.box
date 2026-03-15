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

export async function apiRequest<T>(
  input: RequestInfo | URL,
  init?: RequestInit,
): Promise<ApiResult<T>> {
  const response = await fetch(input, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(init?.headers ?? {}),
    },
  });

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

  return {
    ok: false,
    status: response.status,
    message: payload?.message ?? 'Request failed',
    code: payload?.code ?? null,
    meta: meta ?? undefined,
  };
}
