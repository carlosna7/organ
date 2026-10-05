import { verifyToken } from './tokens';
import { AUTH_COOKIE_CONFIG } from './config';

/**
 * Dados do usuário autenticado (vindos do JWT verificado)
 */
export type AuthUser = {
  id: string;
  companyId: string;
  employeeId: number;
  role: 'leader' | 'member';
  name: string;
  email: string;
};

/**
 * Tamanho mínimo de senha aceito pela API
 */
export const MIN_PASSWORD_LENGTH = 6;

/**
 * Verifica se o email tem um formato válido
 * @param email - Email a ser verificado
 * @returns boolean - true se o formato for válido
 */
export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
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

/**
 * Verifica se o usuário está autenticado baseado nos cookies
 * @returns Promise<boolean> - true se autenticado, false caso contrário
 */
export async function isAuthenticated(): Promise<boolean> {
  const token = await getCurrentToken();
  if (!token) return false;

  return (await verifyToken(token)) !== null;
}

/**
 * Obtém dados do usuário autenticado ou redireciona para login
 * @returns Promise<AuthUser> - Dados do usuário presentes no JWT
 */
export async function getUserData(): Promise<AuthUser> {
  const token = await getCurrentToken();
  const payload = token ? await verifyToken(token) : null;

  if (!payload) {
    const { redirect } = await import('next/navigation');
    return redirect('/login');
  }

  return {
    id: payload.sub,
    companyId: payload.company,
    employeeId: payload.employeeId,
    role: payload.role,
    name: payload.name,
    email: payload.email,
  };
}

/**
 * Grava o JWT no cookie httpOnly de autenticação
 * Só pode ser chamado em Server Actions ou Route Handlers
 * @param token - JWT devolvido pela API
 */
export async function setAuthCookie(token: string): Promise<void> {
  const { cookies } = await import('next/headers');
  cookies().set(AUTH_COOKIE_CONFIG.name, token, {
    httpOnly: AUTH_COOKIE_CONFIG.httpOnly,
    secure: AUTH_COOKIE_CONFIG.secure,
    sameSite: AUTH_COOKIE_CONFIG.sameSite,
    maxAge: AUTH_COOKIE_CONFIG.maxAge,
    path: AUTH_COOKIE_CONFIG.path,
  });
}

/**
 * Remove o cookie de autenticação
 * Só pode ser chamado em Server Actions ou Route Handlers
 */
export async function clearAuthCookie(): Promise<void> {
  const { cookies } = await import('next/headers');
  cookies().delete(AUTH_COOKIE_CONFIG.name);
}
