'use client';

import { useEffect, useState } from 'react';
import { useFormState } from 'react-dom';
import { updateTaskAction } from '@/actions/tasks';
import type { Employee, Task } from '@/lib/types';
import FormError from './FormError';
import ResponsiblesPicker from './ResponsiblesPicker';
import SubmitButton from './SubmitButton';

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
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="rounded px-3 py-1 text-sm text-blue-700 hover:bg-blue-50"
      >
        Editar
      </button>
    );
  }

  // Níveis atuais dos responsáveis para pré-selecionar
  const selected: Record<number, number> = {};
  for (const responsible of task.responsibles) {
    if (responsible.employee) selected[responsible.employee.employeeId] = responsible.leadershipLevel;
  }

  return (
    <form action={formAction} className="mt-2 flex w-full flex-col gap-2 rounded border bg-gray-50 p-3">
      <input type="hidden" name="taskId" value={task.taskId} />

      <label htmlFor={`edit-task-${task.taskId}-name`} className="text-sm font-medium">
        Nome
      </label>
      <input
        id={`edit-task-${task.taskId}-name`}
        name="taskName"
        type="text"
        defaultValue={task.taskName}
        required
        className="rounded border px-2 py-1 text-sm"
      />

      <label htmlFor={`edit-task-${task.taskId}-description`} className="text-sm font-medium">
        Descrição
      </label>
      <textarea
        id={`edit-task-${task.taskId}-description`}
        name="description"
        rows={2}
        defaultValue={task.description ?? ''}
        className="rounded border px-2 py-1 text-sm"
      />

      <ResponsiblesPicker employees={employees} selected={selected} idPrefix={`edit-task-${task.taskId}`} />

      <div className="flex gap-2">
        <SubmitButton pendingText="Salvando...">Salvar</SubmitButton>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="rounded px-3 py-1 text-sm hover:bg-gray-100"
        >
          Cancelar
        </button>
      </div>
      <FormError message={state.error} />
    </form>
  );
}
