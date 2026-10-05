type ProgressBarProps = {
  // Itens concluídos e total
  value: number;
  max: number;
  // Nome acessível (ex.: "Progresso do projeto Site novo")
  label: string;
  className?: string;
};

// Barra de progresso (concluídas / total) com valor anunciado por leitores de tela
export default function ProgressBar({ value, max, label, className }: ProgressBarProps) {
  const percent = max > 0 ? Math.round((value / max) * 100) : 0;

  return (
    <div
      role="progressbar"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={percent}
      aria-valuetext={`${percent}% concluído`}
      className={`h-2 w-full overflow-hidden rounded-full bg-slate-100 ${className ?? ''}`}
    >
      <div className="h-full rounded-full bg-done transition-[width]" style={{ width: `${percent}%` }} />
    </div>
  );
}
