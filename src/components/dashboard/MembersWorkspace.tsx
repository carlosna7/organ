'use client';

import { useState } from 'react';
import { LuMailPlus, LuUserPlus } from 'react-icons/lu';
import { removeEmployeeAction } from '@/actions/team';
import { plural } from '@/lib/format';
import type { Employee, Team } from '@/lib/types';
import { ROLE_LABELS } from '@/lib/types';
import Avatar from '@/components/ui/Avatar';
import Badge from '@/components/ui/Badge';
import { buttonStyles } from '@/components/ui/Button';
import Card, { CardHeader } from '@/components/ui/Card';
import ConfirmActionForm from './ConfirmActionForm';
import InviteModal from './InviteModal';

type MembersWorkspaceProps = {
  employees: Employee[];
  teams: Team[];
  me: Employee;
};

// Membros da empresa: registrados, convites pendentes e gestão do líder
export default function MembersWorkspace({ employees, teams, me }: MembersWorkspaceProps) {
  const [inviting, setInviting] = useState(false);

  const isLeader = me.role === 'leader';
  const members = employees.filter(employee => employee.isRegistered);
  const invites = employees.filter(employee => !employee.isRegistered);

  // Líder pode remover qualquer um, menos a si mesmo
  const canRemove = (employee: Employee) => isLeader && employee.employeeId !== me.employeeId;

  return (
    <section aria-labelledby="members-title" className="flex flex-col gap-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h1 id="members-title" className="text-2xl font-bold tracking-tight text-slate-900">
            Membros
          </h1>
          <p className="mt-1 text-sm text-slate-600">{plural(members.length, 'membro', 'membros')}</p>
        </div>
        {isLeader && (
          <button type="button" onClick={() => setInviting(true)} className={buttonStyles()}>
            <LuUserPlus aria-hidden="true" className="h-4 w-4" />
            Convidar membro
          </button>
        )}
      </div>

      <div className="grid grid-cols-[minmax(0,1fr)] items-start gap-6 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
        <Card>
          <CardHeader title={`Membros (${members.length})`} />
          <ul className="flex flex-col divide-y divide-slate-100 px-4 sm:px-5">
            {members.map(employee => {
              const displayName = employee.name ?? employee.email;
              const isMe = employee.employeeId === me.employeeId;
              const memberTeams = teams.filter(team => team.members.some(member => member.employeeId === employee.employeeId));

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
                    {memberTeams.length > 0 && (
                      <ul aria-label="Equipes" className="mt-1.5 flex flex-wrap gap-1">
                        {memberTeams.map(team => (
                          <li key={team.teamId} className="max-w-full">
                            <Badge className="max-w-full">
                              <span className="truncate">{team.name}</span>
                            </Badge>
                          </li>
                        ))}
                      </ul>
                    )}
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
        </Card>

        <Card>
          <CardHeader title={`Convites pendentes (${invites.length})`} />
          <div className="p-4 sm:p-5">
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
                  <li key={employee.employeeId} className="flex flex-wrap items-center justify-between gap-2 py-3 first:pt-0 last:pb-0">
                    <div className="flex min-w-0 flex-wrap items-center gap-2">
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
        </Card>
      </div>

      {inviting && <InviteModal onClose={() => setInviting(false)} />}
    </section>
  );
}
