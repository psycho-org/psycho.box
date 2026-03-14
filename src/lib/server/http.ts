import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';
import {
  ACCESS_TOKEN_COOKIE,
  BACKEND_API_URL,
  BACKEND_REFRESH_COOKIE_NAME,
  REFRESH_TOKEN_COOKIE,
  USER_ID_COOKIE,
} from '@/lib/constants';

const isSecureCookie = process.env.NODE_ENV === 'production';

type JsonLike = Record<string, unknown> | unknown[] | string | number | boolean | null;

function readJsonSafely(payload: string): JsonLike {
  try {
    return JSON.parse(payload) as JsonLike;
  } catch {
    return payload;
  }
}

function extractRefreshToken(setCookieHeader: string | null): string | null {
  if (!setCookieHeader) return null;
  const match = setCookieHeader.match(new RegExp(`${BACKEND_REFRESH_COOKIE_NAME}=([^;]+)`));
  return match?.[1] ?? null;
}

async function relayJsonResponse(backendResponse: Response): Promise<NextResponse> {
  const raw = await backendResponse.text();
  const data = readJsonSafely(raw);
  return NextResponse.json(data, { status: backendResponse.status });
}

async function relayWithPayload(
  backendResponse: Response,
): Promise<{ response: NextResponse; payload: JsonLike }> {
  const raw = await backendResponse.text();
  const payload = readJsonSafely(raw);
  return {
    response: NextResponse.json(payload, { status: backendResponse.status }),
    payload,
  };
}

function parseAuthData(payload: JsonLike): { accessToken?: string; userId?: string } {
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) return {};

  const wrapped = payload as Record<string, unknown>;
  const data = wrapped.data;
  if (!data || typeof data !== 'object' || Array.isArray(data)) return {};

  const dataRecord = data as Record<string, unknown>;
  const accessToken = typeof dataRecord.accessToken === 'string' ? dataRecord.accessToken : undefined;

  let userId: string | undefined;
  const user = dataRecord.user;
  if (user && typeof user === 'object' && !Array.isArray(user)) {
    const userRecord = user as Record<string, unknown>;
    userId = typeof userRecord.id === 'string' ? userRecord.id : undefined;
  }

  return { accessToken, userId };
}

export async function handleLogin(request: NextRequest): Promise<NextResponse> {
  const body = await request.text();
  const backendResponse = await fetch(`${BACKEND_API_URL}/api/v1/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body,
    cache: 'no-store',
  });

  const { response, payload } = await relayWithPayload(backendResponse);
  console.log('[API] POST /auth/login', { status: backendResponse.status, payload });
  if (!backendResponse.ok) return response;

  const { accessToken, userId } = parseAuthData(payload);
  const refreshToken = extractRefreshToken(backendResponse.headers.get('set-cookie'));

  if (accessToken) {
    response.cookies.set(ACCESS_TOKEN_COOKIE, accessToken, {
      httpOnly: true,
      sameSite: 'lax',
      secure: isSecureCookie,
      path: '/',
    });
  }

  if (refreshToken) {
    response.cookies.set(REFRESH_TOKEN_COOKIE, refreshToken, {
      httpOnly: true,
      sameSite: 'lax',
      secure: isSecureCookie,
      path: '/',
    });
  }

  if (userId) {
    response.cookies.set(USER_ID_COOKIE, userId, {
      httpOnly: false,
      sameSite: 'lax',
      secure: isSecureCookie,
      path: '/',
    });
  }

  return response;
}

export async function handleLogout(): Promise<NextResponse> {
  const refreshToken = (await cookies()).get(REFRESH_TOKEN_COOKIE)?.value;

  const backendResponse = await fetch(`${BACKEND_API_URL}/api/v1/auth/logout`, {
    method: 'POST',
    headers: refreshToken
      ? { Cookie: `${BACKEND_REFRESH_COOKIE_NAME}=${refreshToken}` }
      : undefined,
    cache: 'no-store',
  });

  const { response, payload } = await relayWithPayload(backendResponse);
  console.log('[API] POST /auth/logout', { status: backendResponse.status, payload });
  response.cookies.delete(ACCESS_TOKEN_COOKIE);
  response.cookies.delete(REFRESH_TOKEN_COOKIE);
  response.cookies.delete(USER_ID_COOKIE);

  return response;
}
