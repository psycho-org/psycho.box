import { NextRequest } from 'next/server';
import { cookies } from 'next/headers';
import { ACCESS_TOKEN_COOKIE, BACKEND_API_URL } from '@/lib/constants';

export async function GET(
  _request: Request,
  context: { params: Promise<{ workspaceId: string }> },
) {
  const token = (await cookies()).get(ACCESS_TOKEN_COOKIE)?.value;
  if (!token) {
    return Response.json({ message: 'Unauthorized' }, { status: 401 });
  }

  const { workspaceId } = await context.params;

  const res = await fetch(`${BACKEND_API_URL}/api/v1/workspaces/${workspaceId}/members`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    cache: 'no-store',
  });

  const data = await res.json().catch(() => ({}));
  console.log('[API] GET /workspaces/:id/members', { workspaceId, status: res.status, data });
  return Response.json(data, { status: res.status });
}

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ workspaceId: string }> },
) {
  const token = (await cookies()).get(ACCESS_TOKEN_COOKIE)?.value;
  if (!token) {
    return Response.json({ message: 'Unauthorized' }, { status: 401 });
  }

  const { workspaceId } = await context.params;
  const body = await request.json().catch(() => ({})) as { accountId?: string; role?: string };

  const accountId = body.accountId;
  if (!accountId) {
    return Response.json({ message: 'accountId is required' }, { status: 400 });
  }

  const res = await fetch(`${BACKEND_API_URL}/api/v1/workspaces/${workspaceId}/members`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      accountId,
      role: body.role === 'OWNER' ? 'OWNER' : 'CREW',
    }),
    cache: 'no-store',
  });

  const data = await res.json().catch(() => ({}));
  console.log('[API] POST /workspaces/:id/members', { workspaceId, status: res.status, data });
  return Response.json(data, { status: res.status });
}
