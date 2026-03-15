import { BACKEND_API_URL } from '@/lib/constants';

export async function GET() {
  const res = await fetch(`${BACKEND_API_URL}/api/v1/accounts/policies/password`, {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
    cache: 'no-store',
  });

  const data = await res.json().catch(() => ({}));
  return Response.json(data, { status: res.status });
}
