'use server';

import { revalidatePath } from 'next/cache';
import { graphqlRequest } from '@/lib/graphql';
import { isValidEmail } from '@/lib/auth';
import { getIntField, toActionError } from './helpers';
import type { ActionState } from './types';

const NEW_EMPLOYEE_MUTATION = `
  mutation NewEmployee($email: String!) {
    newEmployee(email: $email) {
      _id
      employeeId
      email
    }
  }
`;

const REMOVE_EMPLOYEE_MUTATION = `
  mutation RemoveEmployee($employeeId: Int!) {
    removeEmployee(employeeId: $employeeId)
  }
`;

/**
 * Convida um funcionário por email (só líder)
 */
export async function inviteEmployeeAction(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const email = String(formData.get('email') ?? '').trim().toLowerCase();

  // Verifica o email antes de chamar a API
  if (!email) return { error: 'Informe o email do convidado.' };
  if (!isValidEmail(email)) return { error: 'Email inválido.' };

  const { error } = await graphqlRequest(NEW_EMPLOYEE_MUTATION, { email });
  if (error) return toActionError(error);

  revalidatePath('/dashboard');
  return { ok: true };
}

/**
 * Remove um funcionário ou convite pendente (só líder)
 */
export async function removeEmployeeAction(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const employeeId = getIntField(formData, 'employeeId');
  if (!employeeId) return { error: 'Funcionário inválido.' };

  const { error } = await graphqlRequest(REMOVE_EMPLOYEE_MUTATION, { employeeId });
  if (error) return toActionError(error);

  revalidatePath('/dashboard');
  return { ok: true };
}
