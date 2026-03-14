import { NextRequest } from 'next/server';
import { cookies } from 'next/headers';
import { ACCESS_TOKEN_COOKIE, BACKEND_API_URL } from '@/lib/constants';

export async function POST(request: NextRequest) {
  const token = (await cookies()).get(ACCESS_TOKEN_COOKIE)?.value;
  if (!token) {
    return Response.json({ message: 'Unauthorized' }, { status: 401 });
  }

  let body: { to?: string; workspaceName?: string; inviterName?: string; inviteLink?: string; workspaceId?: string };
  try {
    body = await request.json();
  } catch {
    return Response.json({ message: 'Invalid JSON body' }, { status: 400 });
  }

  const to = body?.to?.trim();
  const workspaceName = body?.workspaceName?.trim();
  const workspaceId = body?.workspaceId;

  if (!to) {
    return Response.json({ message: 'to (email) is required' }, { status: 400 });
  }
  if (!workspaceName) {
    return Response.json({ message: 'workspaceName is required' }, { status: 400 });
  }
  if (!workspaceId) {
    return Response.json({ message: 'workspaceId is required' }, { status: 400 });
  }

  const res = await fetch(`${BACKEND_API_URL}/api/v1/mails/send/workspaceinvite`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      to,
      workspaceName,
      inviterName: body?.inviterName?.trim() || null,
      inviteLink: body?.inviteLink?.trim() || null,
      workspaceId,
    }),
    cache: 'no-store',
  });

  const data = await res.json().catch(() => ({}));
  return Response.json(data, { status: res.status });
}
