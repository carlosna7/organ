import type { Employee } from '@/lib/types';
import { LEADERSHIP_LEVEL_LABELS } from '@/lib/types';
import Avatar from '@/components/ui/Avatar';
import { fieldStyles } from '@/components/ui/Input';

type ResponsiblesPickerProps = {
  employees: Employee[];
  // employeeId → nível dos responsáveis já selecionados
  selected?: Record<number, number>;
  idPrefix: string;
};

// Lista de funcionários registrados com checkbox e nível (1 a 3)
// Envia "responsible" (employeeId) e "level-<employeeId>" no FormData
export default function ResponsiblesPicker({ employees, selected = {}, idPrefix }: ResponsiblesPickerProps) {
  if (employees.length === 0) {
    return <p className="text-sm text-slate-500">Nenhum funcionário registrado.</p>;
  }

  return (
    <fieldset className="flex flex-col gap-1.5">
      <legend className="mb-1.5 text-sm font-medium text-slate-700">Responsáveis</legend>
      <ul className="max-h-64 divide-y divide-slate-100 overflow-y-auto rounded-lg border border-slate-200 bg-white">
        {employees.map(employee => {
          const id = `${idPrefix}-responsible-${employee.employeeId}`;
          const level = selected[employee.employeeId];
          const displayName = employee.name ?? employee.email;

          return (
            <li key={employee.employeeId} className="flex flex-wrap items-center gap-x-3 gap-y-2 px-3 py-2 text-sm">
              <input
                id={id}
                type="checkbox"
                name="responsible"
                value={employee.employeeId}
                defaultChecked={level !== undefined}
                className="h-4 w-4 rounded border-slate-300 accent-brand-600"
              />
              <label htmlFor={id} className="flex min-w-[9rem] flex-1 cursor-pointer items-center gap-2">
                <Avatar name={displayName} size="sm" />
                <span className="min-w-0 truncate">
                  <span className="font-medium text-slate-800">{displayName}</span>
                  {employee.position && <span className="text-slate-500"> · {employee.position}</span>}
                </span>
              </label>
              <select
                name={`level-${employee.employeeId}`}
                defaultValue={level ?? 3}
                aria-label={`Nível de ${displayName}`}
                className={`${fieldStyles} ml-auto !w-auto !py-1 text-xs`}
              >
                {[3, 2, 1].map(value => (
                  <option key={value} value={value}>
                    {value} - {LEADERSHIP_LEVEL_LABELS[value]}
                  </option>
                ))}
              </select>
            </li>
          );
        })}
      </ul>
    </fieldset>
  );
}
