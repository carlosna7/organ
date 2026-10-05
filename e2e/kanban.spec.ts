import { expect, test } from './support/fixtures';
import { uid } from './support/data';
import {
  allTaskCards,
  dragCardToColumn,
  kanbanCards,
  kanbanColumn,
  openDashboard,
  statusBadge,
  taskCard,
  tasksSection,
} from './support/ui';
import type { Page } from '@playwright/test';
import type { OrganApi, SeededCompany } from './support/api';

const layoutNav = (page: Page) => page.getByRole('navigation', { name: 'Forma de visualização' });
const sectionsNav = (page: Page) => page.getByRole('navigation', { name: 'Seções do painel' });
const statusFilter = (page: Page) => page.getByRole('navigation', { name: 'Filtrar tarefas por status' });
/** Região ao vivo do dnd-kit: anuncia a coluna sobre a qual o card está (só muda quando o arrastar reage à tecla) */
const dragAnnouncement = (page: Page) => page.locator('[id^="DndLiveRegion"]');

/** Empresa com uma tarefa em cada status (todas com o líder como responsável principal) */
async function seedThreeTasks(api: OrganApi) {
  const company = await api.createCompany();
  const token = company.leader.token;
  const pending = await api.createTask(token, { taskName: `Pendente ${uid()}` });
  const doing = await api.createTask(token, { taskName: `Andamento ${uid()}` });
  const done = await api.createTask(token, { taskName: `Concluída ${uid()}` });
  await api.setTaskStatus(token, doing.taskId, 'em_andamento');
  await api.setTaskStatus(token, done.taskId, 'concluida');
  return { company, pending, doing, done };
}

/** Espera o status gravado na API (a tela já mostra a mudança antes de a API responder) */
async function expectApiStatus(api: OrganApi, company: SeededCompany, taskId: number, status: string) {
  await expect.poll(async () => (await api.getTask(company.leader.token, taskId))?.status).toBe(status);
}

