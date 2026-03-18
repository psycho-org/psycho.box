import { cookies } from 'next/headers';
import { NextRequest } from 'next/server';
import { ACCESS_TOKEN_COOKIE, BACKEND_API_URL } from '@/lib/constants';

/** POST - 분석 요청 생성. 백엔드 경로: /api/v1/workspace/{workspaceId}/analysis-requests */
export async function POST(
  request: NextRequest,
  context: { params: Promise<{ workspaceId: string }> },
) {
  const token = (await cookies()).get(ACCESS_TOKEN_COOKIE)?.value;
  if (!token) {
    return Response.json({ message: 'Unauthorized' }, { status: 401 });
  }

  const { workspaceId } = await context.params;
  const body = await request.json().catch(() => ({}));
  const sprintId = body?.sprintId;

  const res = await fetch(`${BACKEND_API_URL}/api/v1/workspace/${workspaceId}/analysis-requests`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      sprintId,
    }),
    cache: 'no-store',
  });

  const data = await res.json().catch(() => ({}));
  return Response.json(data, { status: res.status });
}
