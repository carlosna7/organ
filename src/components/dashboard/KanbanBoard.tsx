'use client';

import { useEffect, useState, useTransition, type ReactNode } from 'react';
import {
  DndContext,
  DragOverlay,
  KeyboardSensor,
  MouseSensor,
  TouchSensor,
  pointerWithin,
  rectIntersection,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
  type Announcements,
  type CollisionDetection,
  type DragEndEvent,
  type DragStartEvent,
  type KeyboardCoordinateGetter,
  type ScreenReaderInstructions,
} from '@dnd-kit/core';
import { LuGripVertical, LuPencil } from 'react-icons/lu';
import { deleteTaskAction, moveTaskAction } from '@/actions/tasks';
import type { Employee, TaskItem, TaskStatus } from '@/lib/types';
import { TASK_STATUSES, TASK_STATUS_LABELS, isTaskStatus } from '@/lib/types';
import Alert from '@/components/ui/Alert';
import { STATUS_DOTS } from '@/components/ui/Badge';
import { buttonStyles } from '@/components/ui/Button';
import { fieldStyles } from '@/components/ui/Input';
import ConfirmActionForm from './ConfirmActionForm';
import ProjectTag from './ProjectTag';
import ResponsibleChips from './ResponsibleChips';

type KanbanBoardProps = {
  tasks: TaskItem[];
  me: Employee;
  onEdit: (task: TaskItem) => void;
};

const INSTRUCTIONS: ScreenReaderInstructions = {
  draggable:
    'Para mover a tarefa, pressione Espaço ou Enter. Use as setas para escolher a coluna e Espaço ou Enter para soltar. Esc cancela.',
};

// Lê o nome da tarefa e o status guardados no item arrastado
const taskNameOf = (data: { current?: Record<string, unknown> }) => String(data.current?.taskName ?? 'Tarefa');

const ANNOUNCEMENTS: Announcements = {
  onDragStart: ({ active }) => `Tarefa ${taskNameOf(active.data)} selecionada.`,
  onDragOver: ({ active, over }) =>
    over ? `Tarefa ${taskNameOf(active.data)} sobre a coluna ${TASK_STATUS_LABELS[over.id as TaskStatus]}.` : undefined,
  onDragEnd: ({ active, over }) =>
    over
      ? `Tarefa ${taskNameOf(active.data)} movida para ${TASK_STATUS_LABELS[over.id as TaskStatus]}.`
      : `Tarefa ${taskNameOf(active.data)} solta fora das colunas.`,
  onDragCancel: ({ active }) => `Movimento cancelado. A tarefa ${taskNameOf(active.data)} ficou onde estava.`,
};

// Com o mouse vale a posição do ponteiro; pelo teclado, o quanto o card cobre cada coluna
const collisionDetection: CollisionDetection = args => {
  const underPointer = pointerWithin(args);
  return underPointer.length > 0 ? underPointer : rectIntersection(args);
};

// Pelo teclado, as setas levam o card direto para a coluna anterior ou seguinte
const columnKeyboardCoordinates: KeyboardCoordinateGetter = (event, { context }) => {
  const { active, droppableRects, over } = context;
  if (!active) return undefined;

  const step =
    event.code === 'ArrowRight' || event.code === 'ArrowDown'
      ? 1
      : event.code === 'ArrowLeft' || event.code === 'ArrowUp'
        ? -1
        : 0;
  if (step === 0) return undefined;
  event.preventDefault();

  const current = TASK_STATUSES.indexOf((over?.id ?? active.data.current?.status) as TaskStatus);
  const target = TASK_STATUSES[current + step];
  const rect = target ? droppableRects.get(target) : undefined;
  return rect ? { x: rect.left + 8, y: rect.top + 48 } : undefined;
};

