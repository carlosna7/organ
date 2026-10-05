'use client';

import { useEffect, useState } from 'react';
import { useFormState } from 'react-dom';
import { LuPencil } from 'react-icons/lu';
import { updateTaskAction } from '@/actions/tasks';
import type { Employee, Task } from '@/lib/types';
import Button from '@/components/ui/Button';
import Input, { Textarea } from '@/components/ui/Input';
import SubmitButton from '@/components/ui/SubmitButton';
import FormError from './FormError';
import ResponsiblesPicker from './ResponsiblesPicker';

type TaskEditFormProps = {
  task: Task;
  employees: Employee[];
};

// Edição de nome, descrição e responsáveis (só líder)
export default function TaskEditForm({ task, employees }: TaskEditFormProps) {
  const [state, formAction] = useFormState(updateTaskAction, {});
  const [open, setOpen] = useState(false);

  // Fecha o formulário após salvar
  useEffect(() => {
    if (state.ok) setOpen(false);
  }, [state]);

  if (!open) {
    return (
      <Button variant="ghost" size="sm" onClick={() => setOpen(true)} aria-label={`Editar a tarefa ${task.taskName}`}>
        <LuPencil aria-hidden="true" className="h-3.5 w-3.5" />
        Editar
      </Button>
    );
  }

  // Níveis atuais dos responsáveis para pré-selecionar
  const selected: Record<number, number> = {};
  for (const responsible of task.responsibles) {
    if (responsible.employee) selected[responsible.employee.employeeId] = responsible.leadershipLevel;
  }

  return (
    <form
      action={formAction}
      data-edit-form
      aria-label={`Editar a tarefa ${task.taskName}`}
      className="flex w-full flex-col gap-4 rounded-xl border border-slate-200 bg-slate-50 p-4"
    >
      <input type="hidden" name="taskId" value={task.taskId} />

      <Input
        id={`edit-task-${task.taskId}-name`}
        name="taskName"
        type="text"
        label="Nome da tarefa"
        defaultValue={task.taskName}
        required
      />

      <Textarea
        id={`edit-task-${task.taskId}-description`}
        name="description"
        rows={2}
        label="Descrição"
        defaultValue={task.description ?? ''}
      />

      <ResponsiblesPicker employees={employees} selected={selected} idPrefix={`edit-task-${task.taskId}`} />

      <FormError message={state.error} />

      <div className="flex flex-wrap gap-2">
        <SubmitButton size="sm" pendingText="Salvando...">
          Salvar
        </SubmitButton>
        <Button variant="ghost" size="sm" onClick={() => setOpen(false)}>
          Cancelar
        </Button>
      </div>
    </form>
  );
}
