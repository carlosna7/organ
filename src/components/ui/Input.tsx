import type { InputHTMLAttributes, TextareaHTMLAttributes } from 'react';

// Estilo comum de campos (input, textarea e select)
export const fieldStyles =
  'block w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm transition-colors ' +
  'placeholder:text-slate-400 hover:border-slate-400 ' +
  'focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/30 ' +
  'aria-[invalid=true]:border-red-500 disabled:cursor-not-allowed disabled:bg-slate-50';

type FieldProps = {
  id: string;
  label: string;
  // Texto de ajuda abaixo do campo
  hint?: string;
  // Mensagem de erro do campo
  error?: string;
};

// Label + mensagem ligadas ao campo via htmlFor e aria-describedby
function FieldWrapper({ id, label, hint, error, children }: FieldProps & { children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-sm font-medium text-slate-700">
        {label}
      </label>
      {children}
      {error ? (
        <p id={`${id}-message`} className="text-xs text-red-600">
          {error}
        </p>
      ) : (
        hint && (
          <p id={`${id}-message`} className="text-xs text-slate-500">
            {hint}
          </p>
        )
      )}
    </div>
  );
}

type InputProps = FieldProps & Omit<InputHTMLAttributes<HTMLInputElement>, 'id'>;

// Campo de texto com label e mensagem
export default function Input({ id, label, hint, error, className, ...props }: InputProps) {
  return (
    <FieldWrapper id={id} label={label} hint={hint} error={error}>
      <input
        id={id}
        aria-invalid={error ? true : undefined}
        aria-describedby={hint || error ? `${id}-message` : undefined}
        className={`${fieldStyles} ${className ?? ''}`}
        {...props}
      />
    </FieldWrapper>
  );
}

type TextareaProps = FieldProps & Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, 'id'>;

// Área de texto com label e mensagem
export function Textarea({ id, label, hint, error, className, ...props }: TextareaProps) {
  return (
    <FieldWrapper id={id} label={label} hint={hint} error={error}>
      <textarea
        id={id}
        aria-invalid={error ? true : undefined}
        aria-describedby={hint || error ? `${id}-message` : undefined}
        className={`${fieldStyles} resize-y ${className ?? ''}`}
        {...props}
      />
    </FieldWrapper>
  );
}
