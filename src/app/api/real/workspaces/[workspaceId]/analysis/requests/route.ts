import { cookies } from 'next/headers';
import { NextRequest } from 'next/server';
import { ACCESS_TOKEN_COOKIE, BACKEND_API_URL } from '@/lib/constants';

/** GET - 분석 요청 목록 조회. 백엔드 경로: /api/v1/analysis-requests */
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ workspaceId: string }> },
) {
  const token = (await cookies()).get(ACCESS_TOKEN_COOKIE)?.value;
  if (!token) {
    return Response.json({ message: 'Unauthorized' }, { status: 401 });
  }

  const { workspaceId } = await context.params;
  const sprintId = request.nextUrl.searchParams.get('sprintId');

  if (!sprintId) {
    return Response.json({ message: 'sprintId is required' }, { status: 400 });
  }

  const url = new URL(`${BACKEND_API_URL}/api/v1/analysis-requests`);
  url.searchParams.set('workspaceId', workspaceId);
  url.searchParams.set('sprintId', sprintId);

  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
    cache: 'no-store',
  });

  const data = await res.json().catch(() => ({}));
  return Response.json(data, { status: res.status });
}
