export interface ApiResult<T> {
  ok: boolean;
  status: number;
  data?: T;
  message?: string;
  /** 백엔드 에러 코드 (에러 시에만) */
  code?: string | null;
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

  return {
    ok: false,
    status: response.status,
    message: payload?.message ?? 'Request failed',
    code: payload?.code ?? null,
  };
}
