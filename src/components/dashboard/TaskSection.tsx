import Link from 'next/link';
import { LuCalendar, LuCalendarCheck, LuInbox, LuListChecks } from 'react-icons/lu';
import { deleteTaskAction } from '@/actions/tasks';
import type { Employee, Task, TaskStatus } from '@/lib/types';
import { LEADERSHIP_LEVEL_LABELS, TASK_STATUSES, TASK_STATUS_LABELS } from '@/lib/types';
import Avatar from '@/components/ui/Avatar';
import { STATUS_DOTS, StatusBadge } from '@/components/ui/Badge';
import { textLinkStyles } from '@/components/ui/Button';
import Card, { CardHeader } from '@/components/ui/Card';
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

  const filters: { label: string; href: string; active: boolean; status?: TaskStatus }[] = [
    { label: 'Todas', href: '/dashboard', active: !status },
    ...TASK_STATUSES.map(value => ({
      label: TASK_STATUS_LABELS[value],
      href: `/dashboard?status=${value}`,
      active: status === value,
      status: value,
    })),
  ];

  const countLabel = `${tasks.length} ${tasks.length === 1 ? 'tarefa' : 'tarefas'}`;

  return (
    <Card as="section" aria-labelledby="tasks-title">
      <CardHeader
        titleId="tasks-title"
        title="Tarefas"
        description={status ? `${countLabel} · ${TASK_STATUS_LABELS[status]}` : countLabel}
        icon={<LuListChecks aria-hidden="true" className="h-5 w-5" />}
      />

      <div className="flex flex-col gap-5 p-4 sm:p-5">
        <CreateTaskForm employees={registered} defaultOpen={tasks.length === 0 && !status} />

        <nav aria-label="Filtrar tarefas por status" className="-mx-1 overflow-x-auto px-1 pb-1">
          <ul className="inline-flex min-w-max gap-1 rounded-xl bg-slate-100 p-1">
            {filters.map(filter => (
              <li key={filter.href}>
                <Link
                  href={filter.href}
                  aria-current={filter.active ? 'page' : undefined}
                  className={`inline-flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                    filter.active ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:bg-white/60 hover:text-slate-900'
                  }`}
                >
                  {filter.status && (
                    <span aria-hidden="true" className={`h-2 w-2 rounded-full ${STATUS_DOTS[filter.status]}`} />
                  )}
                  {filter.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        {tasks.length === 0 ? (
          <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed border-slate-300 px-6 py-10 text-center">
            <span className="flex h-11 w-11 items-center justify-center rounded-full bg-slate-100 text-slate-500">
              <LuInbox aria-hidden="true" className="h-5 w-5" />
            </span>
            {status ? (
              <>
                <p className="font-medium text-slate-900">Nenhuma tarefa com status “{TASK_STATUS_LABELS[status]}”</p>
                <Link href="/dashboard" className={`text-sm ${textLinkStyles}`}>
                  Ver todas as tarefas
                </Link>
              </>
            ) : (
              <>
                <p className="font-medium text-slate-900">Nenhuma tarefa por aqui ainda</p>
                <p className="max-w-sm text-sm text-slate-500">
                  Crie a primeira tarefa e escolha quem é o responsável principal, quem apoia e quem acompanha.
                </p>
              </>
            )}
          </div>
        ) : (
          <ul className="flex flex-col gap-3">
            {tasks.map(task => {
              // Verifica se o usuário é responsável pela tarefa
              const isResponsible = task.responsibles.some(
                responsible => responsible.employee?.employeeId === me.employeeId
              );
              const canChangeStatus = isLeader || isResponsible;
              const responsibles = [...task.responsibles].sort((a, b) => b.leadershipLevel - a.leadershipLevel);
              const createdAt = formatDate(task.createdAt);
              const completedAt = formatDate(task.completedAt);

              return (
                <li
                  key={task.taskId}
                  className="flex flex-col gap-3 rounded-xl border border-slate-200 p-4 transition-colors hover:border-slate-300"
                >
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <h3 className="min-w-0 flex-1 font-semibold text-slate-900">
                      <span className="mr-1.5 text-sm font-normal text-slate-500">#{task.taskId}</span>
                      {task.taskName}
                    </h3>
                    <StatusBadge status={task.status} />
                  </div>
                  {task.description && (
                    <p className="-mt-1 whitespace-pre-line text-sm text-slate-600">{task.description}</p>
                  )}

                  <ul className="flex flex-wrap gap-2 text-xs" aria-label="Responsáveis">
                    {responsibles.map((responsible, index) => {
                      const name =
                        responsible.employee?.name ?? responsible.employee?.email ?? 'Funcionário removido';

                      return (
                        <li
                          key={responsible.employee?.employeeId ?? `removed-${index}`}
                          className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-slate-50 py-0.5 pl-0.5 pr-2.5"
                        >
                          <Avatar name={name} size="sm" />
                          <span className="font-medium text-slate-700">{name}</span>
                          <span className="text-slate-500">
                            · {LEADERSHIP_LEVEL_LABELS[responsible.leadershipLevel] ?? `Nível ${responsible.leadershipLevel}`}
                          </span>
                        </li>
                      );
                    })}
                  </ul>

                  <p className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500">
                    {createdAt && (
                      <span className="inline-flex items-center gap-1">
                        <LuCalendar aria-hidden="true" className="h-3.5 w-3.5" />
                        Criada em {createdAt}
                      </span>
                    )}
                    {completedAt && (
                      <span className="inline-flex items-center gap-1 text-done-strong">
                        <LuCalendarCheck aria-hidden="true" className="h-3.5 w-3.5" />
                        Concluída em {completedAt}
                      </span>
                    )}
                  </p>

                  {canChangeStatus && (
                    <div className="flex flex-wrap items-start justify-between gap-2 border-t border-slate-100 pt-3">
                      <TaskStatusForm taskId={task.taskId} status={task.status} />
                      {isLeader && (
                        <div className="flex flex-wrap items-start justify-end gap-1 has-[[data-edit-form]]:w-full">
                          <TaskEditForm task={task} employees={registered} />
                          <ConfirmActionForm
                            action={deleteTaskAction}
                            fields={{ taskId: task.taskId }}
                            label="Excluir"
                            confirmLabel="Confirmar exclusão"
                            accessibleLabel={`Excluir a tarefa ${task.taskName}`}
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
      </div>
    </Card>
  );
}
