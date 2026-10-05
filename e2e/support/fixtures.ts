import { test as base, type BrowserContext, type Page } from '@playwright/test';
import { OrganApi, type Account } from './api';
import { openDashboard, openView, signIn, type DashboardView } from './ui';

type Fixtures = {
  /** Cliente da organ-api para preparar estado (empresa, convites, tarefas) */
  api: OrganApi;
  /** Loga a conta na página principal do teste (cookie de sessão) e abre uma seção do dashboard (padrão: resumo) */
  loginAs: (account: Account, view?: DashboardView, page?: Page) => Promise<Page>;
  /** Abre outro navegador (contexto isolado) já logado com a conta, numa seção do dashboard (padrão: resumo) */
  openSession: (account: Account, view?: DashboardView) => Promise<Page>;
};

export const test = base.extend<Fixtures>({
  api: async ({ request }, use) => {
    await use(new OrganApi(request));
  },

  loginAs: async ({ page: defaultPage }, use) => {
    await use(async (account, view = 'resumo', page = defaultPage) => {
      await signIn(page.context(), account);
      await (view === 'resumo' ? openDashboard(page) : openView(page, view));
      return page;
    });
  },

  openSession: async ({ browser }, use) => {
    const contexts: BrowserContext[] = [];
    await use(async (account, view = 'resumo') => {
      // As opções do projeto (baseURL, locale, viewport...) também valem para contextos novos
      const context = await browser.newContext();
      contexts.push(context);
      await signIn(context, account);
      const page = await context.newPage();
      await (view === 'resumo' ? openDashboard(page) : openView(page, view));
      return page;
    });
    await Promise.all(contexts.map(context => context.close()));
  },
});

export { expect } from '@playwright/test';
