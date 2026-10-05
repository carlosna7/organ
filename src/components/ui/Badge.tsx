import type { TaskStatus } from '@/lib/types';
import { TASK_STATUS_LABELS } from '@/lib/types';

type BadgeTone = 'neutral' | 'brand' | 'pending' | 'progress' | 'done' | 'danger';

const TONES: Record<BadgeTone, string> = {
  neutral: 'bg-slate-100 text-slate-700 ring-slate-200',
  brand: 'bg-brand-50 text-brand-700 ring-brand-200',
  pending: 'bg-pending-soft text-pending-strong ring-amber-200',
  progress: 'bg-progress-soft text-progress-strong ring-sky-200',
  done: 'bg-done-soft text-done-strong ring-emerald-200',
  danger: 'bg-red-50 text-red-700 ring-red-200',
};

// Tom do badge e cor do ponto para cada status de tarefa
export const STATUS_TONES: Record<TaskStatus, BadgeTone> = {
  pendente: 'pending',
  em_andamento: 'progress',
  concluida: 'done',
};

export const STATUS_DOTS: Record<TaskStatus, string> = {
  pendente: 'bg-pending',
  em_andamento: 'bg-progress',
  concluida: 'bg-done',
};

type BadgeProps = {
  tone?: BadgeTone;
  children: React.ReactNode;
  className?: string;
};

// Etiqueta pequena e arredondada
export default function Badge({ tone = 'neutral', children, className }: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ${TONES[tone]} ${className ?? ''}`}
    >
      {children}
    </span>
  );
}

// Badge com a cor e o nome do status da tarefa
export function StatusBadge({ status }: { status: TaskStatus }) {
  return (
    <Badge tone={STATUS_TONES[status]}>
      <span aria-hidden="true" className={`h-1.5 w-1.5 rounded-full ${STATUS_DOTS[status]}`} />
      {TASK_STATUS_LABELS[status]}
    </Badge>
  );
}
