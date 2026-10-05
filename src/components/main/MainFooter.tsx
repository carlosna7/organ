import Link from 'next/link'
import React from 'react'
import Logo from '@/components/ui/Logo'

const FOOTER_LINKS = [
  { href: '/login', label: 'Entrar' },
  { href: '/register', label: 'Fui convidado' },
  { href: '/create-company', label: 'Criar empresa' },
]

// Rodapé da landing
const MainFooter = () => {
  return (
    <footer className='border-t border-slate-200 bg-white'>
      <div className='mx-auto flex max-w-6xl flex-col gap-6 px-4 py-10 sm:px-6 md:flex-row md:items-center md:justify-between'>
        <div className='flex flex-col gap-2'>
          <Logo />
          <p className='text-sm text-slate-500'>Organizador de equipe e tarefas.</p>
        </div>

        <nav aria-label='Acesso'>
          <ul className='flex flex-wrap gap-x-6 gap-y-2 text-sm font-medium text-slate-600'>
            {FOOTER_LINKS.map(link => (
              <li key={link.href}>
                <Link href={link.href} className='rounded transition-colors hover:text-slate-900'>
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>
      <div className='border-t border-slate-100'>
        <p className='mx-auto max-w-6xl px-4 py-4 text-xs text-slate-500 sm:px-6'>
          © {new Date().getFullYear()} Organ. Todos os direitos reservados.
        </p>
      </div>
    </footer>
  )
}

export default MainFooter
