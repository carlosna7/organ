'use client';

import { inviteEmployeeAction } from '@/actions/team';
import Input from '@/components/ui/Input';
import ModalForm from './ModalForm';

// Janela do líder para convidar funcionários por email
export default function InviteModal({ onClose }: { onClose: () => void }) {
  return (
    <ModalForm
      title="Convidar membro"
      description="A pessoa cria a conta em “Fui convidado” usando este mesmo email."
      size="sm"
      action={inviteEmployeeAction}
      submitLabel="Convidar"
      pendingText="Convidando..."
      onClose={onClose}
    >
      <Input
        id="invite-email"
        name="email"
        type="email"
        label="Email do convidado"
        placeholder="email@empresa.com"
        required
      />
    </ModalForm>
  );
}
