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

export type Team = {
  _id: string;
  teamId: number;
  name: string;
  description: string | null;
  members: Employee[];
  createdAt: string;
};

export type Project = {
  _id: string;
  projectId: number;
  name: string;
  description: string | null;
  team: Pick<Team, 'teamId' | 'name'> | null;
  createdAt: string;
};

export type Task = {
  _id: string;
  taskId: number;
  taskName: string;
  description: string | null;
  status: TaskStatus;
  project: Pick<Project, 'projectId' | 'name'> | null;
  responsibles: Responsibility[];
  createdAt: string;
  completedAt: string | null;
};

// Contagem de tarefas por status (progresso de um projeto ou da empresa)
export type TaskProgress = {
  total: number;
  done: number;
  byStatus: Record<TaskStatus, number>;
};

export type ProjectItem = Project & { progress: TaskProgress };

// Tarefa com as datas já formatadas no servidor (fuso configurado), pronta para os componentes de cliente
export type TaskItem = Task & {
  createdLabel: string | null;
  completedLabel: string | null;
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

// Seções do painel (?view=) e formas de ver as tarefas (?layout=)
export const DASHBOARD_VIEWS = ['resumo', 'tarefas', 'projetos', 'equipes', 'membros'] as const;
export type DashboardView = (typeof DASHBOARD_VIEWS)[number];

export const DASHBOARD_VIEW_LABELS: Record<DashboardView, string> = {
  resumo: 'Resumo',
  tarefas: 'Tarefas',
  projetos: 'Projetos',
  equipes: 'Equipes',
  membros: 'Membros',
};

export const TASK_LAYOUTS = ['list', 'kanban', 'grid'] as const;
export type TaskLayout = (typeof TASK_LAYOUTS)[number];

export const TASK_LAYOUT_LABELS: Record<TaskLayout, string> = {
  list: 'Lista',
  kanban: 'Kanban',
  grid: 'Grade',
};

// Cookie que guarda a forma de ver as tarefas escolhida pelo usuário
export const TASK_LAYOUT_COOKIE = 'organ-task-layout';

/**
 * Verifica se o valor é uma seção do painel válida
 */
export function isDashboardView(value: unknown): value is DashboardView {
  return typeof value === 'string' && (DASHBOARD_VIEWS as readonly string[]).includes(value);
}

/**
 * Verifica se o valor é uma forma de ver as tarefas válida
 */
export function isTaskLayout(value: unknown): value is TaskLayout {
  return typeof value === 'string' && (TASK_LAYOUTS as readonly string[]).includes(value);
}

/**
 * Verifica se o valor é um status de tarefa válido
 */
export function isTaskStatus(value: unknown): value is TaskStatus {
  return typeof value === 'string' && (TASK_STATUSES as string[]).includes(value);
}
