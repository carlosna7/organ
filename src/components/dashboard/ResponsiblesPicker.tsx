import type { Employee } from '@/lib/types';
import { LEADERSHIP_LEVEL_LABELS } from '@/lib/types';

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
    return <p className="text-sm text-gray-500">Nenhum funcionário registrado.</p>;
  }

  return (
    <fieldset className="flex flex-col gap-1">
      <legend className="mb-1 text-sm font-medium">Responsáveis</legend>
      {employees.map(employee => {
        const id = `${idPrefix}-responsible-${employee.employeeId}`;
        const level = selected[employee.employeeId];

        return (
          <div key={employee.employeeId} className="flex items-center gap-2 text-sm">
            <input
              id={id}
              type="checkbox"
              name="responsible"
              value={employee.employeeId}
              defaultChecked={level !== undefined}
            />
            <label htmlFor={id} className="flex-1">
              {employee.name ?? employee.email}
              {employee.position && <span className="text-gray-500"> · {employee.position}</span>}
            </label>
            <select
              name={`level-${employee.employeeId}`}
              defaultValue={level ?? 3}
              aria-label={`Nível de ${employee.name ?? employee.email}`}
              className="rounded border px-1 py-0.5"
            >
              {[3, 2, 1].map(value => (
                <option key={value} value={value}>
                  {value} - {LEADERSHIP_LEVEL_LABELS[value]}
                </option>
              ))}
            </select>
          </div>
        );
      })}
    </fieldset>
  );
}
