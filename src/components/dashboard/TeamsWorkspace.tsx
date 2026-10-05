'use client';

import { useState } from 'react';
import Link from 'next/link';
import { LuFolderKanban, LuPencil, LuPlus, LuUsers } from 'react-icons/lu';
import { deleteTeamAction } from '@/actions/teams';
import { dashboardHref } from '@/lib/dashboard-url';
import { plural } from '@/lib/format';
import type { Employee, Project, Team } from '@/lib/types';
import Avatar from '@/components/ui/Avatar';
import { buttonStyles } from '@/components/ui/Button';
import EmptyState from '@/components/ui/EmptyState';
import ConfirmActionForm from './ConfirmActionForm';
import TeamFormModal from './TeamFormModal';

// Quantos membros aparecem no card antes de virar "+N"
const MAX_VISIBLE_MEMBERS = 5;

type TeamsWorkspaceProps = {
  teams: Team[];
  projects: Project[];
  // Funcionários registrados (só eles podem entrar numa equipe)
  employees: Employee[];
  isLeader: boolean;
};

type TeamModal = { type: 'create' } | { type: 'edit'; team: Team };

// Equipes: membros e projetos de cada uma; o líder cria e edita em janela modal
export default function TeamsWorkspace({ teams, projects, employees, isLeader }: TeamsWorkspaceProps) {
  const [modal, setModal] = useState<TeamModal | null>(null);

  const newTeamButton = (label: string) => (
    <button type="button" onClick={() => setModal({ type: 'create' })} className={buttonStyles()}>
      <LuPlus aria-hidden="true" className="h-4 w-4" />
      {label}
    </button>
  );

  return (
    <section aria-labelledby="teams-title" className="flex flex-col gap-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h1 id="teams-title" className="text-2xl font-bold tracking-tight text-slate-900">
            Equipes
          </h1>
          <p className="mt-1 text-sm text-slate-600">{plural(teams.length, 'equipe', 'equipes')}</p>
        </div>
        {isLeader && newTeamButton('Nova equipe')}
      </div>

      {teams.length > 0 && <h2 className="sr-only">Lista de equipes</h2>}

      {teams.length === 0 ? (
        <EmptyState
          icon={<LuUsers aria-hidden="true" className="h-5 w-5" />}
          title="Nenhuma equipe por aqui ainda"
          description={
            isLeader
              ? 'Monte equipes com os membros da empresa e indique qual delas cuida de cada projeto.'
              : 'O líder da empresa pode montar equipes com os membros.'
          }
        >
          {isLeader && newTeamButton('Criar a primeira equipe')}
        </EmptyState>
      ) : (
        <ul className="grid grid-cols-[minmax(0,1fr)] gap-4 md:grid-cols-2 xl:grid-cols-3">
          {teams.map(team => {
            const teamProjects = projects.filter(project => project.team?.teamId === team.teamId);
            const visibleMembers = team.members.slice(0, MAX_VISIBLE_MEMBERS);
            const hiddenMembers = team.members.length - visibleMembers.length;

            return (
              <li
                key={team.teamId}
                className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition-colors hover:border-slate-300"
              >
                <div className="flex items-start gap-3">
                  <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-brand-600">
                    <LuUsers aria-hidden="true" className="h-5 w-5" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <h3 className="break-words font-semibold text-slate-900">{team.name}</h3>
                    <p className="mt-0.5 text-xs text-slate-500">{plural(team.members.length, 'membro', 'membros')}</p>
                  </div>
                </div>

                {team.description && (
                  <p className="whitespace-pre-line break-words text-sm text-slate-600">{team.description}</p>
                )}

                {team.members.length === 0 ? (
                  <p className="text-sm text-slate-500">Nenhum membro nesta equipe.</p>
                ) : (
                  <ul aria-label={`Membros da equipe ${team.name}`} className="flex flex-col gap-2">
                    {visibleMembers.map(member => {
                      const displayName = member.name ?? member.email;

                      return (
                        <li key={member.employeeId} className="flex items-center gap-2 text-sm">
                          <Avatar name={displayName} size="sm" />
                          <span className="min-w-0 truncate">
                            <span className="font-medium text-slate-800">{displayName}</span>
                            {member.position && <span className="text-slate-500"> · {member.position}</span>}
                          </span>
                        </li>
                      );
                    })}
                    {hiddenMembers > 0 && (
                      <li className="text-xs text-slate-500">e mais {plural(hiddenMembers, 'pessoa', 'pessoas')}</li>
                    )}
                  </ul>
                )}

                {teamProjects.length > 0 && (
                  <div className="flex flex-col gap-1.5">
                    <h4 className="text-xs font-semibold uppercase tracking-wide text-slate-500">Projetos</h4>
                    <ul aria-label={`Projetos da equipe ${team.name}`} className="flex flex-wrap gap-1.5">
                      {teamProjects.map(project => (
                        <li key={project.projectId} className="max-w-full">
                          <Link
                            href={dashboardHref({ view: 'tarefas', project: project.projectId })}
                            aria-label={`Ver as tarefas do projeto ${project.name}`}
                            className="inline-flex max-w-full items-center gap-1.5 rounded-md bg-brand-50 px-2 py-0.5 text-xs font-medium text-brand-700 transition-colors hover:bg-brand-100"
                          >
                            <LuFolderKanban aria-hidden="true" className="h-3.5 w-3.5 shrink-0" />
                            <span className="min-w-0 truncate">{project.name}</span>
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {isLeader && (
                  <div className="mt-auto flex flex-wrap items-start justify-end gap-1 border-t border-slate-100 pt-3">
                    <button
                      type="button"
                      onClick={() => setModal({ type: 'edit', team })}
                      aria-label={`Editar a equipe ${team.name}`}
                      className={buttonStyles({ variant: 'ghost', size: 'sm' })}
                    >
                      <LuPencil aria-hidden="true" className="h-3.5 w-3.5" />
                      Editar
                    </button>
                    <ConfirmActionForm
                      action={deleteTeamAction}
                      fields={{ teamId: team.teamId }}
                      label="Excluir"
                      confirmLabel="Confirmar exclusão"
                      accessibleLabel={`Excluir a equipe ${team.name}`}
                    />
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}

      {modal && (
        <TeamFormModal
          key={modal.type === 'edit' ? modal.team.teamId : 'new'}
          team={modal.type === 'edit' ? modal.team : undefined}
          employees={employees}
          onClose={() => setModal(null)}
        />
      )}
    </section>
  );
}
