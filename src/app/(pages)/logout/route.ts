import { NextRequest, NextResponse } from 'next/server';
import { AUTH_COOKIE_CONFIG } from '@/lib/auth';

export const dynamic = 'force-dynamic';

/**
 * Encerra uma sessão que a API rejeitou (ex.: funcionário removido)
 * Server Components não podem apagar cookies, então redirecionam para cá
 */
export function GET(request: NextRequest) {
  const response = NextResponse.redirect(new URL('/login?error=session_expired', request.url));
  response.cookies.delete(AUTH_COOKIE_CONFIG.name);
  return response;
}
