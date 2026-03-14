import { NextRequest } from 'next/server';
import { handleLogout } from '@/lib/server/http';

export async function POST(_request: NextRequest) {
  return handleLogout();
}
