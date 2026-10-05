import { logoutAction } from '@/actions/auth';
import type { Employee } from '@/lib/types';
import { ROLE_LABELS } from '@/lib/types';

type DashboardHeaderProps = {
  companyName: string;
  me: Employee;
};

// Cabeçalho com empresa, usuário logado e logout
export default function DashboardHeader({ companyName, me }: DashboardHeaderProps) {
  return (
    <header className="flex flex-wrap items-center justify-between gap-4 border-b bg-white px-6 py-4">
      <div>
        <p className="text-xs uppercase text-gray-500">Empresa</p>
        <h1 className="text-2xl font-bold">{companyName}</h1>
      </div>

      <div className="flex items-center gap-4">
        <div className="text-right">
          <p className="font-medium">{me.name ?? me.email}</p>
          <p className="text-sm text-gray-600">
            {me.position ?? 'Sem cargo'} · {ROLE_LABELS[me.role]}
          </p>
        </div>

        {/* Form para logout usando Server Action */}
        <form action={logoutAction}>
          <button
            type="submit"
            className="rounded bg-red-500 px-4 py-2 text-white transition-colors hover:bg-red-600"
          >
            Logout
          </button>
        </form>
      </div>
    </header>
  );
}
