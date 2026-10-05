'use client';

import { useState } from 'react';
import Link from 'next/link';
import { LuFolderKanban, LuPencil, LuPlus, LuUsers } from 'react-icons/lu';
import { deleteProjectAction } from '@/actions/projects';
import { dashboardHref } from '@/lib/dashboard-url';
import { plural } from '@/lib/format';
import type { ProjectItem, Team } from '@/lib/types';
import Badge from '@/components/ui/Badge';
import { buttonStyles, textLinkStyles } from '@/components/ui/Button';
import EmptyState from '@/components/ui/EmptyState';
import ProgressBar from '@/components/ui/ProgressBar';
import ConfirmActionForm from './ConfirmActionForm';
import ProjectFormModal from './ProjectFormModal';

type ProjectsWorkspaceProps = {
  projects: ProjectItem[];
  teams: Team[];
  isLeader: boolean;
};

type ProjectModal = { type: 'create' } | { type: 'edit'; project: ProjectItem };

// Projetos: progresso de cada um pelas tarefas concluídas; o líder cria e edita em janela modal
export default function ProjectsWorkspace({ projects, teams, isLeader }: ProjectsWorkspaceProps) {
  const [modal, setModal] = useState<ProjectModal | null>(null);

  const newProjectButton = (label: string) => (
    <button type="button" onClick={() => setModal({ type: 'create' })} className={buttonStyles()}>
      <LuPlus aria-hidden="true" className="h-4 w-4" />
      {label}
    </button>
  );

  return (
    <section aria-labelledby="projects-title" className="flex flex-col gap-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h1 id="projects-title" className="text-2xl font-bold tracking-tight text-slate-900">
            Projetos
          </h1>
          <p className="mt-1 text-sm text-slate-600">{plural(projects.length, 'projeto', 'projetos')}</p>
        </div>
        {isLeader && newProjectButton('Novo projeto')}
      </div>

      {projects.length > 0 && <h2 className="sr-only">Lista de projetos</h2>}

      {projects.length === 0 ? (
        <EmptyState
          icon={<LuFolderKanban aria-hidden="true" className="h-5 w-5" />}
          title="Nenhum projeto por aqui ainda"
          description={
            isLeader
              ? 'Crie um projeto para agrupar tarefas, acompanhar o progresso e indicar a equipe responsável.'
              : 'O líder da empresa pode criar projetos para agrupar as tarefas.'
          }
        >
          {isLeader && newProjectButton('Criar o primeiro projeto')}
        </EmptyState>
      ) : (
        <ul className="grid grid-cols-[minmax(0,1fr)] gap-4 md:grid-cols-2 xl:grid-cols-3">
          {projects.map(project => {
            const { progress } = project;
            const percent = progress.total > 0 ? Math.round((progress.done / progress.total) * 100) : 0;

            return (
              <li
                key={project.projectId}
                className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition-colors hover:border-slate-300"
              >
                <div className="flex items-start gap-3">
                  <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-brand-600">
                    <LuFolderKanban aria-hidden="true" className="h-5 w-5" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <h3 className="break-words font-semibold text-slate-900">{project.name}</h3>
                    {project.team ? (
                      <p className="mt-0.5 flex items-center gap-1 text-xs text-slate-500">
                        <LuUsers aria-hidden="true" className="h-3.5 w-3.5 shrink-0" />
                        <span className="min-w-0 truncate">Equipe: {project.team.name}</span>
                      </p>
                    ) : (
                      <p className="mt-0.5 text-xs text-slate-500">Sem equipe</p>
                    )}
                  </div>
                </div>

                {project.description && (
                  <p className="whitespace-pre-line break-words text-sm text-slate-600">{project.description}</p>
                )}

                <div className="flex flex-col gap-1.5">
                  <div className="flex items-center justify-between gap-2 text-xs text-slate-500">
                    <span>
                      {progress.total === 0
                        ? 'Nenhuma tarefa'
                        : `${progress.done} de ${plural(progress.total, 'tarefa', 'tarefas')} concluída${progress.done === 1 ? '' : 's'}`}
                    </span>
                    <span className="font-medium text-slate-700">{percent}%</span>
                  </div>
                  <ProgressBar value={progress.done} max={progress.total} label={`Progresso do projeto ${project.name}`} />
                </div>

                <ul aria-label="Tarefas por status" className="flex flex-wrap gap-1.5">
                  <li>
                    <Badge tone="pending">Pendentes: {progress.byStatus.pendente}</Badge>
                  </li>
                  <li>
                    <Badge tone="progress">Em andamento: {progress.byStatus.em_andamento}</Badge>
                  </li>
                  <li>
                    <Badge tone="done">Concluídas: {progress.byStatus.concluida}</Badge>
                  </li>
                </ul>

                <div className="mt-auto flex flex-wrap items-start justify-between gap-2 border-t border-slate-100 pt-3">
                  <Link
                    href={dashboardHref({ view: 'tarefas', project: project.projectId })}
                    aria-label={`Ver as tarefas do projeto ${project.name}`}
                    className={`inline-flex h-8 items-center text-sm ${textLinkStyles}`}
                  >
                    Ver tarefas
                  </Link>
                  {isLeader && (
                    <div className="flex flex-wrap items-start justify-end gap-1">
                      <button
                        type="button"
                        onClick={() => setModal({ type: 'edit', project })}
                        aria-label={`Editar o projeto ${project.name}`}
                        className={buttonStyles({ variant: 'ghost', size: 'sm' })}
                      >
                        <LuPencil aria-hidden="true" className="h-3.5 w-3.5" />
                        Editar
                      </button>
                      <ConfirmActionForm
                        action={deleteProjectAction}
                        fields={{ projectId: project.projectId }}
                        label="Excluir"
                        confirmLabel="Confirmar exclusão"
                        accessibleLabel={`Excluir o projeto ${project.name}`}
                      />
                    </div>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}

      {modal && (
        <ProjectFormModal
          key={modal.type === 'edit' ? modal.project.projectId : 'new'}
          project={modal.type === 'edit' ? modal.project : undefined}
          teams={teams}
          onClose={() => setModal(null)}
        />
      )}
    </section>
  );
}
