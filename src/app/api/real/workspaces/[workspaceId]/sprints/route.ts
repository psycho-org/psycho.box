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
  const url = `${BACKEND_API_URL}/api/v1/workspaces/${workspaceId}/sprints`;

  const res = await fetch(url, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    cache: 'no-store',
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    console.error('[API] GET /workspaces/:workspaceId/sprints failed', {
      workspaceId,
      status: res.status,
      data,
    });
  }
  return Response.json(data, { status: res.status });
}

export async function POST(
  request: Request,
  context: { params: Promise<{ workspaceId: string }> },
) {
  const token = (await cookies()).get(ACCESS_TOKEN_COOKIE)?.value;
  if (!token) {
    return Response.json({ message: 'Unauthorized' }, { status: 401 });
  }

  const { workspaceId } = await context.params;
  const body = await request.json().catch(() => ({}));

  const res = await fetch(`${BACKEND_API_URL}/api/v1/workspaces/${workspaceId}/sprints`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(body),
    cache: 'no-store',
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    console.error('[API] POST /workspaces/:workspaceId/sprints failed', {
      workspaceId,
      status: res.status,
      requestBody: body,
      data,
    });
  }
  return Response.json(data, { status: res.status });
}
