'use client';

import { useEffect, useRef } from 'react';
import { useFormState } from 'react-dom';
import { createTaskAction } from '@/actions/tasks';
import type { Employee } from '@/lib/types';
import FormError from './FormError';
import ResponsiblesPicker from './ResponsiblesPicker';
import SubmitButton from './SubmitButton';

// Formulário para criar tarefa (qualquer membro)
export default function CreateTaskForm({ employees }: { employees: Employee[] }) {
  const [state, formAction] = useFormState(createTaskAction, {});
  const formRef = useRef<HTMLFormElement>(null);

  // Limpa o formulário após criar a tarefa
  useEffect(() => {
    if (state.ok) formRef.current?.reset();
  }, [state]);

  return (
    <form ref={formRef} action={formAction} className="flex flex-col gap-2 rounded border p-4">
      <h3 className="font-semibold">Nova tarefa</h3>

      <label htmlFor="new-task-name" className="text-sm font-medium">
        Nome
      </label>
      <input
        id="new-task-name"
        name="taskName"
        type="text"
        required
        className="rounded border px-2 py-1 text-sm"
      />

      <label htmlFor="new-task-description" className="text-sm font-medium">
        Descrição
      </label>
      <textarea
        id="new-task-description"
        name="description"
        rows={2}
        className="rounded border px-2 py-1 text-sm"
      />

      <ResponsiblesPicker employees={employees} idPrefix="new-task" />
      <p className="text-xs text-gray-500">Sem responsáveis selecionados, você será o responsável principal.</p>

      <div>
        <SubmitButton pendingText="Criando...">Criar tarefa</SubmitButton>
      </div>
      <FormError message={state.error} />
    </form>
  );
}
