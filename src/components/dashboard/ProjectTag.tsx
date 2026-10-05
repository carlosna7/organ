import Link from 'next/link';
import { LuFolderKanban } from 'react-icons/lu';
import { dashboardHref } from '@/lib/dashboard-url';
import type { Project } from '@/lib/types';

// Etiqueta com o projeto da tarefa; leva às tarefas desse projeto
export default function ProjectTag({ project }: { project: Pick<Project, 'projectId' | 'name'> }) {
  return (
    <Link
      href={dashboardHref({ view: 'tarefas', project: project.projectId })}
      aria-label={`Ver as tarefas do projeto ${project.name}`}
      // Sem arrastar o link nativo: no kanban o card inteiro é arrastável
      draggable={false}
      className="inline-flex max-w-full items-center gap-1.5 self-start rounded-md bg-brand-50 px-2 py-0.5 text-xs font-medium text-brand-700 transition-colors hover:bg-brand-100"
    >
      <LuFolderKanban aria-hidden="true" className="h-3.5 w-3.5 shrink-0" />
      <span className="min-w-0 truncate">{project.name}</span>
    </Link>
  );
}
