import { LuCalendar, LuCalendarCheck, LuPencil } from 'react-icons/lu';
import { deleteTaskAction } from '@/actions/tasks';
import type { Employee, TaskItem } from '@/lib/types';
import { StatusBadge } from '@/components/ui/Badge';
import { buttonStyles } from '@/components/ui/Button';
import ConfirmActionForm from './ConfirmActionForm';
import ProjectTag from './ProjectTag';
import ResponsibleChips from './ResponsibleChips';
import TaskStatusForm from './TaskStatusForm';

type TaskCardProps = {
  task: TaskItem;
  me: Employee;
  onEdit: (task: TaskItem) => void;
};

// Card de tarefa das visões em lista e em grade; as ações aparecem conforme a permissão
export default function TaskCard({ task, me, onEdit }: TaskCardProps) {
  const isLeader = me.role === 'leader';
  const isResponsible = task.responsibles.some(responsible => responsible.employee?.employeeId === me.employeeId);
  const canChangeStatus = isLeader || isResponsible;

  return (
    <li className="flex h-full flex-col gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition-colors hover:border-slate-300">
      <div className="flex flex-wrap items-start justify-between gap-2">
        {/* break-words: nome sem espaços quebra dentro do card em vez de estourar a largura */}
        <h3 className="min-w-0 flex-1 break-words font-semibold text-slate-900">
          <span className="mr-1.5 text-sm font-normal text-slate-500">#{task.taskId}</span>
          {task.taskName}
        </h3>
        <StatusBadge status={task.status} />
      </div>

      {task.project && <ProjectTag project={task.project} />}

      {task.description && (
        <p className="-mt-1 whitespace-pre-line break-words text-sm text-slate-600">{task.description}</p>
      )}

      <ResponsibleChips responsibles={task.responsibles} />

      <p className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500">
        {task.createdLabel && (
          <span className="inline-flex items-center gap-1">
            <LuCalendar aria-hidden="true" className="h-3.5 w-3.5" />
            Criada em {task.createdLabel}
          </span>
        )}
        {task.completedLabel && (
          <span className="inline-flex items-center gap-1 text-done-strong">
            <LuCalendarCheck aria-hidden="true" className="h-3.5 w-3.5" />
            Concluída em {task.completedLabel}
          </span>
        )}
      </p>

      {canChangeStatus && (
        <div className="mt-auto flex flex-wrap items-start justify-between gap-2 border-t border-slate-100 pt-3">
          <TaskStatusForm taskId={task.taskId} status={task.status} />
          {isLeader && (
            <div className="flex flex-wrap items-start justify-end gap-1">
              <button
                type="button"
                onClick={() => onEdit(task)}
                aria-label={`Editar a tarefa ${task.taskName}`}
                className={buttonStyles({ variant: 'ghost', size: 'sm' })}
              >
                <LuPencil aria-hidden="true" className="h-3.5 w-3.5" />
                Editar
              </button>
              <ConfirmActionForm
                action={deleteTaskAction}
                fields={{ taskId: task.taskId }}
                label="Excluir"
                confirmLabel="Confirmar exclusão"
                accessibleLabel={`Excluir a tarefa ${task.taskName}`}
              />
            </div>
          )}
        </div>
      )}
    </li>
  );
}
