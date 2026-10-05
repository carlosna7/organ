import { NextRequest, NextResponse } from 'next/server';
import { validateToken, PROTECTED_ROUTES, AUTH_ROUTES, AUTH_COOKIE_CONFIG } from '@/lib/auth';

export async function middleware(request: NextRequest) {
  const url = request.nextUrl.clone();
  const pathname = url.pathname;

  const isProtectedRoute = PROTECTED_ROUTES.some(
    route => pathname === route || pathname.startsWith(`${route}/`)
  );
  const isAuthRoute = AUTH_ROUTES.some(route => pathname === route);

  // Rotas públicas não precisam de verificação
  if (!isProtectedRoute && !isAuthRoute) {
    return NextResponse.next();
  }

  const token = request.cookies.get(AUTH_COOKIE_CONFIG.name)?.value;

  // Verifica assinatura e expiração do JWT
  const isValidToken = token ? await validateToken(token) : false;

  // Verificar se o usuário está tentando acessar uma rota protegida
  if (isProtectedRoute && !isValidToken) {
    // Sem token ou token inválido/expirado: remove cookie e redireciona para login
    // (token inválido/expirado avisa que a sessão expirou)
    url.pathname = '/login';
    url.search = token ? '?error=session_expired' : '';
    const response = NextResponse.redirect(url);
    if (token) response.cookies.delete(AUTH_COOKIE_CONFIG.name);
    return response;
  }

  if (isAuthRoute) {
    // Se o usuário está autenticado e tenta acessar login/register, redirecionar para dashboard
    if (isValidToken) {
      url.pathname = '/dashboard';
      url.search = '';
      return NextResponse.redirect(url);
    }

    // Token inválido em rota de autenticação: apenas limpa o cookie
    if (token) {
      const response = NextResponse.next();
      response.cookies.delete(AUTH_COOKIE_CONFIG.name);
      return response;
    }
  }

  return NextResponse.next();
}

// Configurar quais rotas o middleware deve processar
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};
