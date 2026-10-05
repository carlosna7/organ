import { LuAlertCircle } from 'react-icons/lu';

// Mensagem de erro devolvida por uma Server Action
export default function FormError({ message }: { message?: string }) {
  if (!message) return null;

  return (
    <p role="alert" className="flex items-start gap-1.5 text-sm text-red-600">
      <LuAlertCircle aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0" />
      {message}
    </p>
  );
}