test.describe('Formas de ver as tarefas', () => {
  test('alternar entre lista, kanban e grade', async ({ page, api, loginAs }) => {
    const { company, pending, doing, done } = await seedThreeTasks(api);
    await loginAs(company.leader, 'tarefas');

    // Lista é a forma padrão
    await expect(layoutNav(page).getByRole('link', { name: 'Lista' })).toHaveAttribute('aria-current', 'page');
    await expect(allTaskCards(page)).toHaveCount(3);
    await expect(statusFilter(page)).toBeVisible();

    // Kanban: uma coluna por status, sem o filtro de status (cada coluna já é um status)
    await layoutNav(page).getByRole('link', { name: 'Kanban' }).click();
    await expect(page).toHaveURL(/\/dashboard\?view=tarefas&layout=kanban$/);
    await expect(layoutNav(page).getByRole('link', { name: 'Kanban' })).toHaveAttribute('aria-current', 'page');
    await expect(statusFilter(page)).toHaveCount(0);
    await expect(kanbanCards(page, 'Pendente')).toHaveCount(1);
    await expect(kanbanCards(page, 'Em andamento')).toHaveCount(1);
    await expect(kanbanCards(page, 'Concluída')).toHaveCount(1);
    await expect(kanbanColumn(page, 'Pendente')).toContainText(pending.taskName);
    await expect(kanbanColumn(page, 'Em andamento')).toContainText(doing.taskName);
    await expect(kanbanColumn(page, 'Concluída')).toContainText(done.taskName);
    await expect(kanbanColumn(page, 'Pendente').getByLabel('1 tarefa')).toBeVisible();

    // Grade: cards como na lista, com os mesmos filtros de status
    await layoutNav(page).getByRole('link', { name: 'Grade' }).click();
    await expect(page).toHaveURL(/\/dashboard\?view=tarefas&layout=grid$/);
    await expect(layoutNav(page).getByRole('link', { name: 'Grade' })).toHaveAttribute('aria-current', 'page');
    await expect(allTaskCards(page)).toHaveCount(3);
    await expect(statusBadge(taskCard(page, done.taskName))).toHaveText('Concluída');
    await statusFilter(page).getByRole('link', { name: 'Pendente', exact: true }).click();
    await expect(page).toHaveURL(/\/dashboard\?view=tarefas&layout=grid&status=pendente$/);
    await expect(allTaskCards(page)).toHaveCount(1);

    // Voltar para a lista mantém o filtro de status
    await layoutNav(page).getByRole('link', { name: 'Lista' }).click();
    await expect(page).toHaveURL(/\/dashboard\?view=tarefas&layout=list&status=pendente$/);
    await expect(allTaskCards(page)).toHaveCount(1);
  });

  test('a forma escolhida é lembrada ao voltar para as tarefas', async ({ page, api, loginAs }) => {
    const { company } = await seedThreeTasks(api);
    await loginAs(company.leader, 'tarefas');

    await layoutNav(page).getByRole('link', { name: 'Kanban' }).click();
    await expect(kanbanColumn(page, 'Pendente')).toBeVisible();

    // Sai para outra seção e volta pelo menu: continua no kanban
    await sectionsNav(page).getByRole('link', { name: 'Resumo', exact: true }).click();
    await expect(page).toHaveURL(/\/dashboard$/);
    await sectionsNav(page).getByRole('link', { name: 'Tarefas', exact: true }).click();
    await expect(page).toHaveURL(/\/dashboard\?view=tarefas$/);
    await expect(layoutNav(page).getByRole('link', { name: 'Kanban' })).toHaveAttribute('aria-current', 'page');
    await expect(kanbanColumn(page, 'Em andamento')).toBeVisible();

    // O endereço com ?layout= tem prioridade sobre a preferência guardada
    await openDashboard(page, '?view=tarefas&layout=grid');
    await expect(layoutNav(page).getByRole('link', { name: 'Grade' })).toHaveAttribute('aria-current', 'page');
    await expect(kanbanColumn(page, 'Pendente')).toHaveCount(0);

    // Valores inválidos na URL caem na preferência guardada
    await openDashboard(page, '?view=tarefas&layout=invalido');
    await expect(layoutNav(page).getByRole('link', { name: 'Kanban' })).toHaveAttribute('aria-current', 'page');
  });

  test('o kanban também respeita o filtro de projeto', async ({ page, api, loginAs }) => {
    const company = await api.createCompany();
    const token = company.leader.token;
    const project = await api.createProject(token, { name: `Projeto ${uid()}` });
    const inProject = await api.createTask(token, { taskName: `No projeto ${uid()}`, projectId: project.projectId });
    const outside = await api.createTask(token, { taskName: `Fora ${uid()}` });
    await loginAs(company.leader, 'tarefas');
    await layoutNav(page).getByRole('link', { name: 'Kanban' }).click();
    await expect(kanbanCards(page, 'Pendente')).toHaveCount(2);

    await page.getByLabel('Projeto', { exact: true }).selectOption({ label: project.name });
    await expect(page).toHaveURL(new RegExp(`/dashboard\\?view=tarefas&layout=kanban&project=${project.projectId}$`));
    await expect(kanbanCards(page, 'Pendente')).toHaveCount(1);
    await expect(taskCard(page, inProject.taskName)).toBeVisible();
    await expect(taskCard(page, outside.taskName)).toHaveCount(0);
  });
});

