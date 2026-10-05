'use client';

import { useCallback, useEffect, useRef, useState, type RefObject } from 'react';
import { useFormState } from 'react-dom';
import { LuPencil } from 'react-icons/lu';
import { updateTaskAction } from '@/actions/tasks';
import type { Employee, Task } from '@/lib/types';
import Button, { buttonStyles } from '@/components/ui/Button';
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
  const [open, setOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const formRef = useRef<HTMLFormElement>(null);
  // Só move o foco depois de uma ação do usuário (nunca na renderização inicial)
  const moveFocus = useRef(false);

  // Abrir leva o foco ao primeiro campo; fechar devolve ao botão "Editar"
  useEffect(() => {
    if (!moveFocus.current) return;
    moveFocus.current = false;
    if (open) {
      formRef.current?.querySelector<HTMLInputElement>('input[name="taskName"]')?.focus();
    } else {
      triggerRef.current?.focus();
    }
  }, [open]);

  const toggle = (next: boolean) => {
    moveFocus.current = true;
    setOpen(next);
  };

  // Identidade estável: o efeito do subcomponente não reexecuta a cada render do pai
  const close = useCallback(() => {
    moveFocus.current = true;
    setOpen(false);
  }, []);

  if (!open) {
    return (
      <button
        ref={triggerRef}
        type="button"
        onClick={() => toggle(true)}
        aria-label={`Editar a tarefa ${task.taskName}`}
        className={buttonStyles({ variant: 'ghost', size: 'sm' })}
      >
        <LuPencil aria-hidden="true" className="h-3.5 w-3.5" />
        Editar
      </button>
    );
  }

  return (
    <TaskEditFormFields
      task={task}
      employees={employees}
      formRef={formRef}
      onSaved={close}
      onCancel={close}
    />
  );
}

type TaskEditFormFieldsProps = TaskEditFormProps & {
  formRef: RefObject<HTMLFormElement>;
  onSaved: () => void;
  onCancel: () => void;
};

// Formulário aberto: o useFormState vive aqui (e some ao fechar), então o erro da tentativa anterior não volta ao reabrir
function TaskEditFormFields({ task, employees, formRef, onSaved, onCancel }: TaskEditFormFieldsProps) {
  const [state, formAction] = useFormState(updateTaskAction, {});

  // Fecha o formulário após salvar
  useEffect(() => {
    if (state.ok) onSaved();
  }, [state, onSaved]);

  // Níveis atuais dos responsáveis para pré-selecionar
  const selected: Record<number, number> = {};
  for (const responsible of task.responsibles) {
    if (responsible.employee) selected[responsible.employee.employeeId] = responsible.leadershipLevel;
  }

  return (
    <form
      ref={formRef}
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
        <Button variant="ghost" size="sm" onClick={onCancel}>
          Cancelar
        </Button>
      </div>
    </form>
  );
}
