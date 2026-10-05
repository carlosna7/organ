import { expect, test } from './support/fixtures';
import { person, uniqueCompanyName, uniqueEmail } from './support/data';
import { AUTH_COOKIE, E2E_JWT_SECRET } from './support/env';
import { contractPayload, signTestJwt } from './support/jwt';
import { appAlert, loginViaUI, memberRow, sessionCookie, signIn, teamSection, visit, waitForHydration } from './support/ui';
import type { Locator, Page } from '@playwright/test';

const SESSION_EXPIRED = 'Sua sessão expirou. Faça login novamente.';
const GENERIC_ERROR = 'Erro inesperado. Tente novamente.';

/** Preenche o formulário de /create-company (já aberto) */
async function fillCreateCompany(
  page: Page,
  data: { company: string; name: string; position: string; email: string; password: string }
) {
  await page.getByLabel('Nome da empresa').fill(data.company);
  await page.getByLabel('Nome', { exact: true }).fill(data.name);
  await page.getByLabel('Cargo').fill(data.position);
  await page.getByLabel('Email').fill(data.email);
  await page.getByLabel('Senha').fill(data.password);
}

/** Preenche o formulário de /register (já aberto) */
async function fillRegister(page: Page, data: { name: string; position: string; email: string; password: string }) {
  await page.getByLabel('Nome', { exact: true }).fill(data.name);
  await page.getByLabel('Cargo').fill(data.position);
  await page.getByLabel('Email convidado').fill(data.email);
  await page.getByLabel('Senha').fill(data.password);
}

/** Estado de validação nativa (HTML5) de um campo */
async function validity(field: Locator) {
  return field.evaluate(element => {
    const { valid, typeMismatch, tooShort, valueMissing } = (element as HTMLInputElement).validity;
    return { valid, typeMismatch, tooShort, valueMissing };
  });
}

/** Desliga a validação nativa do navegador para exercitar a validação do servidor */
async function disableNativeValidation(page: Page) {
  await page.locator('form').evaluate(form => {
    (form as HTMLFormElement).noValidate = true;
  });
}

