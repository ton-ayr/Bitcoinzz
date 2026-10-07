import type { NextRequest } from 'next/server';
import { errorResponse, isSameOrigin } from '@/server/bff';
import { clearSessionCookie } from '@/server/session';

export async function POST(request: NextRequest) {
  if (!isSameOrigin(request)) return errorResponse(403, 'Origem não permitida.');
  await clearSessionCookie();
  return new Response(null, { status: 204 });
}
