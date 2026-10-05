'use client';

import { useFormState } from 'react-dom';
import { updateTaskStatusAction } from '@/actions/tasks';
import type { TaskStatus } from '@/lib/types';
import { TASK_STATUSES, TASK_STATUS_LABELS } from '@/lib/types';
import { fieldStyles } from '@/components/ui/Input';
import SubmitButton from '@/components/ui/SubmitButton';
import FormError from './FormError';

type TaskStatusFormProps = {
  taskId: number;
  status: TaskStatus;
};

// Troca de status (líder ou responsável da tarefa)
export default function TaskStatusForm({ taskId, status }: TaskStatusFormProps) {
  const [state, formAction] = useFormState(updateTaskStatusAction, {});

  return (
    <form action={formAction} className="flex flex-col gap-1">
      <input type="hidden" name="taskId" value={taskId} />
      <div className="flex items-center gap-2">
        <select
          // Recria o select quando o status muda no servidor
          key={status}
          name="status"
          defaultValue={status}
          aria-label="Status da tarefa"
          className={`${fieldStyles} !w-auto !py-1.5`}
        >
          {TASK_STATUSES.map(value => (
            <option key={value} value={value}>
              {TASK_STATUS_LABELS[value]}
            </option>
          ))}
        </select>
        <SubmitButton variant="secondary" size="sm" pendingText="Salvando...">
          Atualizar
        </SubmitButton>
      </div>
      <FormError message={state.error} />
    </form>
  );
}
