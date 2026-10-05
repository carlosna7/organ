import { LuMailPlus, LuUsers } from 'react-icons/lu';
import { removeEmployeeAction } from '@/actions/team';
import type { Employee } from '@/lib/types';
import { ROLE_LABELS } from '@/lib/types';
import Avatar from '@/components/ui/Avatar';
import Badge from '@/components/ui/Badge';
import Card, { CardHeader } from '@/components/ui/Card';
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
    <Card as="section" aria-labelledby="team-title">
      <CardHeader
        titleId="team-title"
        title="Equipe"
        description={`${members.length} ${members.length === 1 ? 'membro' : 'membros'}`}
        icon={<LuUsers aria-hidden="true" className="h-5 w-5" />}
      />

      <div className="flex flex-col gap-6 p-4 sm:p-5">
        {isLeader && <InviteForm />}

        <div>
          <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
            Membros ({members.length})
          </h3>
          <ul className="flex flex-col divide-y divide-slate-100">
            {members.map(employee => {
              const displayName = employee.name ?? employee.email;
              const isMe = employee.employeeId === me.employeeId;

              return (
                <li key={employee.employeeId} className="flex flex-wrap items-center justify-end gap-3 py-3">
                  <Avatar name={displayName} />
                  <div className="min-w-[10rem] flex-1">
                    <p className="flex flex-wrap items-center gap-x-2 gap-y-1 font-medium text-slate-900">
                      <span className="truncate">{displayName}</span>
                      {isMe && <span className="text-xs font-normal text-slate-500">(você)</span>}
                      <Badge tone={employee.role === 'leader' ? 'brand' : 'neutral'}>{ROLE_LABELS[employee.role]}</Badge>
                    </p>
                    {employee.position && <p className="truncate text-sm text-slate-600">{employee.position}</p>}
                    <p className="truncate text-xs text-slate-500">{employee.email}</p>
                  </div>
                  {canRemove(employee) && (
                    <ConfirmActionForm
                      action={removeEmployeeAction}
                      fields={{ employeeId: employee.employeeId }}
                      label="Remover"
                      confirmLabel="Confirmar remoção"
                      accessibleLabel={`Remover ${displayName}`}
                      confirmAccessibleLabel={`Confirmar remoção de ${displayName}`}
                    />
                  )}
                </li>
              );
            })}
          </ul>
        </div>

        <div>
          <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
            Convites pendentes ({invites.length})
          </h3>
          {invites.length === 0 ? (
            <div className="flex items-center gap-3 rounded-xl border border-dashed border-slate-300 px-4 py-4 text-sm text-slate-500">
              <LuMailPlus aria-hidden="true" className="h-5 w-5 shrink-0 text-slate-400" />
              <p>
                Nenhum convite pendente.
                {isLeader && ' Convide alguém pelo email para montar a equipe.'}
              </p>
            </div>
          ) : (
            <ul className="flex flex-col divide-y divide-slate-100">
              {invites.map(employee => (
                <li key={employee.employeeId} className="flex flex-wrap items-center justify-between gap-2 py-3">
                  <div className="flex min-w-0 items-center gap-2">
                    <p className="truncate text-sm text-slate-700">{employee.email}</p>
                    <Badge tone="pending">Aguardando cadastro</Badge>
                  </div>
                  {canRemove(employee) && (
                    <ConfirmActionForm
                      action={removeEmployeeAction}
                      fields={{ employeeId: employee.employeeId }}
                      label="Cancelar convite"
                      confirmLabel="Cancelar convite"
                      cancelLabel="Manter convite"
                      accessibleLabel={`Cancelar convite de ${employee.email}`}
                      confirmAccessibleLabel={`Cancelar convite de ${employee.email}`}
                    />
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </Card>
  );
}
