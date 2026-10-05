'use client';

import { useEffect, useRef } from 'react';
import { useFormState } from 'react-dom';
import { inviteEmployeeAction } from '@/actions/team';
import FormError from './FormError';
import SubmitButton from './SubmitButton';

// Formulário do líder para convidar funcionários por email
export default function InviteForm() {
  const [state, formAction] = useFormState(inviteEmployeeAction, {});
  const formRef = useRef<HTMLFormElement>(null);

  // Limpa o campo após um convite bem-sucedido
  useEffect(() => {
    if (state.ok) formRef.current?.reset();
  }, [state]);

  return (
    <form ref={formRef} action={formAction} className="flex flex-col gap-2">
      <label htmlFor="invite-email" className="text-sm font-medium">
        Convidar por email
      </label>
      <div className="flex gap-2">
        <input
          id="invite-email"
          name="email"
          type="email"
          placeholder="email@empresa.com"
          required
          className="flex-1 rounded border px-2 py-1 text-sm"
        />
        <SubmitButton>Convidar</SubmitButton>
      </div>
      <FormError message={state.error} />
      {state.ok && (
        <p className="text-sm text-green-700">
          Convite registrado. A pessoa já pode se cadastrar com esse email.
        </p>
      )}
    </form>
  );
}
