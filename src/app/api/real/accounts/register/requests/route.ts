import { NextRequest } from 'next/server';
import { BACKEND_API_URL } from '@/lib/constants';

export async function POST(request: NextRequest) {
  const body = await request.text();
  const parsed = (body ? JSON.parse(body) : {}) as { email?: string };

  console.log('[OTP Request] 요청:', { email: parsed.email });

  const res = await fetch(`${BACKEND_API_URL}/api/v1/accounts/register/requests`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body,
    cache: 'no-store',
  });

  const data = await res.json().catch(() => ({}));

  console.log('[OTP Request] 백엔드 응답:', {
    status: res.status,
    ok: res.ok,
    data,
    challengeId: (data as { data?: { challengeId?: string } })?.data?.challengeId,
    expiresAt: (data as { data?: { expiresAt?: string } })?.data?.expiresAt,
  });

  return Response.json(data, { status: res.status });
}
