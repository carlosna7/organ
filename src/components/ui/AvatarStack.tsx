import Avatar from './Avatar';

type AvatarStackProps = {
  names: string[];
  // Quantos avatares aparecem antes de virar "+N"
  max?: number;
};

// Avatares sobrepostos (decorativos; os nomes aparecem em texto ao lado)
export default function AvatarStack({ names, max = 4 }: AvatarStackProps) {
  const visible = names.slice(0, max);
  const extra = names.length - visible.length;

  return (
    <span aria-hidden="true" className="flex shrink-0 -space-x-2">
      {visible.map((name, index) => (
        <Avatar key={`${name}-${index}`} name={name} size="sm" className="ring-2 ring-white" />
      ))}
      {extra > 0 && (
        <span className="inline-flex h-6 min-w-6 items-center justify-center rounded-full bg-slate-100 px-1 text-[10px] font-semibold text-slate-600 ring-2 ring-white">
          +{extra}
        </span>
      )}
    </span>
  );
}
