import { expect, test } from './support/fixtures';
import { uid } from './support/data';
import {
  collectConsoleErrors,
  editTaskForm,
  memberRow,
  newTaskForm,
  openDashboard,
  signIn,
  taskCard,
  tasksSection,
  visit,
} from './support/ui';
import type { Page } from '@playwright/test';

/** Todo campo visível da página tem nome acessível (label) */
async function expectLabelledFields(page: Page, label: string) {
  const fields = page.locator('input:not([type="hidden"]), select, textarea');
  const count = await fields.count();
  expect(count, `${label}: deveria ter campos`).toBeGreaterThan(0);
  for (let index = 0; index < count; index++) {
    await expect(fields.nth(index), `${label}: campo #${index} sem rótulo`).toHaveAccessibleName(/\S/);
  }
}

test.describe('Acessibilidade básica', () => {
  test.describe('Foco nos formulários de tarefa', () => {
    test('"Nova tarefa": foco vai para "Nome da tarefa" ao abrir e volta ao botão ao cancelar', async ({
      page,
      api,
      loginAs,
    }) => {
      const company = await api.createCompany();
      await api.createTask(company.leader.token, { taskName: `Existente ${uid()}` });
      await loginAs(company.leader);

      const trigger = tasksSection(page).getByRole('button', { name: 'Nova tarefa' });
      const nameField = newTaskForm(page).getByLabel('Nome da tarefa');

      await trigger.click();
      await expect(nameField).toBeFocused();
      await newTaskForm(page).getByRole('button', { name: 'Cancelar' }).click();
      await expect(newTaskForm(page)).toHaveCount(0);
      await expect(trigger).toBeFocused();

      // Pelo teclado: Enter no botão abre, o foco vai para o campo; Tab segue para a descrição
      await page.keyboard.press('Enter');
      await expect(nameField).toBeFocused();
      await page.keyboard.press('Tab');
      await expect(newTaskForm(page).getByLabel('Descrição (opcional)')).toBeFocused();

      // Criar a tarefa (Enter no campo envia o formulário) também devolve o foco ao botão
      const name = `Criada pelo teclado ${uid()}`;
      await nameField.fill(name);
      await nameField.press('Enter');
      await expect(taskCard(page, name)).toBeVisible();
      await expect(newTaskForm(page)).toHaveCount(0);
      await expect(trigger).toBeFocused();
    });

    test('"Editar": foco vai para "Nome da tarefa" ao abrir e volta ao botão ao cancelar', async ({
      page,
      api,
      loginAs,
    }) => {
      const company = await api.createCompany();
      const task = await api.createTask(company.leader.token, { taskName: `Para editar ${uid()}` });
      await loginAs(company.leader);

      const card = taskCard(page, task.taskName);
      const trigger = card.getByRole('button', { name: `Editar a tarefa ${task.taskName}` });
      const form = editTaskForm(page, task.taskName);

      await trigger.click();
      await expect(form.getByLabel('Nome da tarefa')).toBeFocused();
      await form.getByRole('button', { name: 'Cancelar' }).click();
      await expect(form).toHaveCount(0);
      await expect(trigger).toBeFocused();

      // Pelo teclado
      await page.keyboard.press('Enter');
      await expect(form.getByLabel('Nome da tarefa')).toBeFocused();

      // Salvar devolve o foco ao botão "Editar" (já com o nome novo)
      const newName = `Editada ${uid()}`;
      await form.getByLabel('Nome da tarefa').fill(newName);
      await form.getByRole('button', { name: 'Salvar' }).click();
      await expect(form).toHaveCount(0);
      await expect(taskCard(page, newName).getByRole('button', { name: `Editar a tarefa ${newName}` })).toBeFocused();
    });

    test('"Nova tarefa" aberto por padrão (sem tarefas) não rouba o foco', async ({ page, api, loginAs }) => {
      const company = await api.createCompany();
      await loginAs(company.leader);

      await expect(newTaskForm(page)).toBeVisible();
      await expect(newTaskForm(page).getByLabel('Nome da tarefa')).not.toBeFocused();
      expect(await page.evaluate(() => document.activeElement === document.body)).toBe(true);
    });

    test('confirmações: foco vai para o botão de confirmar e volta ao cancelar', async ({ page, api, loginAs }) => {
      const company = await api.createCompany();
      const bruno = await api.addMember(company, { firstName: 'Bruno' });
      const task = await api.createTask(company.leader.token, { taskName: `Para excluir ${uid()}` });
      await loginAs(company.leader);

      const card = taskCard(page, task.taskName);
      const deleteButton = card.getByRole('button', { name: `Excluir a tarefa ${task.taskName}` });
      await deleteButton.click();
      await expect(card.getByRole('button', { name: `Confirmar exclusão: Excluir a tarefa ${task.taskName}` })).toBeFocused();
      await card.getByRole('button', { name: 'Cancelar', exact: true }).click();
      await expect(deleteButton).toBeFocused();

      const row = memberRow(page, bruno.email);
      const removeButton = row.getByRole('button', { name: `Remover ${bruno.name}`, exact: true });
      await removeButton.click();
      await expect(row.getByRole('button', { name: `Confirmar remoção de ${bruno.name}` })).toBeFocused();
      await row.getByRole('button', { name: 'Cancelar', exact: true }).click();
      await expect(removeButton).toBeFocused();
    });
  });

  test('404 em PT-BR com título "Página não encontrada | Organ"', async ({ page }) => {
    for (const path of ['/esta-pagina-nao-existe', '/um/caminho/qualquer']) {
      await test.step(path, async () => {
        const response = await page.goto(path);
        expect(response?.status()).toBe(404);
        await expect(page).toHaveTitle('Página não encontrada | Organ');
        await expect(page.locator('html')).toHaveAttribute('lang', 'pt-BR');
        await expect(page.getByRole('heading', { level: 1, name: 'Página não encontrada' })).toBeVisible();
        await expect(page.getByText('Erro 404')).toBeVisible();
        await expect(page.getByRole('link', { name: 'Página inicial', exact: true })).toHaveAttribute('href', '/');
        await expect(page.getByRole('link', { name: 'Ir para o painel' })).toHaveAttribute('href', '/dashboard');
      });
    }

    await visit(page, '/esta-pagina-nao-existe');
    await page.getByRole('link', { name: 'Página inicial', exact: true }).click();
    await expect(page).toHaveURL(/\/$/);
    await expect(page).toHaveTitle('Organ | Organizador de equipe e tarefas');
  });

  test('sem erros no console nas páginas principais', async ({ page, api, openSession }) => {
    const errors = collectConsoleErrors(page);

    for (const path of ['/', '/login', '/register', '/create-company', '/login?error=session_expired']) {
      await visit(page, path);
      await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    }

    const company = await api.createCompany();
    const bruno = await api.addMember(company, { firstName: 'Bruno' });
    await api.addInvite(company);
    const task = await api.createTask(company.leader.token, {
      taskName: `Console ${uid()}`,
      description: 'Sem erros, por favor',
      responsibles: [
        { employeeId: company.leader.employeeId, leadershipLevel: 3 },
        { employeeId: bruno.employeeId, leadershipLevel: 1 },
      ],
    });
    await api.setTaskStatus(company.leader.token, task.taskId, 'concluida');

    // Dashboard do líder, com interações
    await signIn(page.context(), company.leader);
    await openDashboard(page);
    await tasksSection(page).getByRole('button', { name: 'Nova tarefa' }).click();
    await expect(newTaskForm(page)).toBeVisible();
    await taskCard(page, task.taskName).getByRole('button', { name: `Editar a tarefa ${task.taskName}` }).click();
    await expect(editTaskForm(page, task.taskName)).toBeVisible();
    const filters = page.getByRole('navigation', { name: 'Filtrar tarefas por status' });
    for (const label of ['Concluída', 'Pendente', 'Em andamento', 'Todas']) {
      await filters.getByRole('link', { name: label, exact: true }).click();
      await expect(filters.getByRole('link', { name: label, exact: true })).toHaveAttribute('aria-current', 'page');
    }

    // Dashboard do membro, em outro navegador
    const memberPage = await openSession(bruno);
    const memberErrors = collectConsoleErrors(memberPage);
    await openDashboard(memberPage);
    await expect(taskCard(memberPage, task.taskName)).toBeVisible();

    // Logout
    await page.getByRole('button', { name: 'Sair' }).click();
    await expect(page).toHaveURL(/\/login$/);

    expect(errors, 'erros no console (navegador do líder)').toEqual([]);
    expect(memberErrors, 'erros no console (navegador do membro)').toEqual([]);
  });

  test('campos dos formulários têm rótulo acessível', async ({ page, api, loginAs }) => {
    for (const path of ['/login', '/register', '/create-company']) {
      await visit(page, path);
      await expectLabelledFields(page, path);
    }

    const company = await api.createCompany();
    await api.addMember(company, { firstName: 'Bruno' });
    const task = await api.createTask(company.leader.token, { taskName: `Rótulos ${uid()}` });
    await loginAs(company.leader);
    await tasksSection(page).getByRole('button', { name: 'Nova tarefa' }).click();
    await taskCard(page, task.taskName).getByRole('button', { name: `Editar a tarefa ${task.taskName}` }).click();
    await expect(editTaskForm(page, task.taskName)).toBeVisible();
    await expectLabelledFields(page, 'dashboard com formulários abertos');
  });
});