// Quadro com uma coluna por status; arrastar o card para outra coluna muda o status da tarefa
export default function KanbanBoard({ tasks, me, onEdit }: KanbanBoardProps) {
  // Status mostrado na tela enquanto a mudança ainda não voltou do servidor
  const [moved, setMoved] = useState<Record<number, TaskStatus>>({});
  const [activeTaskId, setActiveTaskId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  // Quando o servidor devolve a lista atualizada, ela passa a valer no lugar do que foi movido
  const signature = tasks.map(task => `${task.taskId}:${task.status}`).join(',');
  useEffect(() => {
    setMoved({});
  }, [signature]);

  const sensors = useSensors(
    // Só começa a arrastar depois de mover alguns pixels (clicar nos botões do card continua funcionando)
    useSensor(MouseSensor, { activationConstraint: { distance: 6 } }),
    // No celular, segurar um instante para arrastar (rolar a página continua funcionando)
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: columnKeyboardCoordinates })
  );

  const statusOf = (task: TaskItem) => moved[task.taskId] ?? task.status;

  const canChangeStatus = (task: TaskItem) =>
    me.role === 'leader' || task.responsibles.some(responsible => responsible.employee?.employeeId === me.employeeId);

  // Mostra a mudança na hora e confirma com a API; se ela recusar, a tarefa volta para a coluna de origem
  const move = (task: TaskItem, status: TaskStatus) => {
    if (statusOf(task) === status) return;
    setError(null);
    setMoved(current => ({ ...current, [task.taskId]: status }));

    startTransition(async () => {
      const result = await moveTaskAction(task.taskId, status);
      if (result.error) {
        setMoved(current => {
          const next = { ...current };
          delete next[task.taskId];
          return next;
        });
        setError(`Não foi possível mover “${task.taskName}”: ${result.error}`);
      }
    });
  };

  const handleDragStart = ({ active }: DragStartEvent) => setActiveTaskId(Number(active.id));

  const handleDragEnd = ({ active, over }: DragEndEvent) => {
    setActiveTaskId(null);
    const task = tasks.find(item => item.taskId === Number(active.id));
    if (task && over && isTaskStatus(over.id)) move(task, over.id);
  };

  const activeTask = tasks.find(task => task.taskId === activeTaskId);

  return (
    <div className="flex flex-col gap-3">
      {error && <Alert>{error}</Alert>}

      <DndContext
        // id fixo: o id gerado automaticamente difere entre o servidor e o navegador (aviso de hidratação)
        id="task-kanban"
        sensors={sensors}
        collisionDetection={collisionDetection}
        accessibility={{ announcements: ANNOUNCEMENTS, screenReaderInstructions: INSTRUCTIONS }}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        onDragCancel={() => setActiveTaskId(null)}
      >
        <div className="grid grid-cols-[minmax(0,1fr)] gap-4 md:grid-cols-3">
          {TASK_STATUSES.map(status => {
            const columnTasks = tasks.filter(task => statusOf(task) === status);

            return (
              <KanbanColumn key={status} status={status} count={columnTasks.length}>
                {columnTasks.map(task => (
                  <KanbanCard
                    key={task.taskId}
                    task={task}
                    status={status}
                    canChangeStatus={canChangeStatus(task)}
                    isLeader={me.role === 'leader'}
                    onEdit={onEdit}
                    onMove={move}
                  />
                ))}
              </KanbanColumn>
            );
          })}
        </div>

        <DragOverlay dropAnimation={null}>
          {activeTask && (
            <div className="rotate-1 cursor-grabbing rounded-xl shadow-xl ring-2 ring-brand-300">
              <KanbanCardBody task={activeTask} />
            </div>
          )}
        </DragOverlay>
      </DndContext>
    </div>
  );
}

type KanbanColumnProps = {
  status: TaskStatus;
  count: number;
  children: ReactNode;
};

