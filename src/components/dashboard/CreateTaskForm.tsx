'use client';

import { useEffect, useRef, useState, type RefObject } from 'react';
import { useFormState } from 'react-dom';
import { LuPlus } from 'react-icons/lu';
import { createTaskAction } from '@/actions/tasks';
import type { Employee } from '@/lib/types';
import Button, { buttonStyles } from '@/components/ui/Button';
import Input, { Textarea } from '@/components/ui/Input';
import SubmitButton from '@/components/ui/SubmitButton';
import FormError from './FormError';
import ResponsiblesPicker from './ResponsiblesPicker';

type CreateTaskFormProps = {
  employees: Employee[];
  // Começa aberto (ex.: quando ainda não há tarefas)
  defaultOpen?: boolean;
};

// Formulário para criar tarefa (qualquer membro)
export default function CreateTaskForm({ employees, defaultOpen = false }: CreateTaskFormProps) {
  const [open, setOpen] = useState(defaultOpen);
  const formRef = useRef<HTMLFormElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  // Só move o foco depois de uma ação do usuário (o formulário que já começa aberto não rouba o foco)
  const moveFocus = useRef(false);

  // Abrir leva o foco ao primeiro campo; fechar devolve ao botão "Nova tarefa"
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

  if (!open) {
    return (
      <div>
        <button ref={triggerRef} type="button" onClick={() => toggle(true)} className={buttonStyles()}>
          <LuPlus aria-hidden="true" className="h-4 w-4" />
          Nova tarefa
        </button>
      </div>
    );
  }

  return (
    <CreateTaskFormFields
      employees={employees}
      formRef={formRef}
      onCreated={() => toggle(false)}
      onCancel={() => toggle(false)}
    />
  );
}

type CreateTaskFormFieldsProps = Pick<CreateTaskFormProps, 'employees'> & {
  formRef: RefObject<HTMLFormElement>;
  onCreated: () => void;
  onCancel: () => void;
};

// Formulário aberto: o useFormState vive aqui (e some ao fechar), então o erro da tentativa anterior não volta ao reabrir
function CreateTaskFormFields({ employees, formRef, onCreated, onCancel }: CreateTaskFormFieldsProps) {
  const [state, formAction] = useFormState(createTaskAction, {});

  // Fecha o formulário após criar a tarefa
  useEffect(() => {
    if (state.ok) onCreated();
  }, [state, onCreated]);

  return (
    <form
      ref={formRef}
      action={formAction}
      aria-labelledby="new-task-title"
      className="flex flex-col gap-4 rounded-xl border border-brand-100 bg-brand-50/40 p-4"
    >
      <h3 id="new-task-title" className="font-semibold text-slate-900">
        Nova tarefa
      </h3>

      <Input id="new-task-name" name="taskName" type="text" label="Nome da tarefa" required />

      <Textarea id="new-task-description" name="description" rows={2} label="Descrição (opcional)" />

      <div className="flex flex-col gap-1.5">
        <ResponsiblesPicker employees={employees} idPrefix="new-task" />
        <p className="text-xs text-slate-500">Sem responsáveis selecionados, você será o responsável principal.</p>
      </div>

      <FormError message={state.error} />

      <div className="flex flex-wrap gap-2">
        <SubmitButton pendingText="Criando...">Criar tarefa</SubmitButton>
        <Button variant="ghost" onClick={onCancel}>
          Cancelar
        </Button>
      </div>
    </form>
  );
}
