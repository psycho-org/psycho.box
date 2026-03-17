import { cookies } from 'next/headers';
import { ACCESS_TOKEN_COOKIE, BACKEND_API_URL } from '@/lib/constants';

export async function GET(
  request: Request,
  context: { params: Promise<{ workspaceId: string; projectId: string }> },
) {
  const token = (await cookies()).get(ACCESS_TOKEN_COOKIE)?.value;
  if (!token) {
    return Response.json({ message: 'Unauthorized' }, { status: 401 });
  }

  const { workspaceId, projectId } = await context.params;
  const requestUrl = new URL(request.url);
  const url = new URL(`${BACKEND_API_URL}/api/v1/workspaces/${workspaceId}/projects/${projectId}/tasks`);

  requestUrl.searchParams.forEach((value, key) => {
    url.searchParams.set(key, value);
  });

  const res = await fetch(url, {
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