test.describe('Autenticação', () => {
  test.describe('Criar empresa', () => {
    test('criar empresa leva ao dashboard como líder', async ({ page, api }) => {
      const company = uniqueCompanyName();
      const leader = person('Lia');

      await visit(page, '/');
      await page.getByRole('banner').getByRole('link', { name: 'Criar empresa' }).click();
      await expect(page).toHaveURL(/\/create-company$/);
      await expect(page).toHaveTitle('Criar empresa | Organ');
      await waitForHydration(page);

      await fillCreateCompany(page, { company, ...leader });
      await page.getByRole('button', { name: 'Criar empresa' }).click();

      await expect(page).toHaveURL(/\/dashboard$/);
      await expect(page).toHaveTitle('Painel | Organ');
      await expect(page.getByRole('heading', { level: 1, name: 'Olá, Lia' })).toBeVisible();
      await expect(page.getByRole('banner')).toContainText(company);

      const me = memberRow(page, leader.email);
      await expect(me).toContainText(leader.name);
      await expect(me).toContainText('(você)');
      await expect(me).toContainText('Líder');
      await expect(teamSection(page).getByRole('heading', { name: 'Membros (1)' })).toBeVisible();
      // Controle exclusivo do líder
      await expect(page.getByLabel('Convidar por email')).toBeVisible();
      // Sem tarefas: o formulário "Nova tarefa" já começa aberto
      await expect(page.getByRole('form', { name: 'Nova tarefa' })).toBeVisible();

      // O JWT fica num cookie httpOnly + SameSite=Strict, invisível para o JavaScript da página
      const cookie = await sessionCookie(page.context());
      expect(cookie, 'cookie de sessão gravado').toBeDefined();
      expect(cookie?.httpOnly).toBe(true);
      expect(cookie?.sameSite).toBe('Strict');
      // next start roda com NODE_ENV=production: cookie "secure" (aceito em http://localhost)
      expect(cookie?.secure).toBe(true);
      expect(await page.evaluate(() => document.cookie)).not.toContain(AUTH_COOKIE);

      // A API registrou o criador como líder
      const token = await api.login(leader.email, leader.password);
      const employees = await api.getEmployees(token);
      expect(employees).toEqual([
        expect.objectContaining({ employeeId: 1, email: leader.email, role: 'leader', isRegistered: true }),
      ]);
    });

    test('empresa duplicada (ignorando maiúsculas) mostra erro e não cria nada', async ({ page, api }) => {
      const existing = await api.createCompany();
      const leader = person('Caio');

      await visit(page, '/create-company');
      await fillCreateCompany(page, { company: existing.name.toUpperCase(), ...leader });
      await page.getByRole('button', { name: 'Criar empresa' }).click();

      await expect(page).toHaveURL(/\/create-company\?error=company_exists$/);
      await expect(appAlert(page)).toHaveText('Já existe uma empresa com esse nome.');
      expect(await sessionCookie(page.context())).toBeUndefined();
      // O líder da tentativa não foi criado
      await expect(api.login(leader.email, leader.password)).rejects.toThrow(/BAD_USER_INPUT/);
    });

    test('email já cadastrado em outra empresa mostra erro', async ({ page, api }) => {
      const existing = await api.createCompany();

      await visit(page, '/create-company');
      await fillCreateCompany(page, {
        ...person('Caio'),
        company: uniqueCompanyName(),
        email: existing.leader.email,
      });
      await page.getByRole('button', { name: 'Criar empresa' }).click();

      await expect(page).toHaveURL(/\/create-company\?error=email_exists$/);
      await expect(appAlert(page)).toHaveText('Este email já está cadastrado.');
      expect(await sessionCookie(page.context())).toBeUndefined();
    });

    test('validações: email inválido, senha curta e campos em branco', async ({ page }) => {
      const data = { ...person('Caio'), company: uniqueCompanyName() };
      await visit(page, '/create-company');

      // Email sem formato válido: o navegador barra o envio (type="email")
      await fillCreateCompany(page, { ...data, email: 'nao-e-um-email' });
      await page.getByRole('button', { name: 'Criar empresa' }).click();
      expect(await validity(page.getByLabel('Email'))).toMatchObject({ valid: false, typeMismatch: true });
      await expect(page).toHaveURL(/\/create-company$/);

      // "lia@empresa" passa no navegador, mas o servidor exige domínio com ponto
      await page.getByLabel('Email').fill('lia@empresa');
      await page.getByRole('button', { name: 'Criar empresa' }).click();
      await expect(page).toHaveURL(/\/create-company\?error=invalid_email$/);
      await expect(appAlert(page)).toHaveText('Email inválido.');

      // Senha curta: o navegador barra (minLength=6)...
      await waitForHydration(page);
      await fillCreateCompany(page, { ...data, password: '12345' });
      await page.getByRole('button', { name: 'Criar empresa' }).click();
      expect(await validity(page.getByLabel('Senha'))).toMatchObject({ valid: false, tooShort: true });
      await expect(page).toHaveURL(/\/create-company\?error=invalid_email$/);

      // ...e o servidor também valida, se a validação nativa for contornada
      await disableNativeValidation(page);
      await page.getByRole('button', { name: 'Criar empresa' }).click();
      await expect(page).toHaveURL(/\/create-company\?error=weak_password$/);
      await expect(appAlert(page)).toHaveText('A senha deve ter pelo menos 6 caracteres.');

      // Campos só com espaços passam no "required", mas o servidor recusa
      await waitForHydration(page);
      await fillCreateCompany(page, { ...data, name: '   ' });
      await page.getByRole('button', { name: 'Criar empresa' }).click();
      await expect(page).toHaveURL(/\/create-company\?error=missing_fields$/);
      await expect(appAlert(page)).toHaveText('Por favor, preencha todos os campos.');

      expect(await sessionCookie(page.context())).toBeUndefined();
    });
  });

  test.describe('Login e logout', () => {
    test('login com sucesso (email com maiúsculas é normalizado)', async ({ page, api }) => {
      const company = await api.createCompany();

      await visit(page, '/');
      await page.getByRole('banner').getByRole('link', { name: 'Entrar' }).click();
      await expect(page).toHaveURL(/\/login$/);
      await expect(page).toHaveTitle('Entrar | Organ');
      await waitForHydration(page);

      await page.getByLabel('Email').fill(company.leader.email.toUpperCase());
      await page.getByLabel('Senha').fill(company.leader.password);
      await page.getByRole('button', { name: 'Entrar' }).click();

      await expect(page).toHaveURL(/\/dashboard$/);
      await expect(page.getByRole('heading', { level: 1, name: 'Olá, Lia' })).toBeVisible();
      await expect(page.getByRole('banner')).toContainText(company.name);
      await expect(memberRow(page, company.leader.email)).toContainText('(você)');
      expect(await sessionCookie(page.context())).toBeDefined();
    });

    test('login com credenciais erradas mostra a mensagem na tela', async ({ page, api }) => {
      const company = await api.createCompany();
      const invite = await api.invite(company.leader.token);

      const attempts = [
        { label: 'senha errada', email: company.leader.email, password: 'senha-errada' },
        { label: 'email inexistente', email: uniqueEmail('ninguem'), password: company.leader.password },
        // Convite ainda não cadastrado não tem senha: também não entra
        { label: 'convite pendente', email: invite.email, password: company.leader.password },
      ];

      for (const attempt of attempts) {
        await test.step(attempt.label, async () => {
          await visit(page, '/login');
          await page.getByLabel('Email').fill(attempt.email);
          await page.getByLabel('Senha').fill(attempt.password);
          await page.getByRole('button', { name: 'Entrar' }).click();

          await expect(page).toHaveURL(/\/login\?error=invalid_credentials$/);
          await expect(appAlert(page)).toHaveText('Email ou senha inválidos.');
          expect(await sessionCookie(page.context())).toBeUndefined();
        });
      }

      // Continua sem acesso ao painel
      await page.goto('/dashboard');
      await expect(page).toHaveURL(/\/login$/);
    });

    test('logout pelo botão "Sair" apaga a sessão', async ({ page, api }) => {
      const company = await api.createCompany();
      await loginViaUI(page, company.leader.email, company.leader.password);
      await expect(page.getByRole('heading', { level: 1, name: 'Olá, Lia' })).toBeVisible();

      await page.getByRole('button', { name: 'Sair' }).click();

      await expect(page).toHaveURL(/\/login$/);
      await expect(page.getByRole('heading', { level: 1, name: 'Entrar no Organ' })).toBeVisible();
      await expect(appAlert(page)).toHaveCount(0);
      expect(await sessionCookie(page.context())).toBeUndefined();

      await page.goto('/dashboard');
      await expect(page).toHaveURL(/\/login$/);
    });
  });

  test.describe('Cadastro de convidado', () => {
    test('convidado se cadastra e entra como membro', async ({ page, api }) => {
      const company = await api.createCompany();
      const member = person('Bruno');
      await api.invite(company.leader.token, member.email);

      await visit(page, '/login');
      await page.getByRole('link', { name: 'Fui convidado' }).click();
      await expect(page).toHaveURL(/\/register$/);
      await expect(page).toHaveTitle('Criar conta | Organ');
      await waitForHydration(page);

      await fillRegister(page, member);
      await page.getByRole('button', { name: 'Criar conta' }).click();

      await expect(page).toHaveURL(/\/dashboard$/);
      await expect(page.getByRole('heading', { level: 1, name: 'Olá, Bruno' })).toBeVisible();
      await expect(page.getByRole('banner')).toContainText(company.name);

      const me = memberRow(page, member.email);
      await expect(me).toContainText(member.name);
      await expect(me).toContainText(member.position);
      await expect(me).toContainText('(você)');
      await expect(me).toContainText('Membro');
      await expect(memberRow(page, company.leader.email)).toContainText('Líder');
      await expect(teamSection(page).getByRole('heading', { name: 'Membros (2)' })).toBeVisible();
      // O convite foi usado: não está mais pendente
      await expect(teamSection(page).getByRole('heading', { name: 'Convites pendentes (0)' })).toBeVisible();
      // Membro não convida
      await expect(page.getByLabel('Convidar por email')).toHaveCount(0);

      const employees = await api.getEmployees(company.leader.token);
      expect(employees.find(employee => employee.email === member.email)).toEqual(
        expect.objectContaining({ role: 'member', isRegistered: true, name: member.name, position: member.position })
      );
    });

    test('cadastro com email não convidado mostra erro', async ({ page }) => {
      await visit(page, '/register');
      await fillRegister(page, person('Davi'));
      await page.getByRole('button', { name: 'Criar conta' }).click();

      await expect(page).toHaveURL(/\/register\?error=not_invited$/);
      await expect(appAlert(page)).toHaveText('Este email não foi convidado por nenhuma empresa.');
      expect(await sessionCookie(page.context())).toBeUndefined();
    });

    test('cadastro com email já registrado mostra erro', async ({ page, api }) => {
      const company = await api.createCompany();
      const member = await api.addMember(company);

      for (const email of [company.leader.email, member.email]) {
        await test.step(email === member.email ? 'convite já usado' : 'email do líder', async () => {
          await visit(page, '/register');
          await fillRegister(page, { ...person('Davi'), email });
          await page.getByRole('button', { name: 'Criar conta' }).click();

          await expect(page).toHaveURL(/\/register\?error=already_registered$/);
          await expect(appAlert(page)).toHaveText('Este email já está cadastrado. Faça login.');
          expect(await sessionCookie(page.context())).toBeUndefined();
        });
      }

      // O cadastro existente não foi alterado: a senha original continua valendo
      await expect(api.login(member.email, member.password)).resolves.toEqual(expect.any(String));
    });

    test('validações do cadastro: email inválido e senha curta', async ({ page, api }) => {
      const company = await api.createCompany();
      const member = person('Davi');
      await api.invite(company.leader.token, member.email);

      await visit(page, '/register');
      await fillRegister(page, { ...member, email: 'davi@convite' });
      await page.getByRole('button', { name: 'Criar conta' }).click();
      await expect(page).toHaveURL(/\/register\?error=invalid_email$/);
      await expect(appAlert(page)).toHaveText('Email inválido.');

      await waitForHydration(page);
      await fillRegister(page, { ...member, password: '123' });
      await page.getByRole('button', { name: 'Criar conta' }).click();
      expect(await validity(page.getByLabel('Senha'))).toMatchObject({ valid: false, tooShort: true });
      await disableNativeValidation(page);
      await page.getByRole('button', { name: 'Criar conta' }).click();
      await expect(page).toHaveURL(/\/register\?error=weak_password$/);
      await expect(appAlert(page)).toHaveText('A senha deve ter pelo menos 6 caracteres.');

      // O convite continua pendente
      const employees = await api.getEmployees(company.leader.token);
      expect(employees.find(employee => employee.email === member.email)?.isRegistered).toBe(false);
    });
  });

  test.describe('Proteção de rotas', () => {
    test('rotas de autenticação redirecionam para /dashboard quando logado', async ({ page, api }) => {
      const company = await api.createCompany();
      await signIn(page.context(), company.leader);

      for (const path of ['/login', '/register', '/create-company', '/login?error=session_expired']) {
        await page.goto(path);
        await expect(page, `${path} deveria redirecionar`).toHaveURL(/\/dashboard$/);
      }

      // Também pela navegação do app (link "Entrar" da página inicial)
      await visit(page, '/');
      await page.getByRole('banner').getByRole('link', { name: 'Entrar' }).click();
      await expect(page).toHaveURL(/\/dashboard$/);
      await expect(page.getByRole('heading', { level: 1, name: 'Olá, Lia' })).toBeVisible();
    });

    test('/dashboard sem login vai para /login', async ({ page }) => {
      for (const path of ['/dashboard', '/dashboard?status=pendente']) {
        await page.goto(path);
        await expect(page).toHaveURL(/\/login$/);
        await expect(page.getByRole('heading', { level: 1, name: 'Entrar no Organ' })).toBeVisible();
        // Sem cookie não é "sessão expirada"
        await expect(appAlert(page)).toHaveCount(0);
      }
    });

    const now = Math.floor(Date.now() / 1000);
    const fakeCookies: { label: string; token: string }[] = [
      { label: 'texto que não é JWT', token: 'token-falso' },
      { label: 'JWT assinado com outro segredo', token: signTestJwt(contractPayload(), 'outro-segredo-qualquer') },
      { label: 'JWT vencido', token: signTestJwt(contractPayload({ iat: now - 7200, exp: now - 3600 }), E2E_JWT_SECRET) },
      {
        label: 'JWT sem os campos do contrato',
        token: signTestJwt({ sub: 'abc', iat: now, exp: now + 3600 }, E2E_JWT_SECRET),
      },
      {
        label: 'JWT com alg "none"',
        token: `${Buffer.from(JSON.stringify({ alg: 'none', typ: 'JWT' })).toString('base64url')}.${Buffer.from(
          JSON.stringify(contractPayload())
        ).toString('base64url')}.`,
      },
    ];

    for (const fake of fakeCookies) {
      test(`cookie falso (${fake.label}) vai para /login?error=session_expired com a mensagem`, async ({ page }) => {
        await signIn(page.context(), { token: fake.token });

        await page.goto('/dashboard');

        await expect(page).toHaveURL(/\/login\?error=session_expired$/);
        await expect(appAlert(page)).toHaveText(SESSION_EXPIRED);
        expect(await sessionCookie(page.context()), 'o cookie inválido é apagado').toBeUndefined();
      });
    }

    test('JWT válido de funcionário que não existe na API também expira a sessão', async ({ page }) => {
      // Assinatura e formato corretos: passa no middleware, mas a API não reconhece o funcionário
      await signIn(page.context(), { token: signTestJwt(contractPayload(), E2E_JWT_SECRET) });

      await page.goto('/dashboard');

      await expect(page).toHaveURL(/\/login\?error=session_expired$/);
      await expect(appAlert(page)).toHaveText(SESSION_EXPIRED);
      expect(await sessionCookie(page.context())).toBeUndefined();
    });

    test('cookie falso numa rota de autenticação só é apagado', async ({ page }) => {
      await signIn(page.context(), { token: 'token-falso' });

      await page.goto('/login');

      await expect(page).toHaveURL(/\/login$/);
      await expect(appAlert(page)).toHaveCount(0);
      expect(await sessionCookie(page.context())).toBeUndefined();
    });

    test('?error=constructor (e outros nomes herdados) não quebra a página', async ({ page }) => {
      const pages = [
        { path: '/login', heading: 'Entrar no Organ' },
        { path: '/register', heading: 'Criar sua conta' },
        { path: '/create-company', heading: 'Criar sua empresa' },
      ];
      const codes = ['constructor', '__proto__', 'toString', 'hasOwnProperty', 'valueOf', 'codigo-desconhecido'];

      for (const { path, heading } of pages) {
        for (const query of [...codes.map(code => `error=${code}`), 'error=session_expired&error=network_error']) {
          await test.step(`${path}?${query}`, async () => {
            const response = await page.goto(`${path}?${query}`);
            expect(response?.status()).toBe(200);
            await expect(page.getByRole('heading', { level: 1, name: heading })).toBeVisible();
            await expect(appAlert(page)).toHaveText(GENERIC_ERROR);
            await expect(page.getByText('Algo deu errado')).toHaveCount(0);
          });
        }
      }
    });

    test('mensagens conhecidas de ?error= aparecem nas telas', async ({ page }) => {
      await page.goto('/login?error=session_expired');
      await expect(appAlert(page)).toHaveText(SESSION_EXPIRED);
      await page.goto('/register?error=not_invited');
      await expect(appAlert(page)).toHaveText('Este email não foi convidado por nenhuma empresa.');
      await page.goto('/create-company?error=company_exists');
      await expect(appAlert(page)).toHaveText('Já existe uma empresa com esse nome.');
    });
  });
});
