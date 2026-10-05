import { expect, test } from './support/fixtures';
import { escapeRegExp, todayInAppTimeZone, uid } from './support/data';
import { APP_TIME_ZONE } from './support/env';
import {
  allTaskCards,
  changeStatus,
  editTaskForm,
  newTaskForm,
  openDialog,
  openView,
  responsibleChips,
  statusBadge,
  taskCard,
  tasksSection,
  taskHeading,
  waitForServerAction,
} from './support/ui';
import type { Locator, Page } from '@playwright/test';
import type { Account } from './support/api';

/** Regex do chip de responsável: "<nome> · <nível>" (as iniciais do avatar ficam antes) */
const chip = (account: Pick<Account, 'name'>, level: 'Principal' | 'Apoio' | 'Acompanha') =>
  new RegExp(`${escapeRegExp(account.name)}\\s*· ${level}$`);

/** Datas aceitas para "hoje" (cobre a virada do dia durante o teste) */
function todayVariants(): RegExp {
  const before = todayInAppTimeZone(APP_TIME_ZONE);
  const after = todayInAppTimeZone(APP_TIME_ZONE, new Date(Date.now() + 60_000));
  return new RegExp(`(${escapeRegExp(before)}|${escapeRegExp(after)})`);
}

const completedAtText = (card: Locator) => card.getByText(/^Concluída em /);
const tasksCount = (page: Page) => tasksSection(page).getByRole('heading', { name: 'Tarefas', exact: true }).locator('xpath=following-sibling::p[1]');
const statusFilter = (page: Page) => page.getByRole('navigation', { name: 'Filtrar tarefas por status' });

