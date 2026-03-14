import { cookies } from 'next/headers';
import { ACCESS_TOKEN_COOKIE, BACKEND_API_URL } from '@/lib/constants';

export async function GET() {
  const token = (await cookies()).get(ACCESS_TOKEN_COOKIE)?.value;
  if (!token) {
    return Response.json({ message: 'Unauthorized' }, { status: 401 });
  }

  const res = await fetch(`${BACKEND_API_URL}/api/v1/workspaces`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    cache: 'no-store',
  });

  const data = await res.json().catch(() => ({}));
  console.log('[API] GET /workspaces', { status: res.status, data });
  return Response.json(data, { status: res.status });
}

export async function POST(request: Request) {
  const token = (await cookies()).get(ACCESS_TOKEN_COOKIE)?.value;
  if (!token) {
    return Response.json({ message: 'Unauthorized' }, { status: 401 });
  }

  let body: { name?: string; description?: string };
  try {
    body = await request.json();
  } catch {
    return Response.json({ message: 'Invalid JSON body' }, { status: 400 });
  }

  const name = body?.name;
  if (typeof name !== 'string' || !name.trim()) {
    return Response.json({ message: 'name is required' }, { status: 400 });
  }

  const res = await fetch(`${BACKEND_API_URL}/api/v1/workspaces`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      name: name.trim(),
      description: typeof body?.description === 'string' ? body.description.trim() : '',
    }),
  });

  const data = await res.json().catch(() => ({}));
  console.log('[API] POST /workspaces', { status: res.status, data });
  return Response.json(data, { status: res.status });
}
