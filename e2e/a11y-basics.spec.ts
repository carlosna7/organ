import { expect, test } from './support/fixtures';
import { uid } from './support/data';
import {
  collectConsoleErrors,
  editTaskForm,
  memberRow,
  newTaskForm,
  openDialog,
  openView,
  signIn,
  taskCard,
  tasksSection,
  visit,
} from './support/ui';
import type { Locator, Page } from '@playwright/test';

/** Todo campo visível do escopo (a página inteira ou uma janela) tem nome acessível (label) */
async function expectLabelledFields(scope: Page | Locator, label: string) {
  const fields = scope.locator('input:not([type="hidden"]), select, textarea');
  const count = await fields.count();
  expect(count, `${label}: deveria ter campos`).toBeGreaterThan(0);
  for (let index = 0; index < count; index++) {
    await expect(fields.nth(index), `${label}: campo #${index} sem rótulo`).toHaveAccessibleName(/\S/);
  }
}

test.describe('Acessibilidade básica', () => {
  test.describe('Foco nas janelas de tarefa', () => {
    test('"Nova tarefa": foco vai para "Nome da tarefa" ao abrir e volta ao botão ao cancelar', async ({
      page,
      api,
      loginAs,
    }) => {
      const company = await api.createCompany();
      await api.createTask(company.leader.token, { taskName: `Existente ${uid()}` });
      await loginAs(company.leader, 'tarefas');

      const trigger = tasksSection(page).getByRole('button', { name: 'Nova tarefa' });
      const nameField = newTaskForm(page).getByLabel('Nome da tarefa');

      await openDialog(page, trigger, 'Nova tarefa');
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
      await loginAs(company.leader, 'tarefas');

      const card = taskCard(page, task.taskName);
      const trigger = card.getByRole('button', { name: `Editar a tarefa ${task.taskName}` });
      const form = editTaskForm(page);

      await openDialog(page, trigger, 'Editar tarefa');
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

    test('sem tarefas, nenhuma janela abre sozinha nem rouba o foco', async ({ page, api, loginAs }) => {
      const company = await api.createCompany();
      await loginAs(company.leader, 'tarefas');

      await expect(tasksSection(page).getByText('Nenhuma tarefa por aqui ainda')).toBeVisible();
      await expect(page.getByRole('dialog')).toHaveCount(0);
      expect(await page.evaluate(() => document.activeElement === document.body)).toBe(true);
    });

    test('confirmações: foco vai para o botão de confirmar e volta ao cancelar', async ({ page, api, loginAs }) => {
      const company = await api.createCompany();
      const bruno = await api.addMember(company, { firstName: 'Bruno' });
      const task = await api.createTask(company.leader.token, { taskName: `Para excluir ${uid()}` });
      await loginAs(company.leader, 'tarefas');

      const card = taskCard(page, task.taskName);
      const deleteButton = card.getByRole('button', { name: `Excluir a tarefa ${task.taskName}` });
      await deleteButton.click();
      await expect(card.getByRole('button', { name: `Confirmar exclusão: Excluir a tarefa ${task.taskName}` })).toBeFocused();
      await card.getByRole('button', { name: 'Cancelar', exact: true }).click();
      await expect(deleteButton).toBeFocused();

      await openView(page, 'membros');
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
    const team = await api.createTeam(company.leader.token, { name: `Equipe ${uid()}`, memberIds: [bruno.employeeId] });
    const project = await api.createProject(company.leader.token, { name: `Projeto ${uid()}`, teamId: team.teamId });
    const task = await api.createTask(company.leader.token, {
      taskName: `Console ${uid()}`,
      description: 'Sem erros, por favor',
      projectId: project.projectId,
      responsibles: [
        { employeeId: company.leader.employeeId, leadershipLevel: 3 },
        { employeeId: bruno.employeeId, leadershipLevel: 1 },
      ],
    });
    await api.setTaskStatus(company.leader.token, task.taskId, 'concluida');

    // Dashboard do líder, com interações: resumo, seções e janelas
    await signIn(page.context(), company.leader);
    await openView(page, 'resumo');
    for (const label of ['Nova tarefa', 'Novo projeto', 'Nova equipe', 'Convidar membro']) {
      await page.getByRole('button', { name: label, exact: true }).click();
      await expect(page.getByRole('dialog')).toBeVisible();
      await page.getByRole('dialog').getByRole('button', { name: 'Cancelar' }).click();
      await expect(page.getByRole('dialog')).toHaveCount(0);
    }

    const sections = page.getByRole('navigation', { name: 'Seções do painel' });
    for (const label of ['Tarefas', 'Projetos', 'Equipes', 'Membros', 'Resumo']) {
      await sections.getByRole('link', { name: label, exact: true }).click();
      await expect(sections.getByRole('link', { name: label, exact: true })).toHaveAttribute('aria-current', 'page');
    }

    await sections.getByRole('link', { name: 'Tarefas', exact: true }).click();
    await openDialog(page, tasksSection(page).getByRole('button', { name: 'Nova tarefa' }), 'Nova tarefa');
    await newTaskForm(page).getByRole('button', { name: 'Cancelar' }).click();
    await openDialog(page, taskCard(page, task.taskName).getByRole('button', { name: `Editar a tarefa ${task.taskName}` }), 'Editar tarefa');
    await editTaskForm(page).getByRole('button', { name: 'Cancelar' }).click();

    const layouts = page.getByRole('navigation', { name: 'Forma de visualização' });
    for (const label of ['Kanban', 'Grade', 'Lista']) {
      await layouts.getByRole('link', { name: label, exact: true }).click();
      await expect(layouts.getByRole('link', { name: label, exact: true })).toHaveAttribute('aria-current', 'page');
    }
    const filters = page.getByRole('navigation', { name: 'Filtrar tarefas por status' });
    for (const label of ['Concluída', 'Pendente', 'Em andamento', 'Todas']) {
      await filters.getByRole('link', { name: label, exact: true }).click();
      await expect(filters.getByRole('link', { name: label, exact: true })).toHaveAttribute('aria-current', 'page');
    }

    // Dashboard do membro, em outro navegador (kanban, onde o card é arrastável)
    const memberPage = await openSession(bruno, 'tarefas');
    const memberErrors = collectConsoleErrors(memberPage);
    await memberPage.getByRole('navigation', { name: 'Forma de visualização' }).getByRole('link', { name: 'Kanban' }).click();
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
    const bruno = await api.addMember(company, { firstName: 'Bruno' });
    const team = await api.createTeam(company.leader.token, { name: `Equipe ${uid()}`, memberIds: [bruno.employeeId] });
    const project = await api.createProject(company.leader.token, { name: `Projeto ${uid()}`, teamId: team.teamId });
    const task = await api.createTask(company.leader.token, { taskName: `Rótulos ${uid()}`, projectId: project.projectId });
    await loginAs(company.leader, 'tarefas');

    // Filtro de projeto e seletores de status das três formas de ver as tarefas
    for (const layout of ['list', 'kanban', 'grid']) {
      await openView(page, 'tarefas', `&layout=${layout}`);
      await expectLabelledFields(page, `tarefas (${layout})`);
    }

    // Cada janela de cadastro
    await openDialog(page, tasksSection(page).getByRole('button', { name: 'Nova tarefa' }), 'Nova tarefa');
    await expectLabelledFields(newTaskForm(page), 'janela Nova tarefa');
    await newTaskForm(page).getByRole('button', { name: 'Cancelar' }).click();

    await openDialog(page, taskCard(page, task.taskName).getByRole('button', { name: `Editar a tarefa ${task.taskName}` }), 'Editar tarefa');
    await expectLabelledFields(editTaskForm(page), 'janela Editar tarefa');
    await editTaskForm(page).getByRole('button', { name: 'Cancelar' }).click();

    await openView(page, 'projetos');
    const projectDialog = await openDialog(page, page.getByRole('button', { name: 'Novo projeto' }), 'Novo projeto');
    await expectLabelledFields(projectDialog, 'janela Novo projeto');
    await projectDialog.getByRole('button', { name: 'Cancelar' }).click();

    await openView(page, 'equipes');
    const teamDialog = await openDialog(page, page.getByRole('button', { name: 'Nova equipe' }), 'Nova equipe');
    await expectLabelledFields(teamDialog, 'janela Nova equipe');
    await teamDialog.getByRole('button', { name: 'Cancelar' }).click();

    await openView(page, 'membros');
    const inviteDialog = await openDialog(page, page.getByRole('button', { name: 'Convidar membro' }), 'Convidar membro');
    await expectLabelledFields(inviteDialog, 'janela Convidar membro');
  });
});
