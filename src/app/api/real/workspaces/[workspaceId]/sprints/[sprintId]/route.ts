import { cookies } from 'next/headers';
import { ACCESS_TOKEN_COOKIE, BACKEND_API_URL, USER_ID_COOKIE } from '@/lib/constants';

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function toUuid(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  return UUID_PATTERN.test(trimmed) ? trimmed : null;
}

function parseJwtPayload(token: string): Record<string, unknown> | null {
  const [, payload] = token.split('.');
  if (!payload) return null;

  try {
    const normalized = payload.replace(/-/g, '+').replace(/_/g, '/');
    const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, '=');
    const json = Buffer.from(padded, 'base64').toString('utf-8');
    const parsed = JSON.parse(json) as unknown;
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return null;
    return parsed as Record<string, unknown>;
  } catch {
    return null;
  }
}

function resolveAccountId(options: {
  queryAccount: string | null;
  cookieUserId: string | null;
  accessToken: string;
}): string | null {
  const { queryAccount, cookieUserId, accessToken } = options;
  const fromQuery = toUuid(queryAccount);
  if (fromQuery) return fromQuery;

  const fromCookie = toUuid(cookieUserId);
  if (fromCookie) return fromCookie;

  const payload = parseJwtPayload(accessToken);
  if (!payload) return null;

  const userRecord =
    payload.user && typeof payload.user === 'object' && !Array.isArray(payload.user)
      ? (payload.user as Record<string, unknown>)
      : null;
  const candidates = [
    payload.sub,
    payload.userId,
    payload.accountId,
    payload.id,
    payload.uid,
    userRecord?.id,
  ];
  for (const candidate of candidates) {
    const uuid = toUuid(candidate);
    if (uuid) return uuid;
  }

  return null;
}

export async function PATCH(
  request: Request,
  context: { params: Promise<{ workspaceId: string; sprintId: string }> },
) {
  const cookieStore = await cookies();
  const token = cookieStore.get(ACCESS_TOKEN_COOKIE)?.value;
  const userId = cookieStore.get(USER_ID_COOKIE)?.value ?? null;
  if (!token) {
    return Response.json({ message: 'Unauthorized' }, { status: 401 });
  }

  const accountFromQuery = new URL(request.url).searchParams.get('account');
  const accountId = resolveAccountId({
    queryAccount: accountFromQuery,
    cookieUserId: userId,
    accessToken: token,
  });
  if (!accountId) {
    return Response.json({ message: 'User ID required for sprint update' }, { status: 400 });
  }

  const { workspaceId, sprintId } = await context.params;
  const body = await request.json().catch(() => ({}));
  const url = new URL(`${BACKEND_API_URL}/api/v1/workspaces/${workspaceId}/sprints/${sprintId}`);
  url.searchParams.set('account', accountId);

  const res = await fetch(url.toString(), {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(body),
    cache: 'no-store',
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    console.error('[API] PATCH /workspaces/:workspaceId/sprints/:sprintId failed', {
      workspaceId,
      sprintId,
      accountId,
      status: res.status,
      requestBody: body,
      responseBody: data,
    });
  }
  return Response.json(data, { status: res.status });
}

export async function DELETE(
  request: Request,
  context: { params: Promise<{ workspaceId: string; sprintId: string }> },
) {
  const cookieStore = await cookies();
  const token = cookieStore.get(ACCESS_TOKEN_COOKIE)?.value;
  const userId = cookieStore.get(USER_ID_COOKIE)?.value ?? null;
  if (!token) {
    return Response.json({ message: 'Unauthorized' }, { status: 401 });
  }

  const accountFromQuery = new URL(request.url).searchParams.get('account');
  const accountId = resolveAccountId({
    queryAccount: accountFromQuery,
    cookieUserId: userId,
    accessToken: token,
  });
  if (!accountId) {
    return Response.json({ message: 'User ID required for sprint delete' }, { status: 400 });
  }

  const { workspaceId, sprintId } = await context.params;
  const url = new URL(`${BACKEND_API_URL}/api/v1/workspaces/${workspaceId}/sprints/${sprintId}`);
  url.searchParams.set('account', accountId);

  const res = await fetch(url.toString(), {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    cache: 'no-store',
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    console.error('[API] DELETE /workspaces/:workspaceId/sprints/:sprintId failed', {
      workspaceId,
      sprintId,
      accountId,
      status: res.status,
      responseBody: data,
    });
  }
  return Response.json(data, { status: res.status });
}
