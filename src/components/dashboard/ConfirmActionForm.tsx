'use client';

import { useState } from 'react';
import { useFormState } from 'react-dom';
import type { ActionState } from '@/actions/types';
import FormError from './FormError';
import SubmitButton from './SubmitButton';

type ConfirmActionFormProps = {
  action: (state: ActionState, formData: FormData) => Promise<ActionState>;
  fields: Record<string, string | number>;
  label: string;
  confirmLabel: string;
};

// Ação destrutiva em dois cliques (ex.: remover funcionário, excluir tarefa)
export default function ConfirmActionForm({ action, fields, label, confirmLabel }: ConfirmActionFormProps) {
  const [state, formAction] = useFormState(action, {});
  const [confirming, setConfirming] = useState(false);

  if (!confirming) {
    return (
      <div className="flex flex-col items-end gap-1">
        <button
          type="button"
          onClick={() => setConfirming(true)}
          className="rounded px-3 py-1 text-sm text-red-600 hover:bg-red-50"
        >
          {label}
        </button>
        <FormError message={state.error} />
      </div>
    );
  }

  return (
    <form action={formAction} className="flex flex-col items-end gap-1">
      {Object.entries(fields).map(([name, value]) => (
        <input key={name} type="hidden" name={name} value={value} />
      ))}
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => setConfirming(false)}
          className="rounded px-3 py-1 text-sm hover:bg-gray-100"
        >
          Cancelar
        </button>
        <SubmitButton className="bg-red-600 text-white hover:bg-red-700" pendingText="Aguarde...">
          {confirmLabel}
        </SubmitButton>
      </div>
      <FormError message={state.error} />
    </form>
  );
}
