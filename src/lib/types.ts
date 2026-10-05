// Tipos do contrato da API GraphQL

export type Role = 'leader' | 'member';

export type TaskStatus = 'pendente' | 'em_andamento' | 'concluida';

export type Company = {
  _id: string;
  companyId: string;
  name: string;
  createdAt: string;
};

export type Employee = {
  _id: string;
  employeeId: number;
  name: string | null;
  position: string | null;
  email: string;
  role: Role;
  isRegistered: boolean;
};

export type Responsibility = {
  leadershipLevel: number;
  employee: Employee | null;
};

export type Task = {
  _id: string;
  taskId: number;
  taskName: string;
  description: string | null;
  status: TaskStatus;
  responsibles: Responsibility[];
  createdAt: string;
  completedAt: string | null;
};

export type AuthPayload = {
  token: string;
  employee: Employee;
};

export const TASK_STATUSES: TaskStatus[] = ['pendente', 'em_andamento', 'concluida'];

export const TASK_STATUS_LABELS: Record<TaskStatus, string> = {
  pendente: 'Pendente',
  em_andamento: 'Em andamento',
  concluida: 'Concluída',
};

export const ROLE_LABELS: Record<Role, string> = {
  leader: 'Líder',
  member: 'Membro',
};

// 3 = responsável principal, 2 = apoio, 1 = acompanha
export const LEADERSHIP_LEVEL_LABELS: Record<number, string> = {
  3: 'Principal',
  2: 'Apoio',
  1: 'Acompanha',
};

/**
 * Verifica se o valor é um status de tarefa válido
 */
export function isTaskStatus(value: unknown): value is TaskStatus {
  return typeof value === 'string' && (TASK_STATUSES as string[]).includes(value);
}
