'use client';

import { useEffect, useId, useRef, type ReactNode } from 'react';
import { LuX } from 'react-icons/lu';

type ModalProps = {
  title: string;
  description?: string;
  // Chamado ao pressionar Esc, clicar no fundo ou no botão de fechar
  onClose: () => void;
  size?: 'sm' | 'md' | 'lg';
  children: ReactNode;
};

const SIZES = {
  sm: 'max-w-md',
  md: 'max-w-lg',
  lg: 'max-w-2xl',
};

// Campo que recebe o foco ao abrir: o marcado com data-autofocus ou o primeiro campo de texto
const INITIAL_FOCUS = '[data-autofocus], input:not([type="hidden"]):not([type="checkbox"]):not([type="radio"]), textarea';

/**
 * Janela modal sobre a página, feita com o <dialog> nativo: o navegador prende o foco dentro dela,
 * deixa o resto da página inerte e fecha com Esc. Monte o componente só quando for abrir
 * (assim o estado dos campos recomeça a cada abertura) e desmonte no onClose.
 */
export default function Modal({ title, description, onClose, size = 'md', children }: ModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  // Só fecha pelo fundo se o clique começou nele (arrastar para selecionar texto não fecha)
  const pressedOnBackdrop = useRef(false);
  const titleId = useId();
  const descriptionId = useId();

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    // Guarda quem abriu a janela para devolver o foco ao fechar
    const opener = document.activeElement instanceof HTMLElement ? document.activeElement : null;

    if (!dialog.open) dialog.showModal();
    dialog.querySelector<HTMLElement>(INITIAL_FOCUS)?.focus();

    // Trava a rolagem da página, sem deixá-la "pular" quando a barra de rolagem some
    const { style } = document.body;
    const previous = { overflow: style.overflow, paddingRight: style.paddingRight };
    const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
    style.overflow = 'hidden';
    if (scrollbarWidth > 0) style.paddingRight = `${scrollbarWidth}px`;

    return () => {
      style.overflow = previous.overflow;
      style.paddingRight = previous.paddingRight;
      if (dialog.open) dialog.close();
      if (opener?.isConnected) opener.focus();
    };
  }, []);

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby={titleId}
      aria-describedby={description ? descriptionId : undefined}
      // Esc: deixa o React desmontar a janela em vez de o navegador fechá-la sozinho
      onCancel={event => {
        event.preventDefault();
        onClose();
      }}
      onMouseDown={event => {
        pressedOnBackdrop.current = event.target === event.currentTarget;
      }}
      onClick={event => {
        if (pressedOnBackdrop.current && event.target === event.currentTarget) onClose();
      }}
      className={`modal m-auto w-[calc(100%-2rem)] ${SIZES[size]} overflow-hidden rounded-2xl border border-slate-200 bg-white p-0 text-slate-900 shadow-xl backdrop:bg-slate-900/50`}
    >
      <div className="flex max-h-[calc(100dvh-2rem)] flex-col">
        <div className="flex items-start justify-between gap-4 border-b border-slate-100 px-5 py-4">
          <div className="min-w-0">
            <h2 id={titleId} className="break-words text-lg font-semibold text-slate-900">
              {title}
            </h2>
            {description && (
              <p id={descriptionId} className="mt-0.5 break-words text-sm text-slate-500">
                {description}
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fechar"
            className="-mr-1.5 -mt-1 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900"
          >
            <LuX aria-hidden="true" className="h-5 w-5" />
          </button>
        </div>
        {children}
      </div>
    </dialog>
  );
}
