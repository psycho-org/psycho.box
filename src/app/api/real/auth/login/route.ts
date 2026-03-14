import { NextRequest } from 'next/server';
import { handleLogin } from '@/lib/server/http';

export async function POST(request: NextRequest) {
  return handleLogin(request);
}
