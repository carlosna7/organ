'use client';

import { useState } from 'react';
import { LuFolderPlus, LuPlus, LuUserPlus, LuUsers } from 'react-icons/lu';
import type { Employee, Project, Team } from '@/lib/types';
import { buttonStyles } from '@/components/ui/Button';
import InviteModal from './InviteModal';
import ProjectFormModal from './ProjectFormModal';
import TaskFormModal from './TaskFormModal';
import TeamFormModal from './TeamFormModal';

type QuickActionsProps = {
  // Funcionários registrados (responsáveis das tarefas e membros das equipes)
  employees: Employee[];
  projects: Project[];
  teams: Team[];
  isLeader: boolean;
};

type QuickModal = 'task' | 'project' | 'team' | 'invite';

// Atalhos do resumo para cadastrar tarefa (todos) e projeto, equipe e convite (só líder)
export default function QuickActions({ employees, projects, teams, isLeader }: QuickActionsProps) {
  const [modal, setModal] = useState<QuickModal | null>(null);
  const close = () => setModal(null);

  return (
    <>
      <div className="flex flex-wrap gap-2">
        <button type="button" onClick={() => setModal('task')} className={buttonStyles()}>
          <LuPlus aria-hidden="true" className="h-4 w-4" />
          Nova tarefa
        </button>
        {isLeader && (
          <>
            <button type="button" onClick={() => setModal('project')} className={buttonStyles({ variant: 'secondary' })}>
              <LuFolderPlus aria-hidden="true" className="h-4 w-4" />
              Novo projeto
            </button>
            <button type="button" onClick={() => setModal('team')} className={buttonStyles({ variant: 'secondary' })}>
              <LuUsers aria-hidden="true" className="h-4 w-4" />
              Nova equipe
            </button>
            <button type="button" onClick={() => setModal('invite')} className={buttonStyles({ variant: 'secondary' })}>
              <LuUserPlus aria-hidden="true" className="h-4 w-4" />
              Convidar membro
            </button>
          </>
        )}
      </div>

      {modal === 'task' && <TaskFormModal employees={employees} projects={projects} onClose={close} />}
      {modal === 'project' && <ProjectFormModal teams={teams} onClose={close} />}
      {modal === 'team' && <TeamFormModal employees={employees} onClose={close} />}
      {modal === 'invite' && <InviteModal onClose={close} />}
    </>
  );
}
