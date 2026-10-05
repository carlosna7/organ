'use server';

import { revalidatePath } from 'next/cache';
import { graphqlRequest } from '@/lib/graphql';
import { isTaskStatus } from '@/lib/types';
import { getIntField, getResponsibles, toActionError } from './helpers';
import type { ActionState } from './types';

const CREATE_TASK_MUTATION = `
  mutation CreateTask($task: TaskInput!) {
    createTask(task: $task) {
      _id
      taskId
    }
  }
`;

const UPDATE_TASK_MUTATION = `
  mutation UpdateTask($taskId: Int!, $task: TaskUpdateInput!) {
    updateTask(taskId: $taskId, task: $task) {
      _id
      taskId
    }
  }
`;

const UPDATE_TASK_STATUS_MUTATION = `
  mutation UpdateTaskStatus($taskId: Int!, $status: TaskStatus!) {
    updateTaskStatus(taskId: $taskId, status: $status) {
      _id
      taskId
      status
    }
  }
`;

const DELETE_TASK_MUTATION = `
  mutation DeleteTask($taskId: Int!) {
    deleteTask(taskId: $taskId)
  }
`;

/**
 * Cria uma tarefa (qualquer membro)
 * Sem responsáveis selecionados, a API coloca o criador com nível 3
 */
export async function createTaskAction(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const taskName = String(formData.get('taskName') ?? '').trim();
  const description = String(formData.get('description') ?? '').trim();
  const responsibles = getResponsibles(formData);

  if (!taskName) return { error: 'Informe o nome da tarefa.' };

  const task = {
    taskName,
    description: description || null,
    ...(responsibles.length > 0 && { responsibles }),
  };

  const { error } = await graphqlRequest(CREATE_TASK_MUTATION, { task });
  if (error) return toActionError(error);

  revalidatePath('/dashboard');
  return { ok: true };
}

/**
 * Edita nome, descrição e responsáveis de uma tarefa (só líder)
 */
export async function updateTaskAction(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const taskId = getIntField(formData, 'taskId');
  const taskName = String(formData.get('taskName') ?? '').trim();
  const description = String(formData.get('description') ?? '').trim();
  const responsibles = getResponsibles(formData);

  if (!taskId) return { error: 'Tarefa inválida.' };
  if (!taskName) return { error: 'Informe o nome da tarefa.' };
  if (responsibles.length === 0) return { error: 'Selecione ao menos um responsável.' };

  const { error } = await graphqlRequest(UPDATE_TASK_MUTATION, {
    taskId,
    task: { taskName, description, responsibles },
  });
  if (error) return toActionError(error);

  revalidatePath('/dashboard');
  return { ok: true };
}

/**
 * Muda o status de uma tarefa (líder ou responsável)
 */
export async function updateTaskStatusAction(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const taskId = getIntField(formData, 'taskId');
  const status = formData.get('status');

  if (!taskId) return { error: 'Tarefa inválida.' };
  if (!isTaskStatus(status)) return { error: 'Status inválido.' };

  const { error } = await graphqlRequest(UPDATE_TASK_STATUS_MUTATION, { taskId, status });
  if (error) return toActionError(error);

  revalidatePath('/dashboard');
  return { ok: true };
}

/**
 * Exclui uma tarefa (só líder)
 */
export async function deleteTaskAction(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const taskId = getIntField(formData, 'taskId');
  if (!taskId) return { error: 'Tarefa inválida.' };

  const { error } = await graphqlRequest(DELETE_TASK_MUTATION, { taskId });
  if (error) return toActionError(error);

  revalidatePath('/dashboard');
  return { ok: true };
}
