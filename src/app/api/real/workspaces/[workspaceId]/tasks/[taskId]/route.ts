import { cookies } from 'next/headers';
import { ACCESS_TOKEN_COOKIE, BACKEND_API_URL, USER_ID_COOKIE } from '@/lib/constants';

export async function PATCH(
  request: Request,
  context: { params: Promise<{ workspaceId: string; taskId: string }> },
) {
  const token = (await cookies()).get(ACCESS_TOKEN_COOKIE)?.value;
  const userId = (await cookies()).get(USER_ID_COOKIE)?.value;
  if (!token) {
    return Response.json({ message: 'Unauthorized' }, { status: 401 });
  }
  if (!userId) {
    return Response.json({ message: 'User ID required for task update' }, { status: 400 });
  }

  const { workspaceId, taskId } = await context.params;
  const body = await request.json().catch(() => ({}));

  const url = new URL(`${BACKEND_API_URL}/api/v1/workspaces/${workspaceId}/tasks/${taskId}`);
  url.searchParams.set('account', userId);

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
  return Response.json(data, { status: res.status });
}