test.describe('Tarefas', () => {
  test.describe('Criar', () => {
    test('criar tarefa sem responsáveis: o criador vira o responsável principal', async ({ page, api, loginAs }) => {
      const company = await api.createCompany();
      await api.addMember(company, { firstName: 'Bruno' });
      await loginAs(company.leader, 'tarefas');

      // Sem tarefas, a tela mostra o aviso e o cadastro só abre ao clicar no botão
      await expect(newTaskForm(page)).toHaveCount(0);
      await expect(tasksSection(page).getByText('Nenhuma tarefa por aqui ainda')).toBeVisible();
      await expect(tasksCount(page)).toHaveText('0 tarefas');
      const form = await openDialog(page, tasksSection(page).getByRole('button', { name: 'Nova tarefa' }), 'Nova tarefa');

      const name = `Planejar sprint ${uid()}`;
      await form.getByLabel('Nome da tarefa').fill(name);
      await form.getByLabel('Descrição (opcional)').fill('Primeira linha\nSegunda linha');
      for (const checkbox of await form.getByRole('checkbox').all()) {
        await expect(checkbox).not.toBeChecked();
      }
      await form.getByRole('button', { name: 'Criar tarefa' }).click();

      const card = taskCard(page, name);
      await expect(card).toBeVisible();
      // A janela fecha e volta o botão "Nova tarefa"
      await expect(form).toHaveCount(0);
      await expect(tasksSection(page).getByRole('button', { name: 'Nova tarefa' })).toBeVisible();

      await expect(card.getByRole('heading', { level: 3 })).toHaveText(new RegExp(`^#1\\s*${escapeRegExp(name)}$`));
      await expect(statusBadge(card)).toHaveText('Pendente');
      await expect(card).toContainText('Primeira linha');
      await expect(card).toContainText('Segunda linha');
      await expect(responsibleChips(card)).toHaveText([chip(company.leader, 'Principal')]);
      await expect(card.getByText(/^Criada em /)).toHaveText(todayVariants());
      await expect(completedAtText(card)).toHaveCount(0);
      await expect(tasksCount(page)).toHaveText('1 tarefa');

      const [task] = await api.getTasks(company.leader.token);
      expect(task).toMatchObject({
        taskId: 1,
        taskName: name,
        // O navegador envia as quebras de linha do <textarea> como CRLF
        description: expect.stringMatching(/^Primeira linha\r?\nSegunda linha$/),
        status: 'pendente',
        completedAt: null,
        responsibles: [{ leadershipLevel: 3, employee: { employeeId: company.leader.employeeId } }],
      });
    });

    test('criar tarefa com responsáveis e níveis', async ({ page, api, loginAs }) => {
      const company = await api.createCompany();
      const bruno = await api.addMember(company, { firstName: 'Bruno' });
      const carla = await api.addMember(company, { firstName: 'Carla' });
      const davi = await api.addMember(company, { firstName: 'Davi' });
      const invite = await api.addInvite(company);
      await api.createTask(company.leader.token, { taskName: `Tarefa existente ${uid()}` });
      await loginAs(company.leader, 'tarefas');

      const form = await openDialog(page, tasksSection(page).getByRole('button', { name: 'Nova tarefa' }), 'Nova tarefa');

      // Só funcionários registrados podem ser responsáveis (o convite pendente não aparece)
      await expect(form.getByRole('checkbox')).toHaveCount(4);
      await expect(form).not.toContainText(invite.email);

      const pick = async (account: Account, level?: '3 - Principal' | '2 - Apoio' | '1 - Acompanha') => {
        await form.getByRole('checkbox', { name: new RegExp(`^${escapeRegExp(account.name)}`) }).check();
        if (level) await form.getByRole('combobox', { name: `Nível de ${account.name}` }).selectOption({ label: level });
      };
      await pick(company.leader); // nível padrão: 3 - Principal
      await pick(bruno, '2 - Apoio');
      await pick(carla, '1 - Acompanha');
      // Nível de quem não foi marcado é ignorado
      await form.getByRole('combobox', { name: `Nível de ${davi.name}` }).selectOption({ label: '1 - Acompanha' });

      const name = `Revisar contrato ${uid()}`;
      await form.getByLabel('Nome da tarefa').fill(name);
      await form.getByRole('button', { name: 'Criar tarefa' }).click();

      const card = taskCard(page, name);
      // Ordenados do nível mais alto para o mais baixo
      await expect(responsibleChips(card)).toHaveText([
        chip(company.leader, 'Principal'),
        chip(bruno, 'Apoio'),
        chip(carla, 'Acompanha'),
      ]);
      await expect(card).not.toContainText(davi.name);
      await expect(tasksCount(page)).toHaveText('2 tarefas');
      // A mais recente aparece primeiro
      await expect(allTaskCards(page).first()).toContainText(name);

      const task = (await api.getTasks(company.leader.token)).find(item => item.taskName === name);
      const levels = Object.fromEntries(
        (task?.responsibles ?? []).map(responsible => [responsible.employee?.employeeId, responsible.leadershipLevel])
      );
      expect(levels).toEqual({
        [company.leader.employeeId]: 3,
        [bruno.employeeId]: 2,
        [carla.employeeId]: 1,
      });
    });

    test('nome só com espaços não cria a tarefa', async ({ page, api, loginAs }) => {
      const company = await api.createCompany();
      await loginAs(company.leader, 'tarefas');

      const form = await openDialog(page, tasksSection(page).getByRole('button', { name: 'Nova tarefa' }), 'Nova tarefa');
      await form.getByLabel('Nome da tarefa').fill('    ');
      await form.getByRole('button', { name: 'Criar tarefa' }).click();

      await expect(form.getByRole('alert')).toHaveText('Informe o nome da tarefa.');
      // A janela continua aberta para corrigir
      await expect(form).toBeVisible();
      await form.getByRole('button', { name: 'Cancelar' }).click();
      await expect(form).toHaveCount(0);
      await expect(allTaskCards(page)).toHaveCount(0);
      expect(await api.getTasks(company.leader.token)).toEqual([]);
    });
    test('nome com HTML é exibido como texto (sem executar nada)', async ({ page, api, loginAs }) => {
      const company = await api.createCompany();
      await loginAs(company.leader, 'tarefas');
      const dialogs: string[] = [];
      page.on('dialog', dialog => {
        dialogs.push(dialog.message());
        void dialog.dismiss();
      });

      const name = `<img src=x onerror="alert('xss')"><b>negrito</b> ${uid()}`;
      const form = await openDialog(page, tasksSection(page).getByRole('button', { name: 'Nova tarefa' }), 'Nova tarefa');
      await form.getByLabel('Nome da tarefa').fill(name);
      await form.getByRole('button', { name: 'Criar tarefa' }).click();

      const card = taskCard(page, name);
      await expect(card.getByRole('heading', { level: 3 })).toContainText(name);
      await expect(tasksSection(page).locator('img, b')).toHaveCount(0);
      expect(dialogs).toEqual([]);
    });
  });

  test.describe('Formulários reabertos', () => {
    test('reabrir "Nova tarefa" não mostra o erro da tentativa anterior', async ({ page, api, loginAs }) => {
      const company = await api.createCompany();
      await api.createTask(company.leader.token, { taskName: `Existente ${uid()}` });
      await loginAs(company.leader, 'tarefas');

      const trigger = tasksSection(page).getByRole('button', { name: 'Nova tarefa' });
      await openDialog(page, trigger, 'Nova tarefa');
      await newTaskForm(page).getByLabel('Nome da tarefa').fill('   ');
      await newTaskForm(page).getByRole('button', { name: 'Criar tarefa' }).click();
      await expect(newTaskForm(page).getByRole('alert')).toHaveText('Informe o nome da tarefa.');
      await newTaskForm(page).getByRole('button', { name: 'Cancelar' }).click();
      await expect(newTaskForm(page)).toHaveCount(0);

      await openDialog(page, trigger, 'Nova tarefa');
      await expect(newTaskForm(page).getByLabel('Nome da tarefa')).toHaveValue('');
      await expect(newTaskForm(page).getByRole('alert'), 'erro antigo no formulário reaberto').toHaveCount(0, {
        timeout: 3_000,
      });
    });

    test('reabrir "Editar" não mostra o erro da tentativa anterior', async ({ page, api, loginAs }) => {
      const company = await api.createCompany();
      const task = await api.createTask(company.leader.token, { taskName: `Editar ${uid()}` });
      await loginAs(company.leader, 'tarefas');

      const trigger = taskCard(page, task.taskName).getByRole('button', { name: `Editar a tarefa ${task.taskName}` });
      const form = editTaskForm(page);
      await trigger.click();
      for (const checkbox of await form.getByRole('checkbox').all()) await checkbox.uncheck();
      await form.getByRole('button', { name: 'Salvar' }).click();
      await expect(form.getByRole('alert')).toHaveText('Selecione ao menos um responsável.');
      await form.getByRole('button', { name: 'Cancelar' }).click();
      await expect(form).toHaveCount(0);

      await trigger.click();
      await expect(form.getByRole('checkbox', { name: new RegExp(`^${escapeRegExp(company.leader.name)}`) })).toBeChecked();
      await expect(form.getByRole('alert'), 'erro antigo no formulário reaberto').toHaveCount(0, { timeout: 3_000 });
    });
  });

  test.describe('Status e filtro', () => {
    test('mudar status até concluída (data de conclusão aparece) e voltar', async ({ page, api, loginAs }) => {
      const company = await api.createCompany();
      const task = await api.createTask(company.leader.token, { taskName: `Publicar site ${uid()}` });
      await loginAs(company.leader, 'tarefas');

      const card = taskCard(page, task.taskName);
      const select = card.getByRole('combobox', { name: 'Status da tarefa' });
      await expect(statusBadge(card)).toHaveText('Pendente');
      await expect(select).toHaveValue('pendente');
      await expect(completedAtText(card)).toHaveCount(0);

      await changeStatus(card, 'Em andamento');
      await expect(select).toHaveValue('em_andamento');
      await expect(completedAtText(card)).toHaveCount(0);
      expect((await api.getTask(company.leader.token, task.taskId))?.status).toBe('em_andamento');

      await changeStatus(card, 'Concluída');
      await expect(select).toHaveValue('concluida');
      await expect(completedAtText(card)).toHaveText(new RegExp(`^Concluída em ${todayVariants().source}$`));
      const completed = await api.getTask(company.leader.token, task.taskId);
      expect(completed?.status).toBe('concluida');
      expect(completed?.completedAt).toEqual(expect.any(String));

      // Persistido após recarregar
      await openView(page, 'tarefas');
      await expect(statusBadge(card)).toHaveText('Concluída');
      await expect(completedAtText(card)).toBeVisible();

      // Voltar: a data de conclusão some
      await changeStatus(card, 'Em andamento');
      await expect(completedAtText(card)).toHaveCount(0);
      await changeStatus(card, 'Pendente');
      await expect(select).toHaveValue('pendente');
      await expect(completedAtText(card)).toHaveCount(0);
      const reopened = await api.getTask(company.leader.token, task.taskId);
      expect(reopened).toMatchObject({ status: 'pendente', completedAt: null });
    });

    test('filtro por status', async ({ page, api, loginAs }) => {
      const company = await api.createCompany();
      const token = company.leader.token;
      const pending = await api.createTask(token, { taskName: `Pendente ${uid()}` });
      const doing = await api.createTask(token, { taskName: `Andamento ${uid()}` });
      const done = await api.createTask(token, { taskName: `Concluída ${uid()}` });
      await api.setTaskStatus(token, doing.taskId, 'em_andamento');
      await api.setTaskStatus(token, done.taskId, 'concluida');
      await loginAs(company.leader, 'tarefas');

      const filters = statusFilter(page);
      await expect(filters.getByRole('link', { name: 'Todas' })).toHaveAttribute('aria-current', 'page');
      await expect(allTaskCards(page)).toHaveCount(3);
      await expect(tasksCount(page)).toHaveText('3 tarefas');

      const cases = [
        { link: 'Pendente', query: 'pendente', visible: pending },
        { link: 'Em andamento', query: 'em_andamento', visible: doing },
        { link: 'Concluída', query: 'concluida', visible: done },
      ] as const;
      for (const { link, query, visible } of cases) {
        await test.step(link, async () => {
          await filters.getByRole('link', { name: link, exact: true }).click();
          await expect(page).toHaveURL(new RegExp(`/dashboard\\?view=tarefas&layout=list&status=${query}$`));
          await expect(filters.getByRole('link', { name: link, exact: true })).toHaveAttribute('aria-current', 'page');
          await expect(filters.getByRole('link', { name: 'Todas' })).not.toHaveAttribute('aria-current');
          await expect(allTaskCards(page)).toHaveCount(1);
          await expect(taskHeading(tasksSection(page), visible.taskName)).toBeVisible();
          await expect(tasksCount(page)).toHaveText(`1 tarefa · ${link}`);
        });
      }

      await filters.getByRole('link', { name: 'Todas' }).click();
      await expect(page).toHaveURL(/\/dashboard\?view=tarefas&layout=list$/);
      await expect(allTaskCards(page)).toHaveCount(3);

      // Mudar o status dentro do filtro tira a tarefa da lista filtrada
      await filters.getByRole('link', { name: 'Pendente', exact: true }).click();
      await expect(page).toHaveURL(/\/dashboard\?view=tarefas&layout=list&status=pendente$/);
      const card = taskCard(page, pending.taskName);
      await card.getByRole('combobox', { name: 'Status da tarefa' }).selectOption({ label: 'Em andamento' });
      await card.getByRole('button', { name: 'Atualizar' }).click();
      await expect(allTaskCards(page)).toHaveCount(0);
      await expect(tasksSection(page).getByText('Nenhuma tarefa com status “Pendente”')).toBeVisible();
      await expect(tasksCount(page)).toHaveText('0 tarefas · Pendente');
      // Lista filtrada vazia não abre o formulário "Nova tarefa" sozinho
      await expect(newTaskForm(page)).toHaveCount(0);

      await tasksSection(page).getByRole('link', { name: 'Ver todas as tarefas' }).click();
      await expect(page).toHaveURL(/\/dashboard\?view=tarefas&layout=list$/);
      await expect(allTaskCards(page)).toHaveCount(3);

      // Status desconhecido na URL mostra todas
      await openView(page, 'tarefas', '&status=invalido');
      await expect(allTaskCards(page)).toHaveCount(3);
      await expect(filters.getByRole('link', { name: 'Todas' })).toHaveAttribute('aria-current', 'page');
    });
  });

  test.describe('Editar e excluir (líder)', () => {
    test('editar nome, descrição e responsáveis', async ({ page, api, loginAs }) => {
      const company = await api.createCompany();
      const bruno = await api.addMember(company, { firstName: 'Bruno' });
      const carla = await api.addMember(company, { firstName: 'Carla' });
      const task = await api.createTask(company.leader.token, {
        taskName: `Nome antigo ${uid()}`,
        description: 'Descrição antiga',
        responsibles: [
          { employeeId: company.leader.employeeId, leadershipLevel: 3 },
          { employeeId: bruno.employeeId, leadershipLevel: 1 },
        ],
      });
      await loginAs(company.leader, 'tarefas');

      await taskCard(page, task.taskName).getByRole('button', { name: `Editar a tarefa ${task.taskName}` }).click();
      const form = editTaskForm(page);

      // Pré-preenchido com os dados atuais
      await expect(form.getByLabel('Nome da tarefa')).toHaveValue(task.taskName);
      await expect(form.getByLabel('Descrição')).toHaveValue('Descrição antiga');
      const checkbox = (account: Account) =>
        form.getByRole('checkbox', { name: new RegExp(`^${escapeRegExp(account.name)}`) });
      const level = (account: Account) => form.getByRole('combobox', { name: `Nível de ${account.name}` });
      await expect(checkbox(company.leader)).toBeChecked();
      await expect(level(company.leader)).toHaveValue('3');
      await expect(checkbox(bruno)).toBeChecked();
      await expect(level(bruno)).toHaveValue('1');
      await expect(checkbox(carla)).not.toBeChecked();

      const newName = `Nome novo ${uid()}`;
      await form.getByLabel('Nome da tarefa').fill(newName);
      await form.getByLabel('Descrição').fill('Descrição nova');
      await checkbox(company.leader).uncheck();
      await level(bruno).selectOption('3');
      await checkbox(carla).check();
      await level(carla).selectOption('2');
      await form.getByRole('button', { name: 'Salvar' }).click();

      await expect(form).toHaveCount(0);
      const card = taskCard(page, newName);
      await expect(card).toBeVisible();
      await expect(taskCard(page, task.taskName)).toHaveCount(0);
      await expect(card).toContainText('Descrição nova');
      await expect(responsibleChips(card)).toHaveText([chip(bruno, 'Principal'), chip(carla, 'Apoio')]);

      const saved = await api.getTask(company.leader.token, task.taskId);
      expect(saved?.taskName).toBe(newName);
      expect(saved?.description).toBe('Descrição nova');
      expect(
        Object.fromEntries((saved?.responsibles ?? []).map(item => [item.employee?.employeeId, item.leadershipLevel]))
      ).toEqual({ [bruno.employeeId]: 3, [carla.employeeId]: 2 });

      // Apagar a descrição remove o texto do card
      await card.getByRole('button', { name: `Editar a tarefa ${newName}` }).click();
      await editTaskForm(page).getByLabel('Descrição').fill('');
      await editTaskForm(page).getByRole('button', { name: 'Salvar' }).click();
      await expect(editTaskForm(page)).toHaveCount(0);
      await expect(card).not.toContainText('Descrição nova');
      expect((await api.getTask(company.leader.token, task.taskId))?.description).toBeNull();
    });

    test('editar: erro ao tirar todos os responsáveis (a tarefa não muda)', async ({ page, api, loginAs }) => {
      const company = await api.createCompany();
      const bruno = await api.addMember(company, { firstName: 'Bruno' });
      const task = await api.createTask(company.leader.token, {
        taskName: `Sem responsável ${uid()}`,
        responsibles: [
          { employeeId: company.leader.employeeId, leadershipLevel: 3 },
          { employeeId: bruno.employeeId, leadershipLevel: 2 },
        ],
      });
      await loginAs(company.leader, 'tarefas');

      const card = taskCard(page, task.taskName);
      await card.getByRole('button', { name: `Editar a tarefa ${task.taskName}` }).click();
      const form = editTaskForm(page);
      await form.getByLabel('Nome da tarefa').fill(`${task.taskName} alterado`);
      for (const checkbox of await form.getByRole('checkbox').all()) await checkbox.uncheck();
      await form.getByRole('button', { name: 'Salvar' }).click();

      await expect(form.getByRole('alert')).toHaveText('Selecione ao menos um responsável.');
      // O formulário continua aberto para corrigir
      await expect(form).toBeVisible();

      // Nome só com espaços também é recusado
      await form.getByRole('checkbox', { name: new RegExp(`^${escapeRegExp(bruno.name)}`) }).check();
      await form.getByLabel('Nome da tarefa').fill('   ');
      const action = waitForServerAction(page);
      await form.getByRole('button', { name: 'Salvar' }).click();
      await action;
      await expect(form.getByRole('alert')).toHaveText('Informe o nome da tarefa.');

      await form.getByRole('button', { name: 'Cancelar' }).click();
      await expect(form).toHaveCount(0);
      await expect(responsibleChips(card)).toHaveText([chip(company.leader, 'Principal'), chip(bruno, 'Apoio')]);

      const unchanged = await api.getTask(company.leader.token, task.taskId);
      expect(unchanged?.taskName).toBe(task.taskName);
      expect(unchanged?.responsibles).toHaveLength(2);
    });

    test('excluir com confirmação', async ({ page, api, loginAs }) => {
      const company = await api.createCompany();
      const keep = await api.createTask(company.leader.token, { taskName: `Manter ${uid()}` });
      const remove = await api.createTask(company.leader.token, { taskName: `Excluir ${uid()}` });
      await loginAs(company.leader, 'tarefas');
      await expect(tasksCount(page)).toHaveText('2 tarefas');

      const card = taskCard(page, remove.taskName);
      const deleteButton = card.getByRole('button', { name: `Excluir a tarefa ${remove.taskName}` });

      // Cancelar não exclui
      await deleteButton.click();
      await card.getByRole('button', { name: 'Cancelar', exact: true }).click();
      await expect(deleteButton).toBeVisible();
      await expect(card).toBeVisible();

      await deleteButton.click();
      await card.getByRole('button', { name: `Confirmar exclusão: Excluir a tarefa ${remove.taskName}` }).click();

      await expect(taskCard(page, remove.taskName)).toHaveCount(0);
      await expect(taskCard(page, keep.taskName)).toBeVisible();
      await expect(tasksCount(page)).toHaveText('1 tarefa');

      await openView(page, 'tarefas');
      await expect(taskCard(page, remove.taskName)).toHaveCount(0);
      expect((await api.getTasks(company.leader.token)).map(task => task.taskId)).toEqual([keep.taskId]);
    });
  });

  test.describe('Permissões do membro', () => {
    test('membro só muda o status das tarefas em que é responsável e não vê editar/excluir', async ({
      page,
      api,
      loginAs,
    }) => {
      const company = await api.createCompany();
      const bruno = await api.addMember(company, { firstName: 'Bruno' });
      const mine = await api.createTask(company.leader.token, {
        taskName: `Do Bruno ${uid()}`,
        responsibles: [
          { employeeId: company.leader.employeeId, leadershipLevel: 3 },
          { employeeId: bruno.employeeId, leadershipLevel: 1 },
        ],
      });
      const notMine = await api.createTask(company.leader.token, { taskName: `Só da líder ${uid()}` });
      await loginAs(bruno, 'tarefas');

      // Nenhum controle de líder na página
      await expect(page.getByRole('button', { name: /^Editar a tarefa/ })).toHaveCount(0);
      await expect(page.getByRole('button', { name: /^Excluir a tarefa/ })).toHaveCount(0);

      const mineCard = taskCard(page, mine.taskName);
      const notMineCard = taskCard(page, notMine.taskName);
      await expect(mineCard.getByRole('combobox', { name: 'Status da tarefa' })).toBeVisible();
      await expect(notMineCard.getByRole('combobox', { name: 'Status da tarefa' })).toHaveCount(0);
      await expect(notMineCard.getByRole('button')).toHaveCount(0);

      await changeStatus(mineCard, 'Em andamento');
      expect((await api.getTask(company.leader.token, mine.taskId))?.status).toBe('em_andamento');

      // Membro cria tarefa sem responsáveis: vira o principal e pode mudar o status
      const ownName = `Criada pelo Bruno ${uid()}`;
      const ownForm = await openDialog(page, tasksSection(page).getByRole('button', { name: 'Nova tarefa' }), 'Nova tarefa');
      await ownForm.getByLabel('Nome da tarefa').fill(ownName);
      await ownForm.getByRole('button', { name: 'Criar tarefa' }).click();
      const ownCard = taskCard(page, ownName);
      await expect(responsibleChips(ownCard)).toHaveText([chip(bruno, 'Principal')]);
      await changeStatus(ownCard, 'Concluída');
      await expect(ownCard.getByRole('button', { name: /^(Editar|Excluir)/ })).toHaveCount(0);

      // Membro cria tarefa só para a líder: não pode mudar o status dela depois
      const forLeader = `Para a líder ${uid()}`;
      const form = await openDialog(page, tasksSection(page).getByRole('button', { name: 'Nova tarefa' }), 'Nova tarefa');
      await form.getByLabel('Nome da tarefa').fill(forLeader);
      await form.getByRole('checkbox', { name: new RegExp(`^${escapeRegExp(company.leader.name)}`) }).check();
      await form.getByRole('button', { name: 'Criar tarefa' }).click();
      const forLeaderCard = taskCard(page, forLeader);
      await expect(responsibleChips(forLeaderCard)).toHaveText([chip(company.leader, 'Principal')]);
      await expect(forLeaderCard.getByRole('combobox', { name: 'Status da tarefa' })).toHaveCount(0);

      expect((await api.getTask(company.leader.token, notMine.taskId))?.status).toBe('pendente');
    });

    test('membro que deixou de ser responsável recebe erro ao mudar o status', async ({ page, api, loginAs }) => {
      const company = await api.createCompany();
      const bruno = await api.addMember(company, { firstName: 'Bruno' });
      const task = await api.createTask(company.leader.token, {
        taskName: `Troca de responsável ${uid()}`,
        responsibles: [{ employeeId: bruno.employeeId, leadershipLevel: 3 }],
      });
      await loginAs(bruno, 'tarefas');
      const card = taskCard(page, task.taskName);
      await expect(card.getByRole('combobox', { name: 'Status da tarefa' })).toBeVisible();

      // Com a página aberta, a líder tira o Bruno da tarefa
      await api.updateTask(company.leader.token, task.taskId, {
        responsibles: [{ employeeId: company.leader.employeeId, leadershipLevel: 3 }],
      });

      await card.getByRole('combobox', { name: 'Status da tarefa' }).selectOption({ label: 'Concluída' });
      await card.getByRole('button', { name: 'Atualizar' }).click();

      await expect(card.getByRole('alert')).toHaveText('Apenas o líder ou um responsável pode alterar o status!');
      await expect(statusBadge(card)).toHaveText('Pendente');
      expect((await api.getTask(company.leader.token, task.taskId))?.status).toBe('pendente');
    });
  });
});