// Coluna de um status: também é a área onde os cards podem ser soltos
function KanbanColumn({ status, count, children }: KanbanColumnProps) {
  const { setNodeRef, isOver } = useDroppable({ id: status });
  const titleId = `kanban-column-${status}`;

  return (
    <section
      ref={setNodeRef}
      aria-labelledby={titleId}
      className={`flex min-h-32 min-w-0 flex-col gap-3 rounded-2xl border p-3 transition-colors ${
        isOver ? 'border-brand-300 bg-brand-50' : 'border-slate-200 bg-slate-100/70'
      }`}
    >
      <div className="flex items-center gap-2 px-1">
        <span aria-hidden="true" className={`h-2 w-2 rounded-full ${STATUS_DOTS[status]}`} />
        <h2 id={titleId} className="text-sm font-semibold text-slate-700">
          {TASK_STATUS_LABELS[status]}
        </h2>
        <span
          aria-label={`${count} ${count === 1 ? 'tarefa' : 'tarefas'}`}
          className="ml-auto rounded-full bg-white px-2 py-0.5 text-xs font-medium text-slate-600 ring-1 ring-inset ring-slate-200"
        >
          {count}
        </span>
      </div>

      {count === 0 ? (
        <p className="rounded-xl border border-dashed border-slate-300 px-3 py-6 text-center text-sm text-slate-500">
          Nenhuma tarefa
        </p>
      ) : (
        <ul className="flex flex-col gap-3">{children}</ul>
      )}
    </section>
  );
}

type KanbanCardProps = {
  task: TaskItem;
  status: TaskStatus;
  canChangeStatus: boolean;
  isLeader: boolean;
  onEdit: (task: TaskItem) => void;
  onMove: (task: TaskItem, status: TaskStatus) => void;
};

// Card arrastável (só para quem pode mudar o status da tarefa)
function KanbanCard({ task, status, canChangeStatus, isLeader, onEdit, onMove }: KanbanCardProps) {
  const { attributes, listeners, setNodeRef, setActivatorNodeRef, isDragging } = useDraggable({
    id: task.taskId,
    disabled: !canChangeStatus,
    data: { taskName: task.taskName, status },
  });

  return (
    <li ref={setNodeRef} {...listeners} className={`${canChangeStatus ? 'cursor-grab' : ''} ${isDragging ? 'opacity-40' : ''}`}>
      <KanbanCardBody
        task={task}
        handle={
          canChangeStatus && (
            // O teclado só ativa o arrastar por este botão (os outros botões do card seguem normais)
            <button
              ref={setActivatorNodeRef}
              type="button"
              {...attributes}
              aria-label={`Mover a tarefa ${task.taskName}`}
              className="-ml-1 mt-0.5 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded text-slate-400 hover:bg-slate-100 hover:text-slate-700"
            >
              <LuGripVertical aria-hidden="true" className="h-4 w-4" />
            </button>
          )
        }
        controls={
          canChangeStatus && (
            <div className="mt-auto flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 pt-3">
              <select
                value={status}
                onChange={event => {
                  if (isTaskStatus(event.target.value)) onMove(task, event.target.value);
                }}
                aria-label={`Mover a tarefa ${task.taskName} para`}
                className={`${fieldStyles} !w-auto !py-1 text-xs`}
              >
                {TASK_STATUSES.map(value => (
                  <option key={value} value={value}>
                    {TASK_STATUS_LABELS[value]}
                  </option>
                ))}
              </select>
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
          )
        }
      />
    </li>
  );
}

type KanbanCardBodyProps = {
  task: TaskItem;
  // Botão de arrastar e controles do rodapé (ausentes no card que acompanha o ponteiro)
  handle?: ReactNode;
  controls?: ReactNode;
};

// Conteúdo do card do kanban, compacto: título, projeto, descrição, responsáveis e controles
function KanbanCardBody({ task, handle, controls }: KanbanCardBodyProps) {
  return (
    <div className="flex flex-col gap-2.5 rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
      <div className="flex items-start gap-1.5">
        {handle}
        <h3 className="min-w-0 flex-1 break-words text-sm font-semibold text-slate-900">
          <span className="mr-1.5 text-xs font-normal text-slate-500">#{task.taskId}</span>
          {task.taskName}
        </h3>
      </div>
      {task.project && <ProjectTag project={task.project} />}
      {task.description && (
        <p className="line-clamp-3 whitespace-pre-line break-words text-sm text-slate-600">{task.description}</p>
      )}
      <ResponsibleChips responsibles={task.responsibles} />
      {controls}
    </div>
  );
}
