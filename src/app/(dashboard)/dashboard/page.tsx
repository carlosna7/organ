import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { LuLogOut, LuServerCrash } from 'react-icons/lu';
import { getUserData } from '@/lib/auth';
import { logoutAction } from '@/actions/auth';
import { graphqlRequest } from '@/lib/graphql';
import type { Company, Employee, Task } from '@/lib/types';
import { isTaskStatus } from '@/lib/types';
import DashboardHeader from '@/components/dashboard/DashboardHeader';
import TaskSection from '@/components/dashboard/TaskSection';
import TeamSection from '@/components/dashboard/TeamSection';
import { buttonStyles } from '@/components/ui/Button';
import Card from '@/components/ui/Card';

// Sempre renderiza no servidor a cada requisição (sem cache)
export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Painel',
  description: 'Equipe e tarefas da sua empresa no Organ.',
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
  query Dashboard($status: TaskStatus) {
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
    getTasks(status: $status) {
      _id
      taskId
      taskName
      description
      status
      createdAt
      completedAt
      responsibles {
        leadershipLevel
        employee {
          ${EMPLOYEE_FIELDS}
        }
      }
    }
  }
`;

type DashboardData = {
  me: Employee;
  getCompany: Company;
  getEmployees: Employee[];
  getTasks: Task[];
};

export default async function DashboardPage({ searchParams }: { searchParams: { status?: string } }) {
  // Verificar autenticação (redireciona para login se o token for inválido)
  await getUserData();

  // Filtro de status vindo de ?status=
  const statusParam = searchParams?.status;
  const status = isTaskStatus(statusParam) ? statusParam : undefined;

  const { data, error } = await graphqlRequest<DashboardData>(DASHBOARD_QUERY, { status: status ?? null });

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

  const { me, getCompany: company, getEmployees: employees, getTasks: tasks } = data;
  const firstName = me.name?.split(' ')[0];

  return (
    <div className="min-h-screen bg-slate-50">
      <DashboardHeader companyName={company.name} me={me} />

      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            {firstName ? `Olá, ${firstName}` : 'Painel'}
          </h1>
          <p className="mt-1 text-sm text-slate-600">Acompanhe a equipe e as tarefas de {company.name}.</p>
        </div>

        <div className="grid grid-cols-[minmax(0,1fr)] items-start gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,2fr)]">
          <TeamSection employees={employees} me={me} />
          <TaskSection tasks={tasks} employees={employees} me={me} status={status} />
        </div>
      </main>
    </div>
  );
}
