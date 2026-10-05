'use server';

import { redirect } from 'next/navigation';
import { clearAuthCookie } from '@/lib/auth';

/**
 * Server Action para logout
 * Remove o cookie de autenticação e redireciona para login
 */
export async function logoutAction() {
  // Remover o cookie de autenticação
  await clearAuthCookie();

  // Redirecionar para a página de login
  redirect('/login');
}
