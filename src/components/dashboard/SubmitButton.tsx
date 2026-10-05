'use client';

import { useFormStatus } from 'react-dom';

type SubmitButtonProps = {
  children: React.ReactNode;
  pendingText?: string;
  className?: string;
};

// Botão de envio que desabilita enquanto a Server Action roda
export default function SubmitButton({ children, pendingText, className }: SubmitButtonProps) {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className={`rounded px-3 py-1 text-sm disabled:opacity-50 ${className ?? 'bg-blue-600 text-white hover:bg-blue-700'}`}
    >
      {pending ? pendingText ?? 'Enviando...' : children}
    </button>
  );
}
