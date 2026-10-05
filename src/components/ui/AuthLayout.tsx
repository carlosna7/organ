import Link from 'next/link';
import { LuCheck } from 'react-icons/lu';
import DashboardMockup from '@/components/main/DashboardMockup';
import Logo from './Logo';

type AuthLayoutProps = {
  title: string;
  description: string;
  children: React.ReactNode;
  // Links para as outras telas de autenticação
  footer?: React.ReactNode;
};

const HIGHLIGHTS = [
  'Convide a equipe pelo email',
  'Defina responsáveis para cada tarefa',
  'Acompanhe o status: pendente, em andamento e concluída',
];

// Layout comum de login, cadastro e criação de empresa
// Form de um lado e painel com logo + prévia do painel do outro (só em telas grandes)
export default function AuthLayout({ title, description, children, footer }: AuthLayoutProps) {
  return (
    <div className="flex min-h-screen bg-white">
      <main className="flex w-full flex-col px-4 py-8 sm:px-8 lg:w-1/2 lg:px-12 xl:px-20">
        <Link href="/" aria-label="Organ, voltar para a página inicial" className="self-start rounded-lg">
          <Logo />
        </Link>

        <div className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center py-10">
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">{title}</h1>
          <p className="mt-2 text-sm text-slate-600">{description}</p>

          <div className="mt-8">{children}</div>

          {footer && <div className="mt-8 border-t border-slate-200 pt-6 text-sm text-slate-600">{footer}</div>}
        </div>
      </main>

      <aside className="relative hidden w-1/2 overflow-hidden bg-gradient-to-br from-brand-600 via-brand-700 to-brand-900 lg:flex lg:flex-col lg:justify-center lg:px-12 xl:px-20">
        {/* Brilho decorativo de fundo */}
        <div aria-hidden="true" className="pointer-events-none absolute -right-32 -top-32 h-96 w-96 rounded-full bg-brand-400/30 blur-3xl" />
        <div aria-hidden="true" className="pointer-events-none absolute -bottom-40 -left-24 h-96 w-96 rounded-full bg-sky-400/20 blur-3xl" />

        <div className="relative">
          <Logo tone="light" />
          <p className="mt-8 max-w-md text-3xl font-bold leading-tight tracking-tight text-white">
            Sua equipe e suas tarefas no mesmo lugar.
          </p>
          <ul className="mt-6 flex flex-col gap-3">
            {HIGHLIGHTS.map(item => (
              <li key={item} className="flex items-center gap-3 text-sm text-brand-50">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-white/15">
                  <LuCheck aria-hidden="true" className="h-3.5 w-3.5" />
                </span>
                {item}
              </li>
            ))}
          </ul>
          <DashboardMockup variant="compact" className="mt-10 max-w-md" />
        </div>
      </aside>
    </div>
  );
}
