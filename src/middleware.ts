import { NextRequest, NextResponse } from 'next/server';
import { validateToken, PROTECTED_ROUTES, AUTH_ROUTES, AUTH_COOKIE_CONFIG } from '@/lib/auth';

export function middleware(request: NextRequest) {
  const url = request.nextUrl.clone();
  const pathname = url.pathname;
  
  const token = request.cookies.get(AUTH_COOKIE_CONFIG.name)?.value;
  
  // Verificar se o usuário está tentando acessar uma rota protegida
  if (PROTECTED_ROUTES.some(route => pathname.startsWith(route))) {
    if (!token) {
      // Redirecionar para login se não houver token
      url.pathname = '/login';
      return NextResponse.redirect(url);
    }
    
    // Verificar se o token não expirou
    const isValidToken = validateToken(token);
    if (!isValidToken) {
      // Token expirado, remover cookie e redirecionar para login
      const response = NextResponse.redirect(new URL('/login', request.url));
      response.cookies.delete(AUTH_COOKIE_CONFIG.name);
      return response;
    }
  }
  
  // Se o usuário está autenticado e tenta acessar login/register, redirecionar para dashboard
  if (AUTH_ROUTES.includes(pathname as any) && token && validateToken(token)) {
    url.pathname = '/dashboard';
    // Direcionar para Home
    return NextResponse.redirect(url);
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