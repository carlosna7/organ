import { redirect } from 'next/navigation';
import { getUserData } from '@/lib/auth';
import { logoutAction } from '@/actions/auth';
import { graphqlRequest } from '@/lib/graphql';
import type { Company, Employee, Task } from '@/lib/types';
import { isTaskStatus } from '@/lib/types';
import DashboardHeader from '@/components/dashboard/DashboardHeader';
import TaskSection from '@/components/dashboard/TaskSection';
import TeamSection from '@/components/dashboard/TeamSection';

// Sempre renderiza no servidor a cada requisição (sem cache)
export const dynamic = 'force-dynamic';

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
      <main className="flex min-h-screen flex-col items-center justify-center gap-4 p-6">
        <p className="text-lg font-semibold">Não foi possível carregar o dashboard.</p>
        <p className="text-sm text-gray-600">
          {error.code === 'NETWORK_ERROR' ? 'O servidor está indisponível no momento. Tente novamente.' : error.message}
        </p>
        <form action={logoutAction}>
          <button type="submit" className="rounded bg-red-500 px-4 py-2 text-white hover:bg-red-600">
            Logout
          </button>
        </form>
      </main>
    );
  }

  const { me, getCompany: company, getEmployees: employees, getTasks: tasks } = data;

  return (
    <div className="min-h-screen bg-gray-50">
      <DashboardHeader companyName={company.name} me={me} />

      <main className="grid gap-6 p-6 lg:grid-cols-[1fr_2fr]">
        <TeamSection employees={employees} me={me} />
        <TaskSection tasks={tasks} employees={employees} me={me} status={status} />
      </main>
    </div>
  );
}
