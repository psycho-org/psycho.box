import { NextRequest } from 'next/server';
import { BACKEND_API_URL } from '@/lib/constants';

export async function POST(request: NextRequest) {
  const body = await request.text();
  const parsed = (body ? JSON.parse(body) : {}) as { challengeId?: string; otpCode?: string };

  console.log('[OTP Confirmation] 요청:', {
    challengeId: parsed.challengeId,
    otpCode: parsed.otpCode ? '[REDACTED]' : undefined,
  });

  const res = await fetch(`${BACKEND_API_URL}/api/v1/accounts/register/confirmations`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body,
    cache: 'no-store',
  });

  const data = await res.json().catch(() => ({}));

  const raw = data as { data?: { confirmationTokenId?: string; verifiedEmail?: string } };
  console.log('[OTP Confirmation] 백엔드 응답:', {
    status: res.status,
    ok: res.ok,
    data,
    confirmationTokenId: raw?.data?.confirmationTokenId,
    verifiedEmail: raw?.data?.verifiedEmail,
  });

  return Response.json(data, { status: res.status });
}
