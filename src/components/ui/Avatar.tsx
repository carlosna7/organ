// Iniciais do nome (ou do email) para o avatar
function getInitials(value: string) {
  const parts = value.split(/[\s@._-]+/).filter(Boolean);
  const initials = parts.length > 1 ? parts[0][0] + parts[1][0] : value.slice(0, 2);
  return initials.toUpperCase();
}

type AvatarProps = {
  name: string;
  size?: 'sm' | 'md';
  className?: string;
};

// Círculo com as iniciais da pessoa (decorativo, o nome aparece ao lado)
export default function Avatar({ name, size = 'md', className }: AvatarProps) {
  return (
    <span
      aria-hidden="true"
      className={`inline-flex shrink-0 items-center justify-center rounded-full bg-brand-100 font-semibold text-brand-700 ${
        size === 'sm' ? 'h-6 w-6 text-[10px]' : 'h-9 w-9 text-xs'
      } ${className ?? ''}`}
    >
      {getInitials(name)}
    </span>
  );
}
