import { APP_TIME_ZONE } from '@/lib/auth/config';
import type { Task, TaskItem, TaskProgress, TaskStatus } from '@/lib/types';

/**
 * Formata datas ISO 8601 para o padrão brasileiro, no fuso configurado
 * @returns string | null - Data formatada ou null se ausente/inválida
 */
export function formatDate(value: string | null): string | null {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toLocaleDateString('pt-BR', { timeZone: APP_TIME_ZONE });
}

/**
 * Acrescenta às tarefas as datas já formatadas (o fuso vem do servidor, não do navegador)
 */
export function toTaskItems(tasks: Task[]): TaskItem[] {
  return tasks.map(task => ({
    ...task,
    createdLabel: formatDate(task.createdAt),
    completedLabel: formatDate(task.completedAt),
  }));
}

/**
 * Escolhe o singular ou o plural conforme a quantidade ("1 tarefa", "2 tarefas")
 */
export function plural(count: number, singular: string, pluralForm: string): string {
  return `${count} ${count === 1 ? singular : pluralForm}`;
}

/**
 * Conta as tarefas por status (total, concluídas e cada status)
 */
export function getTaskProgress(tasks: Pick<Task, 'status'>[]): TaskProgress {
  const byStatus: Record<TaskStatus, number> = { pendente: 0, em_andamento: 0, concluida: 0 };
  for (const task of tasks) byStatus[task.status] += 1;
  return { total: tasks.length, done: byStatus.concluida, byStatus };
}
