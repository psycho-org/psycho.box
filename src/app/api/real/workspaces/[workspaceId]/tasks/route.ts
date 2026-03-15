import { cookies } from 'next/headers';
import { ACCESS_TOKEN_COOKIE, BACKEND_API_URL } from '@/lib/constants';

export async function GET(
  request: Request,
  context: { params: Promise<{ workspaceId: string }> },
) {
  const token = (await cookies()).get(ACCESS_TOKEN_COOKIE)?.value;
  if (!token) {
    return Response.json({ message: 'Unauthorized' }, { status: 401 });
  }

  const { workspaceId } = await context.params;
  const { searchParams } = new URL(request.url);
  const page = searchParams.get('page') ?? '1';
  const size = searchParams.get('size') ?? '50';

  const url = new URL(`${BACKEND_API_URL}/api/v1/workspaces/${workspaceId}/tasks`);
  url.searchParams.set('page', page);
  url.searchParams.set('size', size);

  const res = await fetch(url.toString(), {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    cache: 'no-store',
  });

  const data = await res.json().catch(() => ({}));
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

  const res = await fetch(`${BACKEND_API_URL}/api/v1/workspaces/${workspaceId}/tasks`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(body),
    cache: 'no-store',
  });

  const data = await res.json().catch(() => ({}));
  return Response.json(data, { status: res.status });
}
