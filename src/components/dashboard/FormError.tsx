// Mensagem de erro devolvida por uma Server Action
export default function FormError({ message }: { message?: string }) {
  if (!message) return null;

  return (
    <p role="alert" className="text-sm text-red-600">
      {message}
    </p>
  );
}
