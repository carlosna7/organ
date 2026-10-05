'use client';

import { createTeamAction, updateTeamAction } from '@/actions/teams';
import type { Employee, Team } from '@/lib/types';
import Input, { Textarea } from '@/components/ui/Input';
import MembersPicker from './MembersPicker';
import ModalForm from './ModalForm';

type TeamFormModalProps = {
  // Com a equipe, edita; sem ela, cria
  team?: Team;
  // Funcionários registrados (só eles podem entrar numa equipe)
  employees: Employee[];
  onClose: () => void;
};

// Janela para criar ou editar uma equipe (só líder)
export default function TeamFormModal({ team, employees, onClose }: TeamFormModalProps) {
  const isEdit = team !== undefined;
  const idPrefix = isEdit ? `edit-team-${team.teamId}` : 'new-team';

  return (
    <ModalForm
      title={isEdit ? 'Editar equipe' : 'Nova equipe'}
      description={isEdit ? team.name : undefined}
      action={isEdit ? updateTeamAction : createTeamAction}
      submitLabel={isEdit ? 'Salvar' : 'Criar equipe'}
      pendingText={isEdit ? 'Salvando...' : 'Criando...'}
      onClose={onClose}
    >
      {isEdit && <input type="hidden" name="teamId" value={team.teamId} />}

      <Input id={`${idPrefix}-name`} name="name" type="text" label="Nome da equipe" defaultValue={team?.name} required />

      <Textarea
        id={`${idPrefix}-description`}
        name="description"
        rows={2}
        label="Descrição (opcional)"
        defaultValue={team?.description ?? ''}
      />

      <MembersPicker
        employees={employees}
        selected={team?.members.map(member => member.employeeId)}
        idPrefix={idPrefix}
      />
    </ModalForm>
  );
}
