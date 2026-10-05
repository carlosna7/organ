type EmptyStateProps = {
  icon: React.ReactNode;
  title: string;
  description?: string;
  // Botão ou link de ação
  children?: React.ReactNode;
};

// Aviso de lista vazia, com ícone, texto e uma ação opcional
export default function EmptyState({ icon, title, description, children }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed border-slate-300 bg-white px-6 py-10 text-center">
      <span className="flex h-11 w-11 items-center justify-center rounded-full bg-slate-100 text-slate-500">
        {icon}
      </span>
      <p className="font-medium text-slate-900">{title}</p>
      {description && <p className="max-w-sm text-sm text-slate-500">{description}</p>}
      {children && <div className="mt-2">{children}</div>}
    </div>
  );
}
