'use client';

import { useEffect, useRef, useState } from 'react';
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
  // Texto do botão que desiste da ação (padrão: "Cancelar")
  cancelLabel?: string;
  // Nome do item para leitores de tela (ex.: "Remover Ana")
  accessibleLabel?: string;
  // Nome do botão de confirmar com o item (ex.: "Confirmar remoção de Ana"); começa pelo texto visível
  confirmAccessibleLabel?: string;
};

// Ação destrutiva em dois cliques (ex.: remover funcionário, excluir tarefa)
export default function ConfirmActionForm({
  action,
  fields,
  label,
  confirmLabel,
  cancelLabel = 'Cancelar',
  accessibleLabel,
  confirmAccessibleLabel,
}: ConfirmActionFormProps) {
  const [state, formAction] = useFormState(action, {});
  const [confirming, setConfirming] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const formRef = useRef<HTMLFormElement>(null);
  // Só move o foco depois de um clique do usuário (nunca na renderização inicial)
  const moveFocus = useRef(false);

  // Abrir leva o foco ao botão de confirmar; cancelar devolve ao botão que abriu
  useEffect(() => {
    if (!moveFocus.current) return;
    moveFocus.current = false;
    if (confirming) {
      formRef.current?.querySelector<HTMLButtonElement>('button[type="submit"]')?.focus();
    } else {
      triggerRef.current?.focus();
    }
  }, [confirming]);

  const toggle = (next: boolean) => {
    moveFocus.current = true;
    setConfirming(next);
  };

  // Nome acessível do botão de confirmar (contém o texto visível)
  const confirmName = confirmAccessibleLabel ?? (accessibleLabel ? `${confirmLabel}: ${accessibleLabel}` : undefined);

  if (!confirming) {
    return (
      <div className="flex flex-col items-end gap-1">
        <button
          ref={triggerRef}
          type="button"
          onClick={() => toggle(true)}
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
    <form ref={formRef} action={formAction} className="flex flex-col items-end gap-1">
      {Object.entries(fields).map(([name, value]) => (
        <input key={name} type="hidden" name={name} value={value} />
      ))}
      <div className="flex flex-wrap justify-end gap-2">
        <button
          type="button"
          onClick={() => toggle(false)}
          className={buttonStyles({ variant: 'ghost', size: 'sm' })}
        >
          {cancelLabel}
        </button>
        <SubmitButton variant="danger" size="sm" pendingText="Aguarde..." ariaLabel={confirmName}>
          {confirmLabel}
        </SubmitButton>
      </div>
      <FormError message={state.error} />
    </form>
  );
}
