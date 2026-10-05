import type { Metadata } from 'next';
import Link from 'next/link';
import { LuCompass, LuHome, LuLayoutDashboard } from 'react-icons/lu';
import { buttonStyles } from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import Logo from '@/components/ui/Logo';

// O layout raiz acrescenta " | Organ" ao título
export const metadata: Metadata = {
  title: 'Página não encontrada',
};

// Página exibida para qualquer rota inexistente
export default function NotFound() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-8 bg-slate-50 p-4">
      <Link href="/" aria-label="Organ, voltar para a página inicial" className="rounded-lg">
        <Logo />
      </Link>

      <Card className="flex w-full max-w-md flex-col items-center gap-4 p-8 text-center">
        <span className="flex h-12 w-12 items-center justify-center rounded-full bg-brand-50 text-brand-600">
          <LuCompass aria-hidden="true" className="h-6 w-6" />
        </span>
        <p className="text-sm font-semibold text-brand-700">Erro 404</p>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Página não encontrada</h1>
        <p className="text-sm text-slate-600">
          O endereço que você acessou não existe ou foi movido. Confira o link ou volte para uma página conhecida.
        </p>
        <div className="mt-2 flex w-full flex-col gap-2 sm:flex-row sm:justify-center">
          <Link href="/" className={buttonStyles({ variant: 'primary' })}>
            <LuHome aria-hidden="true" className="h-4 w-4" />
            Página inicial
          </Link>
          <Link href="/dashboard" className={buttonStyles({ variant: 'secondary' })}>
            <LuLayoutDashboard aria-hidden="true" className="h-4 w-4" />
            Ir para o painel
          </Link>
        </div>
      </Card>
    </main>
  );
}
