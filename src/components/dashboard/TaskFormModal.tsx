'use client';

import { createTaskAction, updateTaskAction } from '@/actions/tasks';
import type { Employee, Project, TaskItem } from '@/lib/types';
import Input, { Select, Textarea } from '@/components/ui/Input';
import ModalForm from './ModalForm';
import ResponsiblesPicker from './ResponsiblesPicker';

type TaskFormModalProps = {
  // Com a tarefa, edita; sem ela, cria
  task?: TaskItem;
  // Funcionários registrados (só eles podem ser responsáveis)
  employees: Employee[];
  projects: Pick<Project, 'projectId' | 'name'>[];
  onClose: () => void;
};

// Janela para criar uma tarefa (qualquer membro) ou editá-la (só líder)
export default function TaskFormModal({ task, employees, projects, onClose }: TaskFormModalProps) {
  const isEdit = task !== undefined;
  const idPrefix = isEdit ? `edit-task-${task.taskId}` : 'new-task';

  // Níveis atuais dos responsáveis para pré-selecionar
  const selected: Record<number, number> = {};
  for (const responsible of task?.responsibles ?? []) {
    if (responsible.employee) selected[responsible.employee.employeeId] = responsible.leadershipLevel;
  }

  return (
    <ModalForm
      title={isEdit ? 'Editar tarefa' : 'Nova tarefa'}
      description={isEdit ? `#${task.taskId} ${task.taskName}` : undefined}
      action={isEdit ? updateTaskAction : createTaskAction}
      submitLabel={isEdit ? 'Salvar' : 'Criar tarefa'}
      pendingText={isEdit ? 'Salvando...' : 'Criando...'}
      onClose={onClose}
    >
      {isEdit && <input type="hidden" name="taskId" value={task.taskId} />}

      <Input
        id={`${idPrefix}-name`}
        name="taskName"
        type="text"
        label="Nome da tarefa"
        defaultValue={task?.taskName}
        required
      />

      <Textarea
        id={`${idPrefix}-description`}
        name="description"
        rows={3}
        label={isEdit ? 'Descrição' : 'Descrição (opcional)'}
        defaultValue={task?.description ?? ''}
      />

      {projects.length > 0 && (
        <Select id={`${idPrefix}-project`} name="projectId" label="Projeto" defaultValue={task?.project?.projectId ?? ''}>
          <option value="">Sem projeto</option>
          {projects.map(project => (
            <option key={project.projectId} value={project.projectId}>
              {project.name}
            </option>
          ))}
        </Select>
      )}

      <div className="flex flex-col gap-1.5">
        <ResponsiblesPicker employees={employees} selected={selected} idPrefix={idPrefix} />
        {!isEdit && (
          <p className="text-xs text-slate-500">Sem responsáveis selecionados, você será o responsável principal.</p>
        )}
      </div>
    </ModalForm>
  );
}
