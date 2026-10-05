import type { Responsibility } from '@/lib/types';
import { LEADERSHIP_LEVEL_LABELS } from '@/lib/types';
import Avatar from '@/components/ui/Avatar';

// Responsáveis de uma tarefa (do nível mais alto ao mais baixo) como etiquetas com avatar
export default function ResponsibleChips({ responsibles }: { responsibles: Responsibility[] }) {
  const sorted = [...responsibles].sort((a, b) => b.leadershipLevel - a.leadershipLevel);

  return (
    <ul className="flex flex-wrap gap-2 text-xs" aria-label="Responsáveis">
      {sorted.map((responsible, index) => {
        const name = responsible.employee?.name ?? responsible.employee?.email ?? 'Funcionário removido';

        return (
          <li
            key={responsible.employee?.employeeId ?? `removed-${index}`}
            className="inline-flex max-w-full items-center gap-1.5 rounded-full border border-slate-200 bg-slate-50 py-0.5 pl-0.5 pr-2.5"
          >
            <Avatar name={name} size="sm" />
            {/* truncate: nome/email longo vira reticências e o nível continua visível */}
            <span className="min-w-0 truncate font-medium text-slate-700">{name}</span>
            <span className="shrink-0 text-slate-500">
              · {LEADERSHIP_LEVEL_LABELS[responsible.leadershipLevel] ?? `Nível ${responsible.leadershipLevel}`}
            </span>
          </li>
        );
      })}
    </ul>
  );
}
