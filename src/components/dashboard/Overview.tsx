import Link from 'next/link';
import { LuCheckCircle2, LuCircleDashed, LuListChecks, LuLoader2 } from 'react-icons/lu';
import { dashboardHref } from '@/lib/dashboard-url';
import { getTaskProgress, plural } from '@/lib/format';
import type { Company, Employee, ProjectItem, Team, TaskItem, TaskStatus } from '@/lib/types';
import { TASK_STATUSES, TASK_STATUS_LABELS } from '@/lib/types';
import AvatarStack from '@/components/ui/AvatarStack';
import { STATUS_DOTS, StatusBadge } from '@/components/ui/Badge';
import { textLinkStyles } from '@/components/ui/Button';
import Card, { CardHeader } from '@/components/ui/Card';
import ProgressBar from '@/components/ui/ProgressBar';
import ProjectTag from './ProjectTag';
import QuickActions from './QuickActions';

type OverviewProps = {
  me: Employee;
  company: Company;
  tasks: TaskItem[];
  projects: ProjectItem[];
  teams: Team[];
  // Funcionários registrados
  employees: Employee[];
};

// Quantos itens aparecem em cada lista do resumo
const MAX_ITEMS = 5;

const KPI_STYLES: Record<'total' | TaskStatus, { icon: React.ReactNode; tone: string }> = {
  total: {
    icon: <LuListChecks aria-hidden="true" className="h-5 w-5" />,
    tone: 'bg-brand-50 text-brand-600',
  },
  pendente: {
    icon: <LuCircleDashed aria-hidden="true" className="h-5 w-5" />,
    tone: 'bg-pending-soft text-pending-strong',
  },
  em_andamento: {
    icon: <LuLoader2 aria-hidden="true" className="h-5 w-5" />,
    tone: 'bg-progress-soft text-progress-strong',
  },
  concluida: {
    icon: <LuCheckCircle2 aria-hidden="true" className="h-5 w-5" />,
    tone: 'bg-done-soft text-done-strong',
  },
};

