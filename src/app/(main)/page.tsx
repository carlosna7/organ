import MainFooter from '@/components/main/MainFooter';
import MainHeader from '@/components/main/MainHeader';
import DashboardMockup from '@/components/main/DashboardMockup';
import { STATUS_DOTS } from '@/components/ui/Badge';
import { buttonStyles, textLinkStyles } from '@/components/ui/Button';
import { TASK_STATUSES, TASK_STATUS_LABELS } from '@/lib/types';

import Link from 'next/link';
import React from 'react'
import { LuArrowRight, LuListChecks, LuMailPlus, LuUserCheck, LuUsers } from 'react-icons/lu';

// Recursos que o app já oferece (sem prometer o que não existe)
const FEATURES = [
  {
    icon: LuUsers,
    title: 'Equipe em um só lugar',
    text: 'Veja quem faz parte da empresa, o cargo de cada pessoa e quem é líder ou membro.',
  },
  {
    icon: LuMailPlus,
    title: 'Convites por email',
    text: 'O líder cadastra o email da pessoa e ela cria a própria conta com ele. Os convites pendentes ficam visíveis até o cadastro.',
  },
  {
    icon: LuUserCheck,
    title: 'Tarefas com responsáveis',
    text: 'Cada tarefa tem responsáveis com papéis claros: quem é o principal, quem apoia e quem só acompanha.',
  },
  {
    icon: LuListChecks,
    title: 'Status e filtros',
    text: 'Pendente, em andamento ou concluída. Filtre a lista por status e veja quando cada tarefa foi concluída.',
  },
];

const STEPS = [
  {
    title: 'Crie a empresa',
    text: 'Cadastre o nome da empresa e a sua conta. Você entra como líder.',
  },
  {
    title: 'Convide a equipe',
    text: 'Adicione o email de cada pessoa. Ela cria a conta em “Fui convidado” e já entra na sua empresa.',
  },
  {
    title: 'Organize as tarefas',
    text: 'Crie tarefas, escolha os responsáveis e acompanhe o status de cada uma até a conclusão.',
  },
];

