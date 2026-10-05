'use client';

import { useEffect, useRef, type ReactNode } from 'react';
import { useFormState } from 'react-dom';
import type { ActionState } from '@/actions/types';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import SubmitButton from '@/components/ui/SubmitButton';
import FormError from './FormError';

type ModalFormProps = {
  title: string;
  description?: string;
  size?: 'sm' | 'md' | 'lg';
  action: (state: ActionState, formData: FormData) => Promise<ActionState>;
  submitLabel: string;
  pendingText: string;
  onClose: () => void;
  // Campos do formulário
  children: ReactNode;
};

/**
 * Formulário dentro de uma janela modal: mostra o erro da Server Action, tem rodapé fixo
 * com Cancelar e o botão de envio, e fecha sozinho quando a ação dá certo.
 * O useFormState vive aqui, então o erro da tentativa anterior some ao reabrir.
 */
export default function ModalForm({
  title,
  description,
  size,
  action,
  submitLabel,
  pendingText,
  onClose,
  children,
}: ModalFormProps) {
  const [state, formAction] = useFormState(action, {});

  // Identidade estável: o efeito abaixo só reexecuta quando o estado da ação muda
  const closeRef = useRef(onClose);
  useEffect(() => {
    closeRef.current = onClose;
  });

  useEffect(() => {
    if (state.ok) closeRef.current();
  }, [state]);

  return (
    <Modal title={title} description={description} size={size} onClose={onClose}>
      <form action={formAction} className="flex min-h-0 flex-1 flex-col">
        <div className="flex flex-col gap-4 overflow-y-auto px-5 py-4">
          {children}
          <FormError message={state.error} />
        </div>
        <div className="flex flex-wrap justify-end gap-2 border-t border-slate-100 bg-slate-50 px-5 py-3">
          <Button variant="ghost" onClick={onClose}>
            Cancelar
          </Button>
          <SubmitButton pendingText={pendingText}>{submitLabel}</SubmitButton>
        </div>
      </form>
    </Modal>
  );
}
