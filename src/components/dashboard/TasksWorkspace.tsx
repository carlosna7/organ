'use client';

import { useId, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { LuInbox, LuKanban, LuLayoutGrid, LuList, LuPlus } from 'react-icons/lu';
import { dashboardHref } from '@/lib/dashboard-url';
import type { Employee, Project, TaskItem, TaskLayout, TaskStatus } from '@/lib/types';
import {
  TASK_LAYOUTS,
  TASK_LAYOUT_COOKIE,
  TASK_LAYOUT_LABELS,
  TASK_STATUSES,
  TASK_STATUS_LABELS,
} from '@/lib/types';
import { STATUS_DOTS } from '@/components/ui/Badge';
import { buttonStyles, textLinkStyles } from '@/components/ui/Button';
import EmptyState from '@/components/ui/EmptyState';
import { fieldStyles } from '@/components/ui/Input';
import KanbanBoard from './KanbanBoard';
import TaskCard from './TaskCard';
import TaskFormModal from './TaskFormModal';

type TasksWorkspaceProps = {
  // Tarefas já filtradas (o servidor aplica status e projeto)
  tasks: TaskItem[];
  // Funcionários registrados (só eles podem ser responsáveis)
  employees: Employee[];
  projects: Project[];
  me: Employee;
  layout: TaskLayout;
  // Filtro de status (não vale no kanban, onde cada coluna é um status)
  status?: TaskStatus;
  // Filtro de projeto: o projectId ou "none" para tarefas sem projeto
  project?: number | 'none';
};

const LAYOUT_ICONS = {
  list: LuList,
  kanban: LuKanban,
  grid: LuLayoutGrid,
};

// Guarda a forma de ver as tarefas para a próxima visita (o servidor lê este cookie)
function rememberLayout(layout: TaskLayout) {
  document.cookie = `${TASK_LAYOUT_COOKIE}=${layout}; path=/; max-age=31536000; samesite=lax`;
}

type TaskModal = { type: 'create' } | { type: 'edit'; task: TaskItem };

// Tarefas: escolha entre lista, kanban e grade, filtros, criação e edição em janela modal
export default function TasksWorkspace({ tasks, employees, projects, me, layout, status, project }: TasksWorkspaceProps) {
  const router = useRouter();
  const projectFilterId = useId();
  const [modal, setModal] = useState<TaskModal | null>(null);

  const isKanban = layout === 'kanban';
  const projectName =
    project === 'none' ? 'Sem projeto' : projects.find(item => item.projectId === project)?.name;

  const descriptionParts = [
    `${tasks.length} ${tasks.length === 1 ? 'tarefa' : 'tarefas'}`,
    status ? TASK_STATUS_LABELS[status] : null,
    projectName,
  ].filter(Boolean);

  const statusFilters: { label: string; href: string; active: boolean; status?: TaskStatus }[] = [
    { label: 'Todas', href: dashboardHref({ view: 'tarefas', layout, project }), active: !status },
    ...TASK_STATUSES.map(value => ({
      label: TASK_STATUS_LABELS[value],
      href: dashboardHref({ view: 'tarefas', layout, status: value, project }),
      active: status === value,
      status: value,
    })),
  ];

  const hasFilters = status !== undefined || project !== undefined;
  const emptyTitle = (() => {
    if (status && projectName) return `Nenhuma tarefa com status “${TASK_STATUS_LABELS[status]}” em “${projectName}”`;
    if (status) return `Nenhuma tarefa com status “${TASK_STATUS_LABELS[status]}”`;
    if (project === 'none') return 'Nenhuma tarefa sem projeto';
    if (projectName) return `Nenhuma tarefa em “${projectName}”`;
    return 'Nenhuma tarefa por aqui ainda';
  })();

  return (
    <section aria-labelledby="tasks-title" className="flex flex-col gap-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h1 id="tasks-title" className="text-2xl font-bold tracking-tight text-slate-900">
            Tarefas
          </h1>
          <p className="mt-1 break-words text-sm text-slate-600">{descriptionParts.join(' · ')}</p>
        </div>
        <button type="button" onClick={() => setModal({ type: 'create' })} className={buttonStyles()}>
          <LuPlus aria-hidden="true" className="h-4 w-4" />
          Nova tarefa
        </button>
      </div>

      <div className="flex flex-wrap items-center gap-x-4 gap-y-3">
        <nav aria-label="Forma de visualização" className="-mx-1 overflow-x-auto px-1 pb-1">
          <ul className="inline-flex min-w-max gap-1 rounded-xl bg-slate-100 p-1">
            {TASK_LAYOUTS.map(value => {
              const Icon = LAYOUT_ICONS[value];
              const active = layout === value;

              return (
                <li key={value}>
                  <Link
                    href={dashboardHref({
                      view: 'tarefas',
                      layout: value,
                      // No kanban cada coluna já é um status, então o filtro de status não se aplica
                      status: value === 'kanban' ? undefined : status,
                      project,
                    })}
                    onClick={() => rememberLayout(value)}
                    aria-current={active ? 'page' : undefined}
                    className={`inline-flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                      active ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:bg-white/60 hover:text-slate-900'
                    }`}
                  >
                    <Icon aria-hidden="true" className="h-4 w-4" />
                    {TASK_LAYOUT_LABELS[value]}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        {!isKanban && (
          <nav aria-label="Filtrar tarefas por status" className="-mx-1 overflow-x-auto px-1 pb-1">
            <ul className="inline-flex min-w-max gap-1 rounded-xl bg-slate-100 p-1">
              {statusFilters.map(filter => (
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
        )}

        {projects.length > 0 && (
          <div className="flex items-center gap-2 pb-1">
            <label htmlFor={projectFilterId} className="text-sm font-medium text-slate-600">
              Projeto
            </label>
            <select
              id={projectFilterId}
              value={project === undefined ? '' : String(project)}
              onChange={event => {
                const { value } = event.target;
                router.push(
                  dashboardHref({
                    view: 'tarefas',
                    layout,
                    status,
                    project: value === '' ? undefined : value === 'none' ? 'none' : Number(value),
                  })
                );
              }}
              className={`${fieldStyles} !w-auto max-w-[14rem] !py-1.5`}
            >
              <option value="">Todos os projetos</option>
              <option value="none">Sem projeto</option>
              {projects.map(item => (
                <option key={item.projectId} value={item.projectId}>
                  {item.name}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {tasks.length > 0 && !isKanban && (
        <h2 className="sr-only">{layout === 'grid' ? 'Grade de tarefas' : 'Lista de tarefas'}</h2>
      )}

      {tasks.length === 0 ? (
        <EmptyState
          icon={<LuInbox aria-hidden="true" className="h-5 w-5" />}
          title={emptyTitle}
          description={
            hasFilters
              ? undefined
              : 'Crie a primeira tarefa e escolha quem é o responsável principal, quem apoia e quem acompanha.'
          }
        >
          {hasFilters ? (
            <Link href={dashboardHref({ view: 'tarefas', layout })} className={`text-sm ${textLinkStyles}`}>
              Ver todas as tarefas
            </Link>
          ) : (
            <button type="button" onClick={() => setModal({ type: 'create' })} className={buttonStyles()}>
              <LuPlus aria-hidden="true" className="h-4 w-4" />
              Criar a primeira tarefa
            </button>
          )}
        </EmptyState>
      ) : isKanban ? (
        <KanbanBoard tasks={tasks} me={me} onEdit={task => setModal({ type: 'edit', task })} />
      ) : (
        <ul
          className={
            layout === 'grid'
              ? 'grid grid-cols-[minmax(0,1fr)] gap-3 sm:grid-cols-2 xl:grid-cols-3'
              : 'flex flex-col gap-3'
          }
        >
          {tasks.map(task => (
            <TaskCard key={task.taskId} task={task} me={me} onEdit={task => setModal({ type: 'edit', task })} />
          ))}
        </ul>
      )}

      {modal && (
        <TaskFormModal
          key={modal.type === 'edit' ? modal.task.taskId : 'new'}
          task={modal.type === 'edit' ? modal.task : undefined}
          employees={employees}
          projects={projects}
          onClose={() => setModal(null)}
        />
      )}
    </section>
  );
}
