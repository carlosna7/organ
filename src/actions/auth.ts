'use server';

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { AUTH_COOKIE_CONFIG } from '@/lib/auth';

/**
 * Server Action para logout
 * Remove o cookie de autenticação e redireciona para login
 */
export async function logoutAction() {
  const cookieStore = cookies();
  
  // Remover o cookie de autenticação
  cookieStore.delete(AUTH_COOKIE_CONFIG.name);
  
  // Redirecionar para a página de login
  redirect('/login');
}