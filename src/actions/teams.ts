'use server';

import { revalidatePath } from 'next/cache';
import { graphqlRequest } from '@/lib/graphql';
import { getIntField, getMemberIds, toActionError } from './helpers';
import type { ActionState } from './types';

const CREATE_TEAM_MUTATION = `
  mutation CreateTeam($team: TeamInput!) {
    createTeam(team: $team) {
      _id
      teamId
    }
  }
`;

const UPDATE_TEAM_MUTATION = `
  mutation UpdateTeam($teamId: Int!, $team: TeamUpdateInput!) {
    updateTeam(teamId: $teamId, team: $team) {
      _id
      teamId
    }
  }
`;

const DELETE_TEAM_MUTATION = `
  mutation DeleteTeam($teamId: Int!) {
    deleteTeam(teamId: $teamId)
  }
`;

/**
 * Cria uma equipe com nome, descrição opcional e membros (só líder)
 */
export async function createTeamAction(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const name = String(formData.get('name') ?? '').trim();
  const description = String(formData.get('description') ?? '').trim();
  const memberIds = getMemberIds(formData);

  if (!name) return { error: 'Informe o nome da equipe.' };

  const { error } = await graphqlRequest(CREATE_TEAM_MUTATION, {
    team: { name, description: description || null, memberIds },
  });
  if (error) return toActionError(error);

  revalidatePath('/dashboard');
  return { ok: true };
}

/**
 * Edita nome, descrição e membros de uma equipe (só líder)
 */
export async function updateTeamAction(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const teamId = getIntField(formData, 'teamId');
  const name = String(formData.get('name') ?? '').trim();
  const description = String(formData.get('description') ?? '').trim();
  const memberIds = getMemberIds(formData);

  if (!teamId) return { error: 'Equipe inválida.' };
  if (!name) return { error: 'Informe o nome da equipe.' };

  const { error } = await graphqlRequest(UPDATE_TEAM_MUTATION, {
    teamId,
    team: { name, description, memberIds },
  });
  if (error) return toActionError(error);

  revalidatePath('/dashboard');
  return { ok: true };
}

/**
 * Exclui uma equipe (só líder); os projetos dela ficam sem equipe
 */
export async function deleteTeamAction(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const teamId = getIntField(formData, 'teamId');
  if (!teamId) return { error: 'Equipe inválida.' };

  const { error } = await graphqlRequest(DELETE_TEAM_MUTATION, { teamId });
  if (error) return toActionError(error);

  revalidatePath('/dashboard');
  return { ok: true };
}
