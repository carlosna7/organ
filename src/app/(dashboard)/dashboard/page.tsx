import type { Metadata } from 'next';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { LuLogOut, LuServerCrash } from 'react-icons/lu';
import { getUserData } from '@/lib/auth';
import { logoutAction } from '@/actions/auth';
import { getTaskProgress, toTaskItems } from '@/lib/format';
import { graphqlRequest } from '@/lib/graphql';
import type { Company, Employee, Project, ProjectItem, Task, Team } from '@/lib/types';
import { TASK_LAYOUT_COOKIE, isDashboardView, isTaskLayout, isTaskStatus } from '@/lib/types';
import DashboardHeader from '@/components/dashboard/DashboardHeader';
import MembersWorkspace from '@/components/dashboard/MembersWorkspace';
import Overview from '@/components/dashboard/Overview';
import ProjectsWorkspace from '@/components/dashboard/ProjectsWorkspace';
import TasksWorkspace from '@/components/dashboard/TasksWorkspace';
import TeamsWorkspace from '@/components/dashboard/TeamsWorkspace';
import { buttonStyles } from '@/components/ui/Button';
import Card from '@/components/ui/Card';

// Sempre renderiza no servidor a cada requisição (sem cache)
export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Painel',
  description: 'Equipes, projetos e tarefas da sua empresa no Organ.',
};

const EMPLOYEE_FIELDS = `
  _id
  employeeId
  name
  position
  email
  role
  isRegistered
`;

const DASHBOARD_QUERY = `
  query Dashboard {
    me {
      ${EMPLOYEE_FIELDS}
    }
    getCompany {
      _id
      companyId
      name
      createdAt
    }
    getEmployees {
      ${EMPLOYEE_FIELDS}
    }
    getTasks {
      _id
      taskId
      taskName
      description
      status
      createdAt
      completedAt
      project {
        projectId
        name
      }
      responsibles {
        leadershipLevel
        employee {
          ${EMPLOYEE_FIELDS}
        }
      }
    }
    getProjects {
      _id
      projectId
      name
      description
      createdAt
      team {
        teamId
        name
      }
    }
    getTeams {
      _id
      teamId
      name
      description
      createdAt
      members {
        ${EMPLOYEE_FIELDS}
      }
    }
  }
`;

type DashboardData = {
  me: Employee;
  getCompany: Company;
  getEmployees: Employee[];
  getTasks: Task[];
  getProjects: Project[];
  getTeams: Team[];
};

type DashboardSearchParams = {
  view?: string;
  layout?: string;
  status?: string;
  project?: string;
};

export default async function DashboardPage({ searchParams }: { searchParams: DashboardSearchParams }) {
  // Verificar autenticação (redireciona para login se o token for inválido)
  await getUserData();

  // Seção, forma de ver as tarefas e filtros vindos da URL (?view=&layout=&status=&project=)
  const view = isDashboardView(searchParams?.view) ? searchParams.view : 'resumo';
  const savedLayout = cookies().get(TASK_LAYOUT_COOKIE)?.value;
  const layout = isTaskLayout(searchParams?.layout) ? searchParams.layout : isTaskLayout(savedLayout) ? savedLayout : 'list';
  // No kanban cada coluna já é um status, então o filtro de status não se aplica
  const status = layout !== 'kanban' && isTaskStatus(searchParams?.status) ? searchParams.status : undefined;

  const { data, error } = await graphqlRequest<DashboardData>(DASHBOARD_QUERY);

  if (error) {
    // Sessão rejeitada pela API (ex.: funcionário removido): limpa o cookie via /logout
    if (error.code === 'UNAUTHENTICATED' || error.code === 'NOT_FOUND') {
      redirect('/logout');
    }

    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-50 p-4">
        <Card className="flex w-full max-w-md flex-col items-center gap-4 p-8 text-center">
          <span className="flex h-12 w-12 items-center justify-center rounded-full bg-red-50 text-red-600">
            <LuServerCrash aria-hidden="true" className="h-6 w-6" />
          </span>
          <h1 className="text-lg font-semibold text-slate-900">Não foi possível carregar o painel.</h1>
          <p className="text-sm text-slate-600">
            {error.code === 'NETWORK_ERROR' ? 'O servidor está indisponível no momento. Tente novamente.' : error.message}
          </p>
          <form action={logoutAction}>
            <button type="submit" className={buttonStyles({ variant: 'secondary' })}>
              <LuLogOut aria-hidden="true" className="h-4 w-4" />
              Sair
            </button>
          </form>
        </Card>
      </main>
    );
  }

  const { me, getCompany: company, getEmployees: employees, getTasks: tasks, getProjects, getTeams: teams } = data;

  const taskItems = toTaskItems(tasks);
  const registered = employees.filter(employee => employee.isRegistered);

  // Progresso de cada projeto pelas tarefas dele
  const projects: ProjectItem[] = getProjects.map(project => ({
    ...project,
    progress: getTaskProgress(taskItems.filter(task => task.project?.projectId === project.projectId)),
  }));

  // Filtro de projeto: um projectId que existe, ou "none" para tarefas sem projeto
  const projectParam = searchParams?.project;
  const projectId = /^\d+$/.test(projectParam ?? '') ? Number(projectParam) : undefined;
  const projectFilter =
    projectParam === 'none' ? 'none' : projects.some(project => project.projectId === projectId) ? projectId : undefined;

  const visibleTasks = taskItems.filter(task => {
    if (status && task.status !== status) return false;
    if (projectFilter === 'none') return !task.project;
    if (projectFilter !== undefined) return task.project?.projectId === projectFilter;
    return true;
  });

  return (
    <div className="min-h-screen bg-slate-50">
      <DashboardHeader companyName={company.name} me={me} view={view} />

      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:py-8">
        {view === 'resumo' && (
          <Overview
            me={me}
            company={company}
            tasks={taskItems}
            projects={projects}
            teams={teams}
            employees={registered}
          />
        )}
        {view === 'tarefas' && (
          <TasksWorkspace
            tasks={visibleTasks}
            employees={registered}
            projects={projects}
            me={me}
            layout={layout}
            status={status}
            project={projectFilter}
          />
        )}
        {view === 'projetos' && <ProjectsWorkspace projects={projects} teams={teams} isLeader={me.role === 'leader'} />}
        {view === 'equipes' && (
          <TeamsWorkspace teams={teams} projects={projects} employees={registered} isLeader={me.role === 'leader'} />
        )}
        {view === 'membros' && <MembersWorkspace employees={employees} teams={teams} me={me} />}
      </main>
    </div>
  );
}
