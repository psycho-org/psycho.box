import { NextRequest } from 'next/server';
import { handleRefresh } from '@/lib/server/http';

export async function POST(_request: NextRequest) {
  return handleRefresh();
}
