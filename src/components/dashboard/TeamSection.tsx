import { removeEmployeeAction } from '@/actions/team';
import type { Employee } from '@/lib/types';
import { ROLE_LABELS } from '@/lib/types';
import ConfirmActionForm from './ConfirmActionForm';
import InviteForm from './InviteForm';

type TeamSectionProps = {
  employees: Employee[];
  me: Employee;
};

// Equipe: membros registrados, convites pendentes e gestão do líder
export default function TeamSection({ employees, me }: TeamSectionProps) {
  const isLeader = me.role === 'leader';
  const members = employees.filter(employee => employee.isRegistered);
  const invites = employees.filter(employee => !employee.isRegistered);

  // Líder pode remover qualquer um, menos a si mesmo
  const canRemove = (employee: Employee) => isLeader && employee.employeeId !== me.employeeId;

  return (
    <section className="flex flex-col gap-4 rounded border bg-white p-4">
      <h2 className="text-lg font-semibold">Equipe</h2>

      {isLeader && <InviteForm />}

      <div>
        <h3 className="mb-2 text-sm font-medium text-gray-600">Membros ({members.length})</h3>
        <ul className="flex flex-col divide-y">
          {members.map(employee => (
            <li key={employee.employeeId} className="flex items-start justify-between gap-2 py-2">
              <div>
                <p className="font-medium">
                  {employee.name}
                  {employee.employeeId === me.employeeId && <span className="text-gray-500"> (você)</span>}
                </p>
                <p className="text-sm text-gray-600">
                  {employee.position} · {ROLE_LABELS[employee.role]}
                </p>
                <p className="text-xs text-gray-500">{employee.email}</p>
              </div>
              {canRemove(employee) && (
                <ConfirmActionForm
                  action={removeEmployeeAction}
                  fields={{ employeeId: employee.employeeId }}
                  label="Remover"
                  confirmLabel="Confirmar remoção"
                />
              )}
            </li>
          ))}
        </ul>
      </div>

      <div>
        <h3 className="mb-2 text-sm font-medium text-gray-600">Convites pendentes ({invites.length})</h3>
        {invites.length === 0 ? (
          <p className="text-sm text-gray-500">Nenhum convite pendente.</p>
        ) : (
          <ul className="flex flex-col divide-y">
            {invites.map(employee => (
              <li key={employee.employeeId} className="flex items-center justify-between gap-2 py-2">
                <p className="text-sm">{employee.email}</p>
                {canRemove(employee) && (
                  <ConfirmActionForm
                    action={removeEmployeeAction}
                    fields={{ employeeId: employee.employeeId }}
                    label="Cancelar convite"
                    confirmLabel="Confirmar"
                  />
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
