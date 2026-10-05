import Link from 'next/link';
import { deleteTaskAction } from '@/actions/tasks';
import type { Employee, Task, TaskStatus } from '@/lib/types';
import { LEADERSHIP_LEVEL_LABELS, TASK_STATUSES, TASK_STATUS_LABELS } from '@/lib/types';
import ConfirmActionForm from './ConfirmActionForm';
import CreateTaskForm from './CreateTaskForm';
import TaskEditForm from './TaskEditForm';
import TaskStatusForm from './TaskStatusForm';

type TaskSectionProps = {
  tasks: Task[];
  employees: Employee[];
  me: Employee;
  status?: TaskStatus;
};

const STATUS_STYLES: Record<TaskStatus, string> = {
  pendente: 'bg-yellow-100 text-yellow-800',
  em_andamento: 'bg-blue-100 text-blue-800',
  concluida: 'bg-green-100 text-green-800',
};

// Formata datas ISO 8601 para o padrão brasileiro
function formatDate(value: string | null) {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toLocaleDateString('pt-BR');
}

// Tarefas: filtro por status, criação e ações conforme a permissão
export default function TaskSection({ tasks, employees, me, status }: TaskSectionProps) {
  const isLeader = me.role === 'leader';
  const registered = employees.filter(employee => employee.isRegistered);

  const filters: { label: string; href: string; active: boolean }[] = [
    { label: 'Todas', href: '/dashboard', active: !status },
    ...TASK_STATUSES.map(value => ({
      label: TASK_STATUS_LABELS[value],
      href: `/dashboard?status=${value}`,
      active: status === value,
    })),
  ];

  return (
    <section className="flex flex-col gap-4 rounded border bg-white p-4">
      <h2 className="text-lg font-semibold">Tarefas</h2>

      <CreateTaskForm employees={registered} />

      <nav className="flex flex-wrap gap-2" aria-label="Filtrar tarefas por status">
        {filters.map(filter => (
          <Link
            key={filter.href}
            href={filter.href}
            aria-current={filter.active ? 'page' : undefined}
            className={`rounded-full border px-3 py-1 text-sm ${filter.active ? 'bg-gray-800 text-white' : 'hover:bg-gray-100'}`}
          >
            {filter.label}
          </Link>
        ))}
      </nav>

      {tasks.length === 0 ? (
        <p className="text-sm text-gray-500">Nenhuma tarefa encontrada.</p>
      ) : (
        <ul className="flex flex-col gap-3">
          {tasks.map(task => {
            // Verifica se o usuário é responsável pela tarefa
            const isResponsible = task.responsibles.some(
              responsible => responsible.employee?.employeeId === me.employeeId
            );
            const canChangeStatus = isLeader || isResponsible;
            const responsibles = [...task.responsibles].sort((a, b) => b.leadershipLevel - a.leadershipLevel);

            return (
              <li key={task.taskId} className="flex flex-col gap-2 rounded border p-3">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <p className="font-medium">
                      <span className="text-gray-500">#{task.taskId}</span> {task.taskName}
                    </p>
                    {task.description && <p className="text-sm text-gray-700">{task.description}</p>}
                  </div>
                  <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_STYLES[task.status]}`}>
                    {TASK_STATUS_LABELS[task.status]}
                  </span>
                </div>

                <ul className="flex flex-wrap gap-2 text-xs">
                  {responsibles.map((responsible, index) => (
                    <li key={responsible.employee?.employeeId ?? `removed-${index}`} className="rounded bg-gray-100 px-2 py-0.5">
                      {responsible.employee?.name ?? responsible.employee?.email ?? 'Funcionário removido'}
                      {' · '}
                      {LEADERSHIP_LEVEL_LABELS[responsible.leadershipLevel] ?? `Nível ${responsible.leadershipLevel}`}
                    </li>
                  ))}
                </ul>

                <p className="text-xs text-gray-500">
                  Criada em {formatDate(task.createdAt)}
                  {task.completedAt && ` · Concluída em ${formatDate(task.completedAt)}`}
                </p>

                {canChangeStatus && (
                  <div className="flex flex-wrap items-start justify-between gap-2 border-t pt-2">
                    {canChangeStatus && <TaskStatusForm taskId={task.taskId} status={task.status} />}
                    {isLeader && (
                      <div className="flex flex-wrap items-start gap-2">
                        <TaskEditForm task={task} employees={registered} />
                        <ConfirmActionForm
                          action={deleteTaskAction}
                          fields={{ taskId: task.taskId }}
                          label="Excluir"
                          confirmLabel="Confirmar exclusão"
                        />
                      </div>
                    )}
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
