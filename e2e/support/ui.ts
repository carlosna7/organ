import { expect, type BrowserContext, type Locator, type Page } from '@playwright/test';
import type { Account } from './api';
import { escapeRegExp } from './data';
import { AUTH_COOKIE, FRONT_URL } from './env';

/**
 * Espera o React hidratar a página: todo botão, link, form e campo visível ganha as props do React
 * (__reactProps$...). Antes disso, cliques em botões controlados pelo React (abrir formulário,
 * pedir confirmação) não fazem nada. Navegações feitas pelo próprio app já chegam hidratadas.
 * Os <input type="hidden" name="$ACTION_ID_..."> que o React injeta nos forms de Server Action
 * ficam fora da árvore do React e por isso são ignorados.
 */
export async function waitForHydration(page: Page): Promise<void> {
  await page.waitForFunction(() => {
    const elements = Array.from(
      document.querySelectorAll('button, a[href], form, input:not([type="hidden"]), select, textarea')
    );
    return (
      elements.length > 0 &&
      elements.every(element => Object.keys(element).some(key => key.startsWith('__reactProps$')))
    );
  });
}

/** Navega e espera a hidratação */
export async function visit(page: Page, url: string) {
  const response = await page.goto(url);
  await waitForHydration(page);
  return response;
}

/** Abre o dashboard (opcionalmente com ?status=) e confere que não houve redirecionamento */
export async function openDashboard(page: Page, query = ''): Promise<void> {
  await visit(page, `/dashboard${query}`);
  await expect(page).toHaveURL(new RegExp(`/dashboard${escapeRegExp(query)}$`));
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
}

/** Grava o JWT da conta no cookie de sessão (o mesmo que o app grava após o login) */
export async function signIn(context: BrowserContext, account: Pick<Account, 'token'>): Promise<void> {
  await context.addCookies([
    { name: AUTH_COOKIE, value: account.token, url: FRONT_URL, httpOnly: true, sameSite: 'Strict' },
  ]);
}

/** Valor atual do cookie de sessão no navegador (ou undefined) */
export async function sessionCookie(context: BrowserContext) {
  const cookies = await context.cookies(FRONT_URL);
  return cookies.find(cookie => cookie.name === AUTH_COOKIE);
}

/** Faz login pela tela /login */
export async function loginViaUI(page: Page, email: string, password: string): Promise<void> {
  await visit(page, '/login');
  await page.getByLabel('Email').fill(email);
  await page.getByLabel('Senha').fill(password);
  await page.getByRole('button', { name: 'Entrar' }).click();
  await expect(page).toHaveURL(/\/dashboard$/);
}

/**
 * Mensagens do app com role="alert" (Alert e FormError). Fica restrito ao <main> porque o
 * anunciador de rotas do Next (#__next-route-announcer__) também tem role="alert".
 */
export const appAlert = (page: Page) => page.getByRole('main').getByRole('alert');

/**
 * Promessa que resolve quando a próxima Server Action (POST com header Next-Action) responder.
 * Use quando duas submissões seguidas podem deixar a tela igual (ex.: o mesmo erro duas vezes).
 */
export function waitForServerAction(page: Page) {
  return page.waitForResponse(response => {
    const request = response.request();
    return request.method() === 'POST' && request.headers()['next-action'] !== undefined;
  });
}

/* ---------------------------------- Seções do dashboard ---------------------------------- */

export const teamSection = (page: Page) => page.getByRole('region', { name: 'Equipe' });
export const tasksSection = (page: Page) => page.getByRole('region', { name: 'Tarefas' });

/** Linha de um membro registrado na equipe (pelo email, que é único) */
export function memberRow(page: Page, email: string): Locator {
  return teamSection(page)
    .getByRole('listitem')
    .filter({ hasText: email })
    .filter({ hasNotText: 'Aguardando cadastro' });
}

/** Linha de um convite pendente */
export function inviteRow(page: Page, email: string): Locator {
  return teamSection(page).getByRole('listitem').filter({ hasText: email }).filter({ hasText: 'Aguardando cadastro' });
}

/** Título h3 de uma tarefa: "#<id>" seguido do nome */
export function taskHeading(scope: Page | Locator, taskName: string): Locator {
  return scope.getByRole('heading', { level: 3, name: new RegExp(`^#\\d+\\s*${escapeRegExp(taskName)}$`) });
}

/** Card de uma tarefa na lista */
export function taskCard(page: Page, taskName: string): Locator {
  return tasksSection(page).getByRole('listitem').filter({ has: taskHeading(page, taskName) });
}

