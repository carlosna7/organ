import type { TaskStatus } from '@/lib/types';
import { TASK_STATUS_LABELS } from '@/lib/types';
import { StatusBadge } from '@/components/ui/Badge';
import Avatar from '@/components/ui/Avatar';
import { LogoMark } from '@/components/ui/Logo';

// Dados fictícios só para ilustrar o painel
const MOCK_TASKS: { name: string; status: TaskStatus; people: string[] }[] = [
  { name: 'Revisar proposta do cliente', status: 'em_andamento', people: ['Ana Souza', 'Bruno Lima'] },
  { name: 'Preparar reunião mensal', status: 'pendente', people: ['Carla Mendes'] },
  { name: 'Publicar novo site', status: 'concluida', people: ['Bruno Lima', 'Ana Souza', 'Carla Mendes'] },
];

const MOCK_TEAM = [
  { name: 'Ana Souza', position: 'Coordenadora', role: 'Líder' },
  { name: 'Bruno Lima', position: 'Desenvolvedor', role: 'Membro' },
  { name: 'Carla Mendes', position: 'Designer', role: 'Membro' },
];

type DashboardMockupProps = {
  // "compact" mostra só as tarefas (painel das telas de login/cadastro)
  variant?: 'full' | 'compact';
  className?: string;
};

// Ilustração do dashboard feita em JSX (sem imagens externas)
export default function DashboardMockup({ variant = 'full', className }: DashboardMockupProps) {
  const isFull = variant === 'full';

  return (
    <div
      role="img"
      aria-label="Prévia do painel do Organ com a equipe e as tarefas organizadas por status"
      className={`select-none overflow-hidden rounded-2xl border border-slate-200 bg-white text-left shadow-2xl shadow-brand-900/10 ${className ?? ''}`}
    >
      {/* Barra da janela */}
      <div className="flex items-center gap-1.5 border-b border-slate-100 bg-slate-50 px-4 py-2.5">
        <span className="h-2.5 w-2.5 rounded-full bg-slate-300" />
        <span className="h-2.5 w-2.5 rounded-full bg-slate-300" />
        <span className="h-2.5 w-2.5 rounded-full bg-slate-300" />
      </div>

      {/* Cabeçalho do painel */}
      <div className="flex items-center justify-between gap-3 border-b border-slate-100 px-4 py-3">
        <div className="flex items-center gap-2">
          <LogoMark className="h-6 w-6" />
          <div>
            <p className="text-[10px] uppercase tracking-wide text-slate-500">Empresa</p>
            <p className="text-sm font-semibold text-slate-900">Estúdio Aurora</p>
          </div>
        </div>
        <Avatar name="Ana Souza" size="sm" />
      </div>

      <div className={`grid gap-3 bg-slate-50/60 p-4 ${isFull ? 'sm:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]' : ''}`}>
        {isFull && (
          <div className="rounded-xl border border-slate-200 bg-white p-3">
            <p className="mb-2 text-xs font-semibold text-slate-900">Equipe</p>
            <ul className="flex flex-col gap-2">
              {MOCK_TEAM.map(person => (
                <li key={person.name} className="flex items-center gap-2">
                  <Avatar name={person.name} size="sm" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-xs font-medium text-slate-800">{person.name}</p>
                    <p className="truncate text-[10px] text-slate-500">{person.position}</p>
                  </div>
                  {person.role === 'Líder' && (
                    <span className="rounded-full bg-brand-50 px-1.5 py-0.5 text-[10px] text-brand-700">
                      {person.role}
                    </span>
                  )}
                </li>
              ))}
              <li className="flex items-center gap-2 rounded-lg border border-dashed border-slate-300 px-2 py-1.5">
                <span className="truncate text-[10px] text-slate-500">diego@aurora.com</span>
                <span className="ml-auto rounded-full bg-pending-soft px-1.5 py-0.5 text-[10px] text-pending-strong">
                  Convite
                </span>
              </li>
            </ul>
          </div>
        )}

        <div className="rounded-xl border border-slate-200 bg-white p-3">
          <div className="mb-2 flex items-center justify-between gap-2">
            <p className="text-xs font-semibold text-slate-900">Tarefas</p>
            <div className="flex gap-1">
              <span className="rounded-full bg-slate-900 px-2 py-0.5 text-[10px] text-white">Todas</span>
              {(['pendente', 'em_andamento'] as TaskStatus[]).map(status => (
                <span key={status} className="hidden rounded-full border border-slate-200 px-2 py-0.5 text-[10px] text-slate-600 sm:inline">
                  {TASK_STATUS_LABELS[status]}
                </span>
              ))}
            </div>
          </div>
          <ul className="flex flex-col gap-2">
            {MOCK_TASKS.map(task => (
              <li key={task.name} className="rounded-lg border border-slate-200 p-2.5">
                <div className="flex items-start justify-between gap-2">
                  <p className="text-xs font-medium text-slate-800">{task.name}</p>
                  <StatusBadge status={task.status} />
                </div>
                <div className="mt-2 flex -space-x-1">
                  {task.people.map(person => (
                    <Avatar key={person} name={person} size="sm" className="ring-2 ring-white" />
                  ))}
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
