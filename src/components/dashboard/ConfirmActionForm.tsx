'use client';

import { useState } from 'react';
import { useFormState } from 'react-dom';
import type { ActionState } from '@/actions/types';
import { buttonStyles } from '@/components/ui/Button';
import SubmitButton from '@/components/ui/SubmitButton';
import FormError from './FormError';

type ConfirmActionFormProps = {
  action: (state: ActionState, formData: FormData) => Promise<ActionState>;
  fields: Record<string, string | number>;
  label: string;
  confirmLabel: string;
  // Nome do item para leitores de tela (ex.: "Remover Ana")
  accessibleLabel?: string;
};

// Ação destrutiva em dois cliques (ex.: remover funcionário, excluir tarefa)
export default function ConfirmActionForm({ action, fields, label, confirmLabel, accessibleLabel }: ConfirmActionFormProps) {
  const [state, formAction] = useFormState(action, {});
  const [confirming, setConfirming] = useState(false);

  if (!confirming) {
    return (
      <div className="flex flex-col items-end gap-1">
        <button
          type="button"
          onClick={() => setConfirming(true)}
          aria-label={accessibleLabel}
          className={buttonStyles({ variant: 'dangerGhost', size: 'sm' })}
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
      <div className="flex flex-wrap justify-end gap-2">
        <button
          type="button"
          onClick={() => setConfirming(false)}
          className={buttonStyles({ variant: 'ghost', size: 'sm' })}
        >
          Cancelar
        </button>
        <SubmitButton variant="danger" size="sm" pendingText="Aguarde...">
          {confirmLabel}
        </SubmitButton>
      </div>
      <FormError message={state.error} />
    </form>
  );
}