// Resumo do painel: indicadores, minhas tarefas, progresso geral, projetos e equipes
export default function Overview({ me, company, tasks, projects, teams, employees }: OverviewProps) {
  const isLeader = me.role === 'leader';
  const firstName = me.name?.split(' ')[0];
  const progress = getTaskProgress(tasks);
  const percent = progress.total > 0 ? Math.round((progress.done / progress.total) * 100) : 0;

  const myOpenTasks = tasks.filter(
    task =>
      task.status !== 'concluida' &&
      task.responsibles.some(responsible => responsible.employee?.employeeId === me.employeeId)
  );

  // Projetos com mais tarefas em aberto primeiro
  const activeProjects = [...projects]
    .sort(
      (a, b) =>
        b.progress.total - b.progress.done - (a.progress.total - a.progress.done) || a.name.localeCompare(b.name, 'pt-BR')
    )
    .slice(0, MAX_ITEMS);

  const kpis: { key: 'total' | TaskStatus; label: string; value: number; href: string }[] = [
    { key: 'total', label: 'Tarefas', value: progress.total, href: dashboardHref({ view: 'tarefas' }) },
    ...TASK_STATUSES.map(status => ({
      key: status,
      label: TASK_STATUS_LABELS[status],
      value: progress.byStatus[status],
      // O filtro de status só vale na lista e na grade
      href: dashboardHref({ view: 'tarefas', layout: 'list', status }),
    })),
  ];

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <h1 className="break-words text-2xl font-bold tracking-tight text-slate-900">
            {firstName ? `Olá, ${firstName}` : 'Painel'}
          </h1>
          <p className="mt-1 break-words text-sm text-slate-600">Acompanhe a equipe e as tarefas de {company.name}.</p>
        </div>
        <QuickActions employees={employees} projects={projects} teams={teams} isLeader={isLeader} />
      </div>

      <ul aria-label="Indicadores" className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {kpis.map(kpi => (
          <li key={kpi.key}>
            <Link
              href={kpi.href}
              className="flex h-full items-center gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition-colors hover:border-slate-300"
            >
              <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${KPI_STYLES[kpi.key].tone}`}>
                {KPI_STYLES[kpi.key].icon}
              </span>
              <span className="min-w-0">
                <span className="block text-2xl font-bold leading-tight text-slate-900">{kpi.value}</span>
                <span className="block truncate text-sm text-slate-600">{kpi.label}</span>
              </span>
            </Link>
          </li>
        ))}
      </ul>

      <div className="grid grid-cols-[minmax(0,1fr)] items-start gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        <Card as="section" aria-labelledby="my-tasks-title">
          <CardHeader
            titleId="my-tasks-title"
            title="Minhas tarefas em aberto"
            description={plural(myOpenTasks.length, 'tarefa', 'tarefas')}
            action={
              <Link href={dashboardHref({ view: 'tarefas' })} className={`text-sm ${textLinkStyles}`}>
                Ver todas as tarefas
              </Link>
            }
          />
          <div className="p-4 sm:p-5">
            {myOpenTasks.length === 0 ? (
              <p className="text-sm text-slate-500">Você não tem tarefas em aberto. Bom trabalho!</p>
            ) : (
              <ul className="flex flex-col divide-y divide-slate-100">
                {myOpenTasks.slice(0, MAX_ITEMS).map(task => (
                  <li key={task.taskId} className="flex flex-wrap items-center justify-between gap-x-3 gap-y-2 py-3 first:pt-0 last:pb-0">
                    <div className="flex min-w-0 flex-1 flex-col gap-1">
                      <p className="break-words font-medium text-slate-900">
                        <span className="mr-1.5 text-sm font-normal text-slate-500">#{task.taskId}</span>
                        {task.taskName}
                      </p>
                      {task.project && <ProjectTag project={task.project} />}
                    </div>
                    <StatusBadge status={task.status} />
                  </li>
                ))}
              </ul>
            )}
          </div>
        </Card>

        <Card as="section" aria-labelledby="progress-title">
          <CardHeader titleId="progress-title" title="Progresso geral" description="Tarefas concluídas" />
          <div className="flex flex-col gap-4 p-4 sm:p-5">
            <div className="flex items-end justify-between gap-2">
              <p className="text-4xl font-bold leading-none text-slate-900">{percent}%</p>
              <p className="text-sm text-slate-500">
                {progress.done} de {plural(progress.total, 'tarefa', 'tarefas')}
              </p>
            </div>
            <ProgressBar value={progress.done} max={progress.total} label="Progresso geral das tarefas" className="h-3" />
            <ul className="flex flex-col gap-2 text-sm">
              {TASK_STATUSES.map(status => (
                <li key={status} className="flex items-center justify-between gap-2">
                  <span className="inline-flex items-center gap-2 text-slate-600">
                    <span aria-hidden="true" className={`h-2 w-2 rounded-full ${STATUS_DOTS[status]}`} />
                    {TASK_STATUS_LABELS[status]}
                  </span>
                  <span className="font-medium text-slate-900">{progress.byStatus[status]}</span>
                </li>
              ))}
            </ul>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-[minmax(0,1fr)] items-start gap-6 lg:grid-cols-2">
        <Card as="section" aria-labelledby="overview-projects-title">
          <CardHeader
            titleId="overview-projects-title"
            title="Projetos"
            description={plural(projects.length, 'projeto', 'projetos')}
            action={
              <Link href={dashboardHref({ view: 'projetos' })} className={`text-sm ${textLinkStyles}`}>
                Ver projetos
              </Link>
            }
          />
          <div className="p-4 sm:p-5">
            {activeProjects.length === 0 ? (
              <p className="text-sm text-slate-500">
                Nenhum projeto ainda.{isLeader && ' Use “Novo projeto” para agrupar tarefas.'}
              </p>
            ) : (
              <ul className="flex flex-col gap-4">
                {activeProjects.map(project => (
                  <li key={project.projectId} className="flex flex-col gap-1.5">
                    <div className="flex items-baseline justify-between gap-2">
                      <Link
                        href={dashboardHref({ view: 'tarefas', project: project.projectId })}
                        className="min-w-0 truncate font-medium text-slate-900 hover:text-brand-700"
                      >
                        {project.name}
                      </Link>
                      <span className="shrink-0 text-xs text-slate-500">
                        {project.progress.done}/{project.progress.total}
                      </span>
                    </div>
                    <ProgressBar
                      value={project.progress.done}
                      max={project.progress.total}
                      label={`Progresso do projeto ${project.name}`}
                    />
                  </li>
                ))}
              </ul>
            )}
          </div>
        </Card>

        <Card as="section" aria-labelledby="overview-teams-title">
          <CardHeader
            titleId="overview-teams-title"
            title="Equipes"
            description={plural(teams.length, 'equipe', 'equipes')}
            action={
              <Link href={dashboardHref({ view: 'equipes' })} className={`text-sm ${textLinkStyles}`}>
                Ver equipes
              </Link>
            }
          />
          <div className="p-4 sm:p-5">
            {teams.length === 0 ? (
              <p className="text-sm text-slate-500">
                Nenhuma equipe ainda.{isLeader && ' Use “Nova equipe” para reunir os membros.'}
              </p>
            ) : (
              <ul className="flex flex-col divide-y divide-slate-100">
                {teams.slice(0, MAX_ITEMS).map(team => (
                  <li key={team.teamId} className="flex items-center justify-between gap-3 py-2.5 first:pt-0 last:pb-0">
                    <div className="min-w-0">
                      <p className="truncate font-medium text-slate-900">{team.name}</p>
                      <p className="text-xs text-slate-500">{plural(team.members.length, 'membro', 'membros')}</p>
                    </div>
                    <AvatarStack names={team.members.map(member => member.name ?? member.email)} />
                  </li>
                ))}
              </ul>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
