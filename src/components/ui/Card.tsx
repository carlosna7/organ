import type { HTMLAttributes } from 'react';

type CardProps = HTMLAttributes<HTMLElement> & {
  as?: 'section' | 'div' | 'article';
};

// Superfície branca com borda e sombra leve
export default function Card({ as: Tag = 'div', className, ...props }: CardProps) {
  return <Tag className={`rounded-2xl border border-slate-200 bg-white shadow-sm ${className ?? ''}`} {...props} />;
}

type CardHeaderProps = {
  title: string;
  description?: string;
  icon?: React.ReactNode;
  // Conteúdo à direita do título (contador, botão...)
  action?: React.ReactNode;
  titleId?: string;
};

// Cabeçalho padrão de um Card
export function CardHeader({ title, description, icon, action, titleId }: CardHeaderProps) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-100 px-4 py-4 sm:px-5">
      <div className="flex min-w-0 items-start gap-3">
        {icon && (
          <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-brand-600">
            {icon}
          </span>
        )}
        <div className="min-w-0">
          <h2 id={titleId} className="text-base font-semibold text-slate-900">
            {title}
          </h2>
          {description && <p className="text-sm text-slate-500">{description}</p>}
        </div>
      </div>
      {action}
    </div>
  );
}