/** Todos os cards de tarefa (itens da lista que têm título de tarefa) */
export function allTaskCards(page: Page): Locator {
  return tasksSection(page).getByRole('listitem').filter({ has: page.getByRole('heading', { level: 3 }) });
}

/** Badge de status ao lado do título da tarefa */
export function statusBadge(card: Locator): Locator {
  return card.getByRole('heading', { level: 3 }).locator('xpath=following-sibling::span[1]');
}

/** Chips de responsáveis de uma tarefa */
export function responsibleChips(card: Locator): Locator {
  return card.getByRole('list', { name: 'Responsáveis' }).getByRole('listitem');
}

/** Formulário "Nova tarefa" */
export const newTaskForm = (page: Page) => page.getByRole('form', { name: 'Nova tarefa' });

/** Formulário de edição de uma tarefa */
export const editTaskForm = (page: Page, taskName: string) =>
  page.getByRole('form', { name: `Editar a tarefa ${taskName}` });

/** Muda o status pelo seletor + botão "Atualizar" e espera o badge refletir */
export async function changeStatus(card: Locator, label: 'Pendente' | 'Em andamento' | 'Concluída') {
  await card.getByRole('combobox', { name: 'Status da tarefa' }).selectOption({ label });
  await card.getByRole('button', { name: 'Atualizar' }).click();
  await expect(statusBadge(card)).toHaveText(label);
}

/* ------------------------------------- Layout / console ------------------------------------- */

export type OverflowReport = {
  scrollWidth: number;
  bodyScrollWidth: number;
  clientWidth: number;
  offenders: string[];
};

/** Mede o overflow horizontal da página e lista os elementos que passam da largura da tela */
export async function measureHorizontalOverflow(page: Page): Promise<OverflowReport> {
  return page.evaluate(() => {
    const root = document.documentElement;
    const viewport = root.clientWidth;
    const describe = (element: Element) => {
      const id = element.id ? `#${element.id}` : '';
      const cls = typeof element.className === 'string' && element.className ? `.${element.className.trim().split(/\s+/).slice(0, 3).join('.')}` : '';
      const text = (element.textContent ?? '').trim().slice(0, 40);
      return `${element.tagName.toLowerCase()}${id}${cls} "${text}"`;
    };
    // Ignora o que está dentro de um contêiner que recorta ou rola na horizontal e cabe na tela
    const isContained = (element: Element) => {
      for (let parent = element.parentElement; parent && parent !== document.body; parent = parent.parentElement) {
        if (getComputedStyle(parent).overflowX !== 'visible') {
          const rect = parent.getBoundingClientRect();
          if (rect.left >= -1 && rect.right <= viewport + 1) return true;
        }
      }
      return false;
    };
    const offenders: string[] = [];
    for (const element of Array.from(document.body.querySelectorAll('*'))) {
      const rect = element.getBoundingClientRect();
      if (rect.width === 0 && rect.height === 0) continue;
      if ((rect.right > viewport + 1 || rect.left < -1) && !isContained(element)) {
        offenders.push(`${describe(element)} [left=${Math.round(rect.left)} right=${Math.round(rect.right)}]`);
      }
    }
    return {
      scrollWidth: root.scrollWidth,
      bodyScrollWidth: document.body.scrollWidth,
      clientWidth: viewport,
      offenders: offenders.slice(0, 15),
    };
  });
}

/** Falha se a página tiver rolagem horizontal (scrollWidth > clientWidth) */
export async function expectNoHorizontalOverflow(page: Page, label: string): Promise<void> {
  // Mede com a fonte final carregada (a troca de fonte muda a largura dos textos)
  await page.evaluate(() => document.fonts.ready.then(() => undefined));
  const report = await measureHorizontalOverflow(page);
  const details = `${label}: scrollWidth=${report.scrollWidth}, body.scrollWidth=${report.bodyScrollWidth}, clientWidth=${report.clientWidth}. Elementos fora da tela: ${report.offenders.join(' | ') || 'nenhum'}`;
  expect(report.scrollWidth, details).toBeLessThanOrEqual(report.clientWidth);
  expect(report.bodyScrollWidth, details).toBeLessThanOrEqual(report.clientWidth);
}

/** Coleta erros de console e exceções não tratadas da página */
export function collectConsoleErrors(page: Page): string[] {
  const errors: string[] = [];
  page.on('console', message => {
    if (message.type() === 'error') errors.push(`console.error: ${message.text()} (${message.location().url})`);
  });
  page.on('pageerror', error => errors.push(`pageerror: ${error.message}`));
  return errors;
}
