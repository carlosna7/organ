import Link from 'next/link';
import { LuLogOut } from 'react-icons/lu';
import { logoutAction } from '@/actions/auth';
import type { Employee } from '@/lib/types';
import { ROLE_LABELS } from '@/lib/types';
import Avatar from '@/components/ui/Avatar';
import { buttonStyles } from '@/components/ui/Button';
import { LogoMark } from '@/components/ui/Logo';

type DashboardHeaderProps = {
  companyName: string;
  me: Employee;
};

// Cabeçalho com empresa, usuário logado e logout
export default function DashboardHeader({ companyName, me }: DashboardHeaderProps) {
  const displayName = me.name ?? me.email;

  return (
    <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/90 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
        <div className="flex min-w-0 items-center gap-3">
          <Link href="/dashboard" aria-label="Organ, painel da empresa" className="shrink-0 rounded-lg">
            <LogoMark />
          </Link>
          <span aria-hidden="true" className="h-8 w-px bg-slate-200" />
          <div className="min-w-0">
            <p className="text-[11px] font-medium uppercase tracking-wide text-slate-500">Empresa</p>
            <p className="truncate text-base font-bold text-slate-900 sm:text-lg">{companyName}</p>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-3">
          {/* max-w + truncate: nome/email longo sem espaços não empurra o cabeçalho para fora da tela */}
          <div className="hidden max-w-[14rem] text-right sm:block">
            <p className="truncate text-sm font-semibold text-slate-900">{displayName}</p>
            <p className="truncate text-xs text-slate-500">
              {me.position ?? 'Sem cargo'} · {ROLE_LABELS[me.role]}
            </p>
          </div>
          <Avatar name={displayName} />

          {/* Form para logout usando Server Action */}
          <form action={logoutAction}>
            <button type="submit" className={buttonStyles({ variant: 'secondary', size: 'sm' })}>
              <LuLogOut aria-hidden="true" className="h-4 w-4" />
              Sair
            </button>
          </form>
        </div>
      </div>
    </header>
  );
}
