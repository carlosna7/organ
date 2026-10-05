'use client';

import { useFormStatus } from 'react-dom';
import { LuLoader2 } from 'react-icons/lu';
import { buttonStyles, type ButtonSize, type ButtonVariant } from './Button';

type SubmitButtonProps = {
  children: React.ReactNode;
  pendingText?: string;
  variant?: ButtonVariant;
  size?: ButtonSize;
  fullWidth?: boolean;
  className?: string;
  // Nome acessível completo (ex.: com o item afetado); começa pelo texto visível
  ariaLabel?: string;
};

// Botão de envio que desabilita e mostra carregando enquanto a Server Action roda
export default function SubmitButton({
  children,
  pendingText,
  variant,
  size,
  fullWidth,
  className,
  ariaLabel,
}: SubmitButtonProps) {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      aria-disabled={pending}
      // Enquanto pendente vale o texto visível ("Aguarde...")
      aria-label={pending ? undefined : ariaLabel}
      className={buttonStyles({ variant, size, fullWidth, className })}
    >
      {pending && <LuLoader2 aria-hidden="true" className="h-4 w-4 animate-spin" />}
      {pending ? pendingText ?? 'Enviando...' : children}
    </button>
  );
}
