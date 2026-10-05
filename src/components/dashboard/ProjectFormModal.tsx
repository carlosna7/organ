'use client';

import { createProjectAction, updateProjectAction } from '@/actions/projects';
import type { Project, Team } from '@/lib/types';
import Input, { Select, Textarea } from '@/components/ui/Input';
import ModalForm from './ModalForm';

type ProjectFormModalProps = {
  // Com o projeto, edita; sem ele, cria
  project?: Project;
  teams: Pick<Team, 'teamId' | 'name'>[];
  onClose: () => void;
};

// Janela para criar ou editar um projeto (só líder)
export default function ProjectFormModal({ project, teams, onClose }: ProjectFormModalProps) {
  const isEdit = project !== undefined;
  const idPrefix = isEdit ? `edit-project-${project.projectId}` : 'new-project';

  return (
    <ModalForm
      title={isEdit ? 'Editar projeto' : 'Novo projeto'}
      description={isEdit ? project.name : undefined}
      action={isEdit ? updateProjectAction : createProjectAction}
      submitLabel={isEdit ? 'Salvar' : 'Criar projeto'}
      pendingText={isEdit ? 'Salvando...' : 'Criando...'}
      onClose={onClose}
    >
      {isEdit && <input type="hidden" name="projectId" value={project.projectId} />}

      <Input
        id={`${idPrefix}-name`}
        name="name"
        type="text"
        label="Nome do projeto"
        defaultValue={project?.name}
        required
      />

      <Textarea
        id={`${idPrefix}-description`}
        name="description"
        rows={3}
        label="Descrição (opcional)"
        defaultValue={project?.description ?? ''}
      />

      {teams.length > 0 && (
        <Select
          id={`${idPrefix}-team`}
          name="teamId"
          label="Equipe responsável"
          defaultValue={project?.team?.teamId ?? ''}
        >
          <option value="">Sem equipe</option>
          {teams.map(team => (
            <option key={team.teamId} value={team.teamId}>
              {team.name}
            </option>
          ))}
        </Select>
      )}
    </ModalForm>
  );
}
