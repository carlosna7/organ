import { validateToken } from './tokens';
import { AUTH_COOKIE_CONFIG } from './config';

/**
 * Verifica se o usuário está autenticado baseado nos cookies
 * @returns Promise<boolean> - true se autenticado, false caso contrário
 */
export async function isAuthenticated(): Promise<boolean> {
  const { cookies } = await import('next/headers');
  const cookieStore = cookies();
  const token = cookieStore.get(AUTH_COOKIE_CONFIG.name)?.value;
  
  if (!token) return false;
  
  return validateToken(token);
}

/**
 * Obtém dados do usuário autenticado ou redireciona para login
 * @returns Promise<{ authenticated: boolean }> - Dados básicos do usuário
 */
export async function getUserData() {
  const authenticated = await isAuthenticated();
  
  if (!authenticated) {
    const { redirect } = await import('next/navigation');
    redirect('/login');
  }
  
  return { authenticated: true };
}

/**
 * Obtém o token atual do usuário (se existir)
 * @returns Promise<string | null> - Token ou null se não autenticado
 */
export async function getCurrentToken(): Promise<string | null> {
  const { cookies } = await import('next/headers');
  const cookieStore = cookies();
  return cookieStore.get(AUTH_COOKIE_CONFIG.name)?.value || null;
}