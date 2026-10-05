import 'server-only';

import { redirect } from 'next/navigation';
import { clearAuthCookie } from '@/lib/auth';
import type { GraphQLRequestError } from '@/lib/graphql';
import type { ActionState } from './types';

/**
 * Converte o erro da API em estado de formulário
 * Sessão inválida (UNAUTHENTICATED) apaga o cookie e redireciona para login
 * @param error - Erro devolvido por graphqlRequest
 * @returns Promise<ActionState> - Estado com a mensagem de erro
 */
export async function toActionError(error: GraphQLRequestError): Promise<ActionState> {
  if (error.code === 'UNAUTHENTICATED') {
    await clearAuthCookie();
    redirect('/login?error=session_expired');
  }

  if (error.code === 'NETWORK_ERROR') {
    return { error: 'Não foi possível conectar ao servidor. Tente novamente.' };
  }

  // Demais erros já vêm com mensagem em português da API
  return { error: error.message };
}

/**
 * Lê um inteiro positivo do FormData
 * @returns number | null - Número ou null se ausente/inválido
 */
export function getIntField(formData: FormData, field: string): number | null {
  const value = Number(formData.get(field));
  return Number.isInteger(value) && value > 0 ? value : null;
}

/**
 * Monta a lista de membros (employeeId) a partir dos checkboxes "member" do formulário
 */
export function getMemberIds(formData: FormData): number[] {
  const ids = formData
    .getAll('member')
    .map(value => Number(value))
    .filter(employeeId => Number.isInteger(employeeId) && employeeId > 0);
  return Array.from(new Set(ids));
}

/**
 * Monta a lista de responsáveis a partir do formulário
 * Espera checkboxes "responsible" (employeeId) e selects "level-<employeeId>" (1 a 3)
 */
export function getResponsibles(formData: FormData) {
  return formData
    .getAll('responsible')
    .map(value => Number(value))
    .filter(employeeId => Number.isInteger(employeeId) && employeeId > 0)
    .map(employeeId => {
      const level = Number(formData.get(`level-${employeeId}`));
      return {
        employeeId,
        leadershipLevel: level >= 1 && level <= 3 ? Math.trunc(level) : 3,
      };
    });
}
