import Link from 'next/link'
import React from 'react'
import { buttonStyles } from '@/components/ui/Button'
import Logo from '@/components/ui/Logo'

const NAV_LINKS = [
  { href: '#recursos', label: 'Recursos' },
  { href: '#como-funciona', label: 'Como funciona' },
]

// Cabeçalho da landing com logo, âncoras e botões de acesso
const MainHeader = () => {
  return (
    <header className='sticky top-0 z-30 border-b border-slate-200/80 bg-white/85 backdrop-blur'>
      <div className='mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3 sm:px-6'>
        <Link href='/' aria-label='Organ, página inicial' className='rounded-lg'>
          <Logo />
        </Link>

        <nav aria-label='Seções da página' className='hidden md:block'>
          <ul className='flex items-center gap-8 text-sm font-medium text-slate-600'>
            {NAV_LINKS.map(link => (
              <li key={link.href}>
                <a href={link.href} className='rounded transition-colors hover:text-slate-900'>
                  {link.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>

        <div className='flex items-center gap-2'>
          <Link href='/login' className={buttonStyles({ variant: 'ghost', size: 'sm' })}>
            Entrar
          </Link>
          <Link href='/create-company' className={buttonStyles({ variant: 'primary', size: 'sm' })}>
            Criar empresa
          </Link>
        </div>
      </div>
    </header>
  )
}

export default MainHeader
