import { cookies } from 'next/headers';
import { ACCESS_TOKEN_COOKIE, BACKEND_API_URL } from '@/lib/constants';

/** GET - 분석 요청 리포트 조회. 백엔드 경로: /api/v1/analysis-requests/{analysisRequestId}/report */
export async function GET(
  _request: Request,
  context: { params: Promise<{ analysisRequestId: string }> },
) {
  const token = (await cookies()).get(ACCESS_TOKEN_COOKIE)?.value;
  if (!token) {
    return Response.json({ message: 'Unauthorized' }, { status: 401 });
  }

  const { analysisRequestId } = await context.params;

  const res = await fetch(`${BACKEND_API_URL}/api/v1/analysis-requests/${analysisRequestId}/report`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
    cache: 'no-store',
  });

  const data = await res.json().catch(() => ({}));
  return Response.json(data, { status: res.status });
}
