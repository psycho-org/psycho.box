import { NextRequest } from 'next/server';
import { handleGetMe } from '@/lib/server/http';

export async function GET(_request: NextRequest) {
  return handleGetMe();
}