test.describe('Kanban: arrastar e soltar', () => {
  test('arrastar o card para outra coluna muda o status e continua depois de recarregar', async ({
    page,
    api,
    loginAs,
  }) => {
    const { company, pending } = await seedThreeTasks(api);
    await loginAs(company.leader, 'tarefas');
    await layoutNav(page).getByRole('link', { name: 'Kanban' }).click();
    await expect(kanbanCards(page, 'Pendente')).toHaveCount(1);

    // Pendente → Em andamento
    await dragCardToColumn(page, taskCard(page, pending.taskName), kanbanColumn(page, 'Em andamento'));
    await expect(kanbanCards(page, 'Pendente')).toHaveCount(0);
    await expect(kanbanCards(page, 'Em andamento')).toHaveCount(2);
    await expect(kanbanColumn(page, 'Em andamento')).toContainText(pending.taskName);
    await expect(kanbanColumn(page, 'Pendente')).toContainText('Nenhuma tarefa');
    await expectApiStatus(api, company, pending.taskId, 'em_andamento');

    // Em andamento → Concluída: a API guarda a data de conclusão
    await dragCardToColumn(page, taskCard(page, pending.taskName), kanbanColumn(page, 'Concluída'));
    await expect(kanbanColumn(page, 'Concluída')).toContainText(pending.taskName);
    await expectApiStatus(api, company, pending.taskId, 'concluida');
    expect((await api.getTask(company.leader.token, pending.taskId))?.completedAt).toEqual(expect.any(String));

    // Persistido depois de recarregar
    await page.reload();
    await expect(kanbanColumn(page, 'Concluída')).toContainText(pending.taskName);
    await expect(kanbanCards(page, 'Concluída')).toHaveCount(2);

    // Concluída → Pendente: a data de conclusão some
    await dragCardToColumn(page, taskCard(page, pending.taskName), kanbanColumn(page, 'Pendente'));
    await expect(kanbanColumn(page, 'Pendente')).toContainText(pending.taskName);
    await expectApiStatus(api, company, pending.taskId, 'pendente');
    expect((await api.getTask(company.leader.token, pending.taskId))?.completedAt).toBeNull();
  });

  test('soltar o card na mesma coluna não muda nada', async ({ page, api, loginAs }) => {
    const { company, pending } = await seedThreeTasks(api);
    await loginAs(company.leader, 'tarefas');
    await layoutNav(page).getByRole('link', { name: 'Kanban' }).click();

    await dragCardToColumn(page, taskCard(page, pending.taskName), kanbanColumn(page, 'Pendente'));
    await expect(kanbanCards(page, 'Pendente')).toHaveCount(1);
    await expect(kanbanColumn(page, 'Pendente')).toContainText(pending.taskName);
    expect((await api.getTask(company.leader.token, pending.taskId))?.status).toBe('pendente');
  });

  test('alternativas sem arrastar: seletor "Mover para" e teclado', async ({ page, api, loginAs }) => {
    const { company, pending, doing } = await seedThreeTasks(api);
    await loginAs(company.leader, 'tarefas');
    await layoutNav(page).getByRole('link', { name: 'Kanban' }).click();

    // Seletor no próprio card
    const select = taskCard(page, pending.taskName).getByRole('combobox', { name: `Mover a tarefa ${pending.taskName} para` });
    await select.selectOption({ label: 'Concluída' });
    await expect(kanbanColumn(page, 'Concluída')).toContainText(pending.taskName);
    await expectApiStatus(api, company, pending.taskId, 'concluida');

    // Teclado: Espaço pega o card pelo botão de mover, setas escolhem a coluna e Espaço solta
    const handle = taskCard(page, doing.taskName).getByRole('button', { name: `Mover a tarefa ${doing.taskName}` });
    await handle.focus();
    await page.keyboard.press('Space');
    await page.keyboard.press('ArrowRight');
    await expect(dragAnnouncement(page)).toContainText('sobre a coluna Concluída');
    await page.keyboard.press('Space');
    await expect(kanbanColumn(page, 'Concluída')).toContainText(doing.taskName);
    await expectApiStatus(api, company, doing.taskId, 'concluida');

    // E de volta, com ArrowLeft
    await taskCard(page, doing.taskName).getByRole('button', { name: `Mover a tarefa ${doing.taskName}` }).focus();
    await page.keyboard.press('Space');
    await page.keyboard.press('ArrowLeft');
    await expect(dragAnnouncement(page)).toContainText('sobre a coluna Em andamento');
    await page.keyboard.press('ArrowLeft');
    await expect(dragAnnouncement(page)).toContainText('sobre a coluna Pendente');
    await page.keyboard.press('Space');
    await expect(kanbanColumn(page, 'Pendente')).toContainText(doing.taskName);
    await expectApiStatus(api, company, doing.taskId, 'pendente');
  });

  test('Esc cancela o arrastar pelo teclado', async ({ page, api, loginAs }) => {
    const { company, pending } = await seedThreeTasks(api);
    await loginAs(company.leader, 'tarefas');
    await layoutNav(page).getByRole('link', { name: 'Kanban' }).click();

    await taskCard(page, pending.taskName).getByRole('button', { name: `Mover a tarefa ${pending.taskName}` }).focus();
    await page.keyboard.press('Space');
    await page.keyboard.press('ArrowRight');
    await page.keyboard.press('Escape');
    await expect(kanbanColumn(page, 'Pendente')).toContainText(pending.taskName);
    expect((await api.getTask(company.leader.token, pending.taskId))?.status).toBe('pendente');
  });

  test('membro só move as tarefas em que é responsável', async ({ page, api, loginAs }) => {
    const company = await api.createCompany();
    const bruno = await api.addMember(company, { firstName: 'Bruno' });
    const token = company.leader.token;
    const mine = await api.createTask(token, {
      taskName: `Do Bruno ${uid()}`,
      responsibles: [{ employeeId: bruno.employeeId, leadershipLevel: 2 }],
    });
    const notMine = await api.createTask(token, { taskName: `Só da líder ${uid()}` });
    await loginAs(bruno, 'tarefas');
    await layoutNav(page).getByRole('link', { name: 'Kanban' }).click();

    // Só a tarefa dele tem botão de mover e seletor; sem botões de editar e excluir
    await expect(taskCard(page, mine.taskName).getByRole('button', { name: `Mover a tarefa ${mine.taskName}` })).toBeVisible();
    await expect(taskCard(page, notMine.taskName).getByRole('button')).toHaveCount(0);
    await expect(taskCard(page, notMine.taskName).getByRole('combobox')).toHaveCount(0);
    await expect(page.getByRole('button', { name: /^(Editar|Excluir)/ })).toHaveCount(0);

    // Arrastar a tarefa da líder não faz nada
    await dragCardToColumn(page, taskCard(page, notMine.taskName), kanbanColumn(page, 'Concluída'));
    await expect(kanbanColumn(page, 'Pendente')).toContainText(notMine.taskName);
    expect((await api.getTask(token, notMine.taskId))?.status).toBe('pendente');

    // Arrastar a dele funciona
    await dragCardToColumn(page, taskCard(page, mine.taskName), kanbanColumn(page, 'Em andamento'));
    await expect(kanbanColumn(page, 'Em andamento')).toContainText(mine.taskName);
    await expectApiStatus(api, company, mine.taskId, 'em_andamento');
  });

  test('se a API recusar a mudança, o card volta para a coluna de origem e aparece o aviso', async ({
    page,
    api,
    loginAs,
  }) => {
    const company = await api.createCompany();
    const bruno = await api.addMember(company, { firstName: 'Bruno' });
    const task = await api.createTask(company.leader.token, {
      taskName: `Troca de responsável ${uid()}`,
      responsibles: [{ employeeId: bruno.employeeId, leadershipLevel: 3 }],
    });
    await loginAs(bruno, 'tarefas');
    await layoutNav(page).getByRole('link', { name: 'Kanban' }).click();
    await expect(taskCard(page, task.taskName).getByRole('button', { name: `Mover a tarefa ${task.taskName}` })).toBeVisible();

    // Com a página aberta, a líder tira o Bruno da tarefa
    await api.updateTask(company.leader.token, task.taskId, {
      responsibles: [{ employeeId: company.leader.employeeId, leadershipLevel: 3 }],
    });

    await dragCardToColumn(page, taskCard(page, task.taskName), kanbanColumn(page, 'Concluída'));
    await expect(tasksSection(page).getByRole('alert')).toHaveText(
      `Não foi possível mover “${task.taskName}”: Apenas o líder ou um responsável pode alterar o status!`
    );
    await expect(kanbanColumn(page, 'Pendente')).toContainText(task.taskName);
    await expect(kanbanColumn(page, 'Concluída')).not.toContainText(task.taskName);
    expect((await api.getTask(company.leader.token, task.taskId))?.status).toBe('pendente');
  });
});
