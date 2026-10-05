'use client';

import { useEffect, useRef } from 'react';
import { useFormState } from 'react-dom';
import { LuUserPlus } from 'react-icons/lu';
import { inviteEmployeeAction } from '@/actions/team';
import Alert from '@/components/ui/Alert';
import { fieldStyles } from '@/components/ui/Input';
import SubmitButton from '@/components/ui/SubmitButton';
import FormError from './FormError';

// Formulário do líder para convidar funcionários por email
export default function InviteForm() {
  const [state, formAction] = useFormState(inviteEmployeeAction, {});
  const formRef = useRef<HTMLFormElement>(null);

  // Limpa o campo após um convite bem-sucedido
  useEffect(() => {
    if (state.ok) formRef.current?.reset();
  }, [state]);

  return (
    <form ref={formRef} action={formAction} className="flex flex-col gap-2 rounded-xl bg-slate-50 p-4">
      <label htmlFor="invite-email" className="text-sm font-medium text-slate-700">
        Convidar por email
      </label>
      <div className="flex flex-col gap-2 sm:flex-row">
        <input
          id="invite-email"
          name="email"
          type="email"
          placeholder="email@empresa.com"
          aria-describedby="invite-email-hint"
          required
          className={`${fieldStyles} min-w-0 flex-1`}
        />
        <SubmitButton pendingText="Convidando...">
          <LuUserPlus aria-hidden="true" className="h-4 w-4" />
          Convidar
        </SubmitButton>
      </div>
      <p id="invite-email-hint" className="text-xs text-slate-500">
        A pessoa cria a conta em “Fui convidado” usando este mesmo email.
      </p>
      <FormError message={state.error} />
      {state.ok && <Alert tone="success">Convite registrado. A pessoa já pode se cadastrar com esse email.</Alert>}
    </form>
  );
}
