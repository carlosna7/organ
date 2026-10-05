'use server';

import { revalidatePath } from 'next/cache';
import { graphqlRequest } from '@/lib/graphql';
import { getIntField, toActionError } from './helpers';
import type { ActionState } from './types';

const CREATE_PROJECT_MUTATION = `
  mutation CreateProject($project: ProjectInput!) {
    createProject(project: $project) {
      _id
      projectId
    }
  }
`;

const UPDATE_PROJECT_MUTATION = `
  mutation UpdateProject($projectId: Int!, $project: ProjectUpdateInput!) {
    updateProject(projectId: $projectId, project: $project) {
      _id
      projectId
    }
  }
`;

const DELETE_PROJECT_MUTATION = `
  mutation DeleteProject($projectId: Int!) {
    deleteProject(projectId: $projectId)
  }
`;

/**
 * Cria um projeto com nome, descrição e equipe opcionais (só líder)
 */
export async function createProjectAction(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const name = String(formData.get('name') ?? '').trim();
  const description = String(formData.get('description') ?? '').trim();
  const teamId = getIntField(formData, 'teamId');

  if (!name) return { error: 'Informe o nome do projeto.' };

  const { error } = await graphqlRequest(CREATE_PROJECT_MUTATION, {
    project: { name, description: description || null, teamId },
  });
  if (error) return toActionError(error);

  revalidatePath('/dashboard');
  return { ok: true };
}

/**
 * Edita nome, descrição e equipe de um projeto (só líder)
 */
export async function updateProjectAction(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const projectId = getIntField(formData, 'projectId');
  const name = String(formData.get('name') ?? '').trim();
  const description = String(formData.get('description') ?? '').trim();
  const teamId = getIntField(formData, 'teamId');

  if (!projectId) return { error: 'Projeto inválido.' };
  if (!name) return { error: 'Informe o nome do projeto.' };

  const { error } = await graphqlRequest(UPDATE_PROJECT_MUTATION, {
    projectId,
    project: { name, description, teamId },
  });
  if (error) return toActionError(error);

  revalidatePath('/dashboard');
  return { ok: true };
}

/**
 * Exclui um projeto (só líder); as tarefas dele ficam sem projeto
 */
export async function deleteProjectAction(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const projectId = getIntField(formData, 'projectId');
  if (!projectId) return { error: 'Projeto inválido.' };

  const { error } = await graphqlRequest(DELETE_PROJECT_MUTATION, { projectId });
  if (error) return toActionError(error);

  revalidatePath('/dashboard');
  return { ok: true };
}
