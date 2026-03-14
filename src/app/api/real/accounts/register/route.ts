import { NextRequest } from 'next/server';
import { BACKEND_API_URL } from '@/lib/constants';

export async function POST(request: NextRequest) {
  const body = await request.text();
  const parsed = (body ? JSON.parse(body) : {}) as {
    confirmationTokenId?: string;
    password?: string;
    givenName?: string;
    familyName?: string;
  };

  console.log('[Register] 요청:', {
    confirmationTokenId: parsed.confirmationTokenId,
    givenName: parsed.givenName,
    familyName: parsed.familyName,
    password: parsed.password ? '[REDACTED]' : undefined,
  });

  const res = await fetch(`${BACKEND_API_URL}/api/v1/accounts/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body,
    cache: 'no-store',
  });

  const data = await res.json().catch(() => ({}));

  console.log('[Register] 백엔드 응답:', {
    status: res.status,
    ok: res.ok,
    data,
  });

  return Response.json(data, { status: res.status });
}
