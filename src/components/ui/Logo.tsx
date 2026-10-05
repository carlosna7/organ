type LogoProps = {
  // Mostra o nome "Organ" ao lado do símbolo
  withText?: boolean;
  // "light" para fundos escuros/coloridos
  tone?: 'dark' | 'light';
  className?: string;
};

// Símbolo do Organ: três barras alinhadas, como uma lista organizada
export function LogoMark({ tone = 'dark', className }: { tone?: 'dark' | 'light'; className?: string }) {
  const isLight = tone === 'light';

  return (
    <svg viewBox="0 0 32 32" aria-hidden="true" focusable="false" className={className ?? 'h-8 w-8'}>
      <rect width="32" height="32" rx="8" className={isLight ? 'fill-white' : 'fill-brand-600'} />
      <rect x="8" y="8.5" width="16" height="3.5" rx="1.75" className={isLight ? 'fill-brand-600' : 'fill-white'} />
      <rect x="8" y="14.25" width="11" height="3.5" rx="1.75" className={isLight ? 'fill-brand-400' : 'fill-brand-200'} />
      <rect x="8" y="20" width="6.5" height="3.5" rx="1.75" className="fill-brand-300" />
    </svg>
  );
}

// Logo completo (símbolo + nome)
export default function Logo({ withText = true, tone = 'dark', className }: LogoProps) {
  return (
    <span className={`inline-flex items-center gap-2 ${className ?? ''}`}>
      <LogoMark tone={tone} />
      {withText && (
        <span
          className={`text-xl font-bold tracking-tight ${tone === 'light' ? 'text-white' : 'text-slate-900'}`}
        >
          Organ
        </span>
      )}
    </span>
  );
}
