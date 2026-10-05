import { LuAlertCircle, LuCheckCircle2 } from 'react-icons/lu';

type AlertProps = {
  tone?: 'error' | 'success';
  children: React.ReactNode;
  className?: string;
};

// Caixa de mensagem (erro ou sucesso) anunciada por leitores de tela
export default function Alert({ tone = 'error', children, className }: AlertProps) {
  const isError = tone === 'error';
  const Icon = isError ? LuAlertCircle : LuCheckCircle2;

  return (
    <div
      role={isError ? 'alert' : 'status'}
      className={`flex items-start gap-2 rounded-lg border px-3 py-2 text-sm ${
        isError ? 'border-red-200 bg-red-50 text-red-700' : 'border-emerald-200 bg-emerald-50 text-emerald-800'
      } ${className ?? ''}`}
    >
      <Icon aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0" />
      <span>{children}</span>
    </div>
  );
}