const Home = () => {

  return (
    <>
      <MainHeader/>

      <main>
        {/* Hero */}
        <section className='relative overflow-hidden bg-gradient-to-b from-brand-50/70 to-white'>
          <div aria-hidden='true' className='pointer-events-none absolute -right-40 -top-40 h-[28rem] w-[28rem] rounded-full bg-brand-200/40 blur-3xl' />
          <div className='relative mx-auto grid max-w-6xl items-center gap-12 px-4 py-16 sm:px-6 lg:grid-cols-2 lg:py-24'>
            <div className='flex flex-col items-start gap-6'>
              <span className='inline-flex items-center gap-2 rounded-full border border-brand-200 bg-white px-3 py-1 text-xs font-semibold text-brand-700'>
                <span aria-hidden='true' className='h-1.5 w-1.5 rounded-full bg-brand-500' />
                Organizador de equipe e tarefas
              </span>
              <h1 className='text-4xl font-extrabold leading-tight tracking-tight text-slate-900 sm:text-5xl'>
                Sua equipe e suas tarefas, organizadas em um só lugar
              </h1>
              <p className='max-w-xl text-lg text-slate-600'>
                Crie a empresa, convide as pessoas pelo email e distribua as tarefas com responsáveis definidos.
                Todo mundo sabe o que está pendente, em andamento ou concluído.
              </p>
              <div className='flex w-full flex-col gap-3 sm:w-auto sm:flex-row'>
                <Link href='/create-company' className={buttonStyles({ size: 'lg' })}>
                  Criar minha empresa
                  <LuArrowRight aria-hidden='true' className='h-4 w-4' />
                </Link>
                <Link href='/register' className={buttonStyles({ variant: 'secondary', size: 'lg' })}>
                  Fui convidado
                </Link>
              </div>
              <p className='text-sm text-slate-600'>
                Já tem conta?{' '}
                <Link href='/login' className={textLinkStyles}>
                  Entrar
                </Link>
              </p>
            </div>

            <DashboardMockup className='w-full' />
          </div>
        </section>

        {/* Recursos */}
        <section id='recursos' aria-labelledby='recursos-title' className='scroll-mt-20 py-16 lg:py-24'>
          <div className='mx-auto max-w-6xl px-4 sm:px-6'>
            <div className='max-w-2xl'>
              <p className='text-sm font-semibold text-brand-600'>Recursos</p>
              <h2 id='recursos-title' className='mt-2 text-3xl font-bold tracking-tight text-slate-900'>
                O essencial para organizar o trabalho da equipe
              </h2>
              <p className='mt-3 text-slate-600'>
                Sem configurações complicadas: uma empresa, as pessoas que fazem parte dela e as tarefas de cada uma.
              </p>
            </div>

            <ul className='mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4'>
              {FEATURES.map(feature => (
                <li key={feature.title} className='rounded-2xl border border-slate-200 bg-white p-6 shadow-sm'>
                  <span className='flex h-10 w-10 items-center justify-center rounded-lg bg-brand-50 text-brand-600'>
                    <feature.icon aria-hidden='true' className='h-5 w-5' />
                  </span>
                  <h3 className='mt-4 font-semibold text-slate-900'>{feature.title}</h3>
                  <p className='mt-2 text-sm text-slate-600'>{feature.text}</p>
                </li>
              ))}
            </ul>

            <div className='mt-6 flex flex-wrap items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-6 py-4 text-sm text-slate-600'>
              <span className='font-medium text-slate-900'>Status das tarefas:</span>
              {TASK_STATUSES.map(status => (
                <span key={status} className='inline-flex items-center gap-2'>
                  <span aria-hidden='true' className={`h-2.5 w-2.5 rounded-full ${STATUS_DOTS[status]}`} />
                  {TASK_STATUS_LABELS[status]}
                </span>
              ))}
            </div>
          </div>
        </section>

        {/* Como funciona */}
        <section id='como-funciona' aria-labelledby='como-funciona-title' className='scroll-mt-20 bg-slate-50 py-16 lg:py-24'>
          <div className='mx-auto max-w-6xl px-4 sm:px-6'>
            <div className='max-w-2xl'>
              <p className='text-sm font-semibold text-brand-600'>Como funciona</p>
              <h2 id='como-funciona-title' className='mt-2 text-3xl font-bold tracking-tight text-slate-900'>
                Três passos para começar
              </h2>
            </div>

            <ol className='mt-10 grid gap-4 md:grid-cols-3'>
              {STEPS.map((step, index) => (
                <li key={step.title} className='relative rounded-2xl border border-slate-200 bg-white p-6 shadow-sm'>
                  <span className='flex h-9 w-9 items-center justify-center rounded-full bg-brand-600 text-sm font-bold text-white'>
                    {index + 1}
                  </span>
                  <h3 className='mt-4 font-semibold text-slate-900'>{step.title}</h3>
                  <p className='mt-2 text-sm text-slate-600'>{step.text}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* Chamada final */}
        <section aria-labelledby='cta-title' className='py-16 lg:py-24'>
          <div className='mx-auto max-w-6xl px-4 sm:px-6'>
            <div className='relative overflow-hidden rounded-3xl bg-gradient-to-br from-brand-600 to-brand-900 px-6 py-12 text-center sm:px-12'>
              <div aria-hidden='true' className='pointer-events-none absolute -right-20 -top-20 h-72 w-72 rounded-full bg-brand-400/30 blur-3xl' />
              <h2 id='cta-title' className='relative text-3xl font-bold tracking-tight text-white'>
                Comece a organizar sua equipe hoje
              </h2>
              <p className='relative mx-auto mt-3 max-w-xl text-brand-100'>
                Crie a empresa, convide as pessoas e acompanhe as tarefas em um painel simples.
              </p>
              <div className='relative mt-8 flex flex-col justify-center gap-3 sm:flex-row'>
                <Link
                  href='/create-company'
                  className={buttonStyles({ size: 'lg', className: '!bg-white !text-brand-700 hover:!bg-brand-50 focus-visible:!outline-white' })}
                >
                  Criar minha empresa
                </Link>
                <Link
                  href='/login'
                  className={buttonStyles({
                    variant: 'ghost',
                    size: 'lg',
                    className: 'border border-white/30 !text-white hover:!bg-white/10 focus-visible:!outline-white',
                  })}
                >
                  Entrar
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>

      <MainFooter/>
    </>
  )
}

export default Home;
