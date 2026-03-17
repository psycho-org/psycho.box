import { cookies } from 'next/headers';
import { ACCESS_TOKEN_COOKIE, BACKEND_API_URL } from '@/lib/constants';

export async function PATCH(
  request: Request,
  context: {
    params: Promise<{ workspaceId: string; projectId: string; taskId: string }>;
  },
) {
  const token = (await cookies()).get(ACCESS_TOKEN_COOKIE)?.value;
  if (!token) {
    return Response.json({ message: 'Unauthorized' }, { status: 401 });
  }

  const { workspaceId, projectId, taskId } = await context.params;
  const body = await request.json().catch(() => ({}));

  const res = await fetch(
    `${BACKEND_API_URL}/api/v1/workspaces/${workspaceId}/projects/${projectId}/tasks/${taskId}/move`,
    {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(body),
      cache: 'no-store',
    },
  );

  const data = await res.json().catch(() => ({}));
  return Response.json(data, { status: res.status });
}
