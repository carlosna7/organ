'use client';

import Link from 'next/link';
import { LuAlertTriangle, LuHome, LuRefreshCw } from 'react-icons/lu';
import { buttonStyles } from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import Logo from '@/components/ui/Logo';

type ErrorPageProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

// Erro inesperado ao renderizar uma página; os detalhes não são exibidos ao usuário
export default function ErrorPage({ reset }: ErrorPageProps) {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-8 bg-slate-50 p-4">
      <Link href="/" aria-label="Organ, voltar para a página inicial" className="rounded-lg">
        <Logo />
      </Link>

      <Card className="flex w-full max-w-md flex-col items-center gap-4 p-8 text-center">
        <span className="flex h-12 w-12 items-center justify-center rounded-full bg-red-50 text-red-600">
          <LuAlertTriangle aria-hidden="true" className="h-6 w-6" />
        </span>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Algo deu errado</h1>
        <p className="text-sm text-slate-600">
          Ocorreu um problema inesperado ao carregar esta página. Tente novamente ou volte para a página inicial.
        </p>
        <div className="mt-2 flex w-full flex-col gap-2 sm:flex-row sm:justify-center">
          <button type="button" onClick={reset} className={buttonStyles({ variant: 'primary' })}>
            <LuRefreshCw aria-hidden="true" className="h-4 w-4" />
            Tentar novamente
          </button>
          <Link href="/" className={buttonStyles({ variant: 'secondary' })}>
            <LuHome aria-hidden="true" className="h-4 w-4" />
            Página inicial
          </Link>
        </div>
      </Card>
    </main>
  );
}
