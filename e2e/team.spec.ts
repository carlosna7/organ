import { expect, test } from './support/fixtures';
import { escapeRegExp, person, uid, uniqueEmail } from './support/data';
import {
  appAlert,
  inviteRow,
  loginViaUI,
  memberRow,
  newTaskForm,
  openDashboard,
  responsibleChips,
  sessionCookie,
  taskCard,
  tasksSection,
  teamSection,
  waitForHydration,
  waitForServerAction,
} from './support/ui';
import type { Page } from '@playwright/test';

const SESSION_EXPIRED = 'Sua sessão expirou. Faça login novamente.';

const membersHeading = (page: Page, count: number) =>
  teamSection(page).getByRole('heading', { name: `Membros (${count})` });
const invitesHeading = (page: Page, count: number) =>
  teamSection(page).getByRole('heading', { name: `Convites pendentes (${count})` });

test.describe('Equipe', () => {
  test.describe('Líder', () => {
    test('líder convida por email e o convite aparece como pendente', async ({ page, api, loginAs }) => {
      const company = await api.createCompany();
      await loginAs(company.leader);
      const email = uniqueEmail('convidado');

      await expect(invitesHeading(page, 0)).toBeVisible();
      await expect(
        teamSection(page).getByText('Nenhum convite pendente. Convide alguém pelo email para montar a equipe.')
      ).toBeVisible();

      // Maiúsculas são normalizadas antes de gravar
      const field = page.getByLabel('Convidar por email');
      await field.fill(email.toUpperCase());
      await page.getByRole('button', { name: 'Convidar', exact: true }).click();

      await expect(teamSection(page).getByRole('status')).toHaveText(
        'Convite registrado. A pessoa já pode se cadastrar com esse email.'
      );
      await expect(field).toHaveValue('');
      await expect(inviteRow(page, email)).toBeVisible();
      await expect(invitesHeading(page, 1)).toBeVisible();
      // Convite não conta como membro
      await expect(membersHeading(page, 1)).toBeVisible();

      const employees = await api.getEmployees(company.leader.token);
      expect(employees).toContainEqual(
        expect.objectContaining({ email, isRegistered: false, role: 'member', name: null, position: null })
      );

      // Persistido: continua lá depois de recarregar
      await page.reload();
      await expect(inviteRow(page, email)).toBeVisible();
    });

    test('convite com email inválido ou já cadastrado mostra erro', async ({ page, api, loginAs }) => {
      const company = await api.createCompany();
      const pending = await api.addInvite(company);
      const other = await api.createCompany();
      await loginAs(company.leader);

      const attempts = [
        // Passa na validação do navegador, mas não na do servidor (domínio sem ponto)
        { label: 'formato inválido', email: 'pessoa@empresa', message: 'Email inválido.' },
        { label: 'email do próprio líder', email: company.leader.email, message: 'Email já está cadastrado!' },
        { label: 'convite já existente', email: pending.email, message: 'Email já está cadastrado!' },
        { label: 'líder de outra empresa', email: other.leader.email, message: 'Email já está cadastrado!' },
      ];

      for (const attempt of attempts) {
        await test.step(attempt.label, async () => {
          const button = page.getByRole('button', { name: 'Convidar', exact: true });
          await page.getByLabel('Convidar por email').fill(attempt.email);
          const action = waitForServerAction(page);
          await button.click();
          await action;
          // Enquanto envia, o botão vira "Convidando..."; o nome "Convidar" volta quando a resposta foi aplicada
          await expect(button).toBeEnabled();
          await expect(teamSection(page).getByRole('alert')).toHaveText(attempt.message);
          await expect(teamSection(page).getByRole('status')).toHaveCount(0);
        });
      }

      await expect(invitesHeading(page, 1)).toBeVisible();
      expect(await api.getEmployees(company.leader.token)).toHaveLength(2);
    });

    test('líder cancela um convite pendente (com confirmação)', async ({ page, api, loginAs }) => {
      const company = await api.createCompany();
      const keep = await api.addInvite(company);
      const cancel = await api.addInvite(company);
      await loginAs(company.leader);
      await expect(invitesHeading(page, 2)).toBeVisible();

      const row = inviteRow(page, cancel.email);
      const trigger = row.getByRole('button', { name: `Cancelar convite de ${cancel.email}` });

      // Desistir mantém o convite
      await trigger.click();
      await row.getByRole('button', { name: 'Manter convite' }).click();
      await expect(row.getByRole('button', { name: 'Manter convite' })).toHaveCount(0);
      await expect(inviteRow(page, cancel.email)).toBeVisible();

      // Confirmar cancela
      await trigger.click();
      await expect(row.getByRole('button', { name: 'Manter convite' })).toBeVisible();
      await row.getByRole('button', { name: `Cancelar convite de ${cancel.email}` }).click();

      await expect(inviteRow(page, cancel.email)).toHaveCount(0);
      await expect(inviteRow(page, keep.email)).toBeVisible();
      await expect(invitesHeading(page, 1)).toBeVisible();

      const emails = (await api.getEmployees(company.leader.token)).map(employee => employee.email);
      expect(emails).not.toContain(cancel.email);
      expect(emails).toContain(keep.email);
      // Sem convite, o email não consegue mais se cadastrar
      await expect(api.register({ ...person('Davi'), email: cancel.email })).rejects.toThrow(/NOT_FOUND/);
    });

    test('líder remove um membro: some da equipe e dos responsáveis', async ({ page, api, loginAs }) => {
      const company = await api.createCompany();
      const bruno = await api.addMember(company, { firstName: 'Bruno' });
      const carla = await api.addMember(company, { firstName: 'Carla' });
      const shared = await api.createTask(company.leader.token, {
        taskName: `Tarefa compartilhada ${uid()}`,
        responsibles: [
          { employeeId: company.leader.employeeId, leadershipLevel: 3 },
          { employeeId: bruno.employeeId, leadershipLevel: 2 },
          { employeeId: carla.employeeId, leadershipLevel: 1 },
        ],
      });
      const onlyBruno = await api.createTask(company.leader.token, {
        taskName: `Tarefa só do Bruno ${uid()}`,
        responsibles: [{ employeeId: bruno.employeeId, leadershipLevel: 3 }],
      });
      await loginAs(company.leader);

      const sharedCard = taskCard(page, shared.taskName);
      await expect(responsibleChips(sharedCard)).toHaveText([
        new RegExp(`${escapeRegExp(company.leader.name)}\\s*· Principal$`),
        new RegExp(`${escapeRegExp(bruno.name)}\\s*· Apoio$`),
        new RegExp(`${escapeRegExp(carla.name)}\\s*· Acompanha$`),
      ]);
      await expect(membersHeading(page, 3)).toBeVisible();

      const row = memberRow(page, bruno.email);
      const removeButton = row.getByRole('button', { name: `Remover ${bruno.name}`, exact: true });

      // "Cancelar" desiste da remoção
      await removeButton.click();
      await row.getByRole('button', { name: 'Cancelar', exact: true }).click();
      await expect(removeButton).toBeVisible();

      await removeButton.click();
      await row.getByRole('button', { name: `Confirmar remoção de ${bruno.name}` }).click();

      await expect(memberRow(page, bruno.email)).toHaveCount(0);
      await expect(membersHeading(page, 2)).toBeVisible();
      await expect(memberRow(page, carla.email)).toBeVisible();
      // Saiu dos responsáveis de todas as tarefas
      await expect(responsibleChips(sharedCard)).toHaveText([
        new RegExp(`${escapeRegExp(company.leader.name)}\\s*· Principal$`),
        new RegExp(`${escapeRegExp(carla.name)}\\s*· Acompanha$`),
      ]);
      await expect(responsibleChips(taskCard(page, onlyBruno.taskName))).toHaveCount(0);
      await expect(tasksSection(page)).not.toContainText(bruno.name);
      // E não aparece mais para ser escolhido como responsável
      await tasksSection(page).getByRole('button', { name: 'Nova tarefa' }).click();
      await expect(newTaskForm(page).getByRole('checkbox', { name: new RegExp(escapeRegExp(bruno.name)) })).toHaveCount(0);
      await expect(newTaskForm(page).getByRole('checkbox', { name: new RegExp(escapeRegExp(carla.name)) })).toBeVisible();

      // Conferência na API
      const employees = await api.getEmployees(company.leader.token);
      expect(employees.map(employee => employee.email)).not.toContain(bruno.email);
      const tasks = await api.getTasks(company.leader.token);
      for (const task of tasks) {
        expect(task.responsibles.map(responsible => responsible.employee?.employeeId)).not.toContain(bruno.employeeId);
      }
    });

    test('não aparece botão de remover para o próprio líder', async ({ page, api, loginAs }) => {
      const company = await api.createCompany();
      const bruno = await api.addMember(company, { firstName: 'Bruno' });
      const carla = await api.addMember(company, { firstName: 'Carla' });
      await loginAs(company.leader);

      const me = memberRow(page, company.leader.email);
      await expect(me).toContainText('(você)');
      await expect(me.getByRole('button')).toHaveCount(0);
      await expect(page.getByRole('button', { name: `Remover ${company.leader.name}` })).toHaveCount(0);

      // Os outros membros têm o botão
      await expect(memberRow(page, bruno.email).getByRole('button', { name: `Remover ${bruno.name}` })).toBeVisible();
      await expect(memberRow(page, carla.email).getByRole('button', { name: `Remover ${carla.name}` })).toBeVisible();
      await expect(teamSection(page).getByRole('button', { name: /^Remover / })).toHaveCount(2);
    });
  });

  test.describe('Membro', () => {
    test('membro não vê convite nem remover', async ({ page, api, loginAs }) => {
      const company = await api.createCompany();
      const bruno = await api.addMember(company, { firstName: 'Bruno' });
      const carla = await api.addMember(company, { firstName: 'Carla' });
      await loginAs(bruno);

      const team = teamSection(page);
      await expect(memberRow(page, bruno.email)).toContainText('Membro');
      await expect(memberRow(page, company.leader.email)).toContainText('Líder');
      await expect(memberRow(page, carla.email)).toBeVisible();
      await expect(page.getByLabel('Convidar por email')).toHaveCount(0);
      await expect(page.getByRole('button', { name: 'Convidar', exact: true })).toHaveCount(0);
      await expect(team.getByRole('button')).toHaveCount(0);
      // Sem convites: o texto do membro não sugere convidar
      await expect(team.getByText('Nenhum convite pendente.', { exact: true })).toBeVisible();

      // Com um convite pendente, o membro vê o convite, mas não pode cancelá-lo
      const invite = await api.addInvite(company);
      await openDashboard(page);
      await expect(inviteRow(page, invite.email)).toBeVisible();
      await expect(invitesHeading(page, 1)).toBeVisible();
      await expect(team.getByRole('button')).toHaveCount(0);
    });

    for (const how of ['recarregar o painel', 'mudar o status de uma tarefa', 'usar o filtro de status'] as const) {
      test(`membro removido perde a sessão (ao ${how})`, async ({ page, api, openSession }) => {
        const company = await api.createCompany();
        const bruno = await api.addMember(company, { firstName: 'Bruno' });
        const task = await api.createTask(company.leader.token, {
          taskName: `Tarefa do Bruno ${uid()}`,
          responsibles: [{ employeeId: bruno.employeeId, leadershipLevel: 3 }],
        });

        // Bruno entra pela tela de login (cookie gravado pelo próprio app)
        await loginViaUI(page, bruno.email, bruno.password);
        await expect(page.getByRole('heading', { level: 1, name: 'Olá, Bruno' })).toBeVisible();
        await waitForHydration(page);

        // O líder remove o Bruno em outro navegador
        const leaderPage = await openSession(company.leader);
        const row = memberRow(leaderPage, bruno.email);
        await row.getByRole('button', { name: `Remover ${bruno.name}`, exact: true }).click();
        await row.getByRole('button', { name: `Confirmar remoção de ${bruno.name}` }).click();
        await expect(memberRow(leaderPage, bruno.email)).toHaveCount(0);

        // A página do Bruno ainda está aberta; a próxima requisição é rejeitada pela API
        if (how === 'recarregar o painel') {
          await page.reload();
        } else if (how === 'mudar o status de uma tarefa') {
          const card = taskCard(page, task.taskName);
          await card.getByRole('combobox', { name: 'Status da tarefa' }).selectOption({ label: 'Concluída' });
          await card.getByRole('button', { name: 'Atualizar' }).click();
        } else {
          await page
            .getByRole('navigation', { name: 'Filtrar tarefas por status' })
            .getByRole('link', { name: 'Pendente' })
            .click();
        }

        await expect(page).toHaveURL(/\/login\?error=session_expired$/);
        await expect(appAlert(page)).toHaveText(SESSION_EXPIRED);
        expect(await sessionCookie(page.context()), 'cookie apagado').toBeUndefined();

        // Não volta ao painel nem consegue entrar de novo
        await page.goto('/dashboard');
        await expect(page).toHaveURL(/\/login$/);
        await loginAttemptFails(page, bruno.email, bruno.password);

        // O status da tarefa não foi alterado
        expect((await api.getTask(company.leader.token, task.taskId))?.status).toBe('pendente');
      });
    }
  });
});

async function loginAttemptFails(page: Page, email: string, password: string) {
  await waitForHydration(page);
  await page.getByLabel('Email').fill(email);
  await page.getByLabel('Senha').fill(password);
  await page.getByRole('button', { name: 'Entrar' }).click();
  await expect(page).toHaveURL(/\/login\?error=invalid_credentials$/);
  await expect(appAlert(page)).toHaveText('Email ou senha inválidos.');
}
