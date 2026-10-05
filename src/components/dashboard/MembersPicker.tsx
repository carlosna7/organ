import type { Employee } from '@/lib/types';
import Avatar from '@/components/ui/Avatar';

type MembersPickerProps = {
  employees: Employee[];
  // employeeId dos membros já selecionados
  selected?: number[];
  idPrefix: string;
};

// Lista de funcionários registrados com checkbox; envia "member" (employeeId) no FormData
export default function MembersPicker({ employees, selected = [], idPrefix }: MembersPickerProps) {
  if (employees.length === 0) {
    return <p className="text-sm text-slate-500">Nenhum funcionário registrado.</p>;
  }

  // min-w-0 no fieldset: o padrão do navegador é min-width: min-content, o que impede o truncate
  return (
    <fieldset className="flex min-w-0 flex-col gap-1.5">
      <legend className="mb-1.5 text-sm font-medium text-slate-700">Membros</legend>
      <ul className="max-h-64 divide-y divide-slate-100 overflow-y-auto rounded-lg border border-slate-200 bg-white">
        {employees.map(employee => {
          const id = `${idPrefix}-member-${employee.employeeId}`;
          const displayName = employee.name ?? employee.email;

          return (
            <li key={employee.employeeId}>
              <label htmlFor={id} className="flex cursor-pointer items-center gap-3 px-3 py-2 text-sm hover:bg-slate-50">
                <input
                  id={id}
                  type="checkbox"
                  name="member"
                  value={employee.employeeId}
                  defaultChecked={selected.includes(employee.employeeId)}
                  className="h-4 w-4 rounded border-slate-300 accent-brand-600"
                />
                <Avatar name={displayName} size="sm" />
                <span className="min-w-0 truncate">
                  <span className="font-medium text-slate-800">{displayName}</span>
                  {employee.position && <span className="text-slate-500"> · {employee.position}</span>}
                </span>
              </label>
            </li>
          );
        })}
      </ul>
    </fieldset>
  );
}
