import { cookies } from 'next/headers';
import { NextRequest } from 'next/server';
import { ACCESS_TOKEN_COOKIE, BACKEND_API_URL } from '@/lib/constants';

/** POST - 분석 요청 생성. 백엔드 경로: /api/v1/{workspaceId}/analysis/request (workspaces 세그먼트 없음) */
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

  const res = await fetch(`${BACKEND_API_URL}/api/v1/${workspaceId}/analysis/request`, {
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
