import { expect, test } from './support/fixtures';
import { escapeRegExp, uid } from './support/data';
import {
  allTaskCards,
  newTaskForm,
  openDialog,
  openView,
  projectCard,
  projectsSection,
  responsibleChips,
  taskCard,
  tasksSection,
  waitForServerAction,
} from './support/ui';
import type { Page } from '@playwright/test';

const projectForm = (page: Page) => page.getByRole('dialog', { name: 'Novo projeto' });
const editProjectForm = (page: Page) => page.getByRole('dialog', { name: 'Editar projeto' });
const newProjectButton = (page: Page) => projectsSection(page).getByRole('button', { name: 'Novo projeto' });
const projectFilter = (page: Page) => page.getByLabel('Projeto', { exact: true });

test.describe('Projetos', () => {
  test.describe('Líder', () => {
    test('criar projeto pela janela, com descrição e equipe', async ({ page, api, loginAs }) => {
      const company = await api.createCompany();
      const bruno = await api.addMember(company, { firstName: 'Bruno' });
      const team = await api.createTeam(company.leader.token, { name: `Produto ${uid()}`, memberIds: [bruno.employeeId] });
      await loginAs(company.leader, 'projetos');

      // Sem projetos: aviso com botão para criar o primeiro
      await expect(projectsSection(page).getByText('Nenhum projeto por aqui ainda')).toBeVisible();
      await expect(projectsSection(page).getByText('0 projetos')).toBeVisible();

      const form = await openDialog(page, newProjectButton(page), 'Novo projeto');
      const name = `Site novo ${uid()}`;
      await form.getByLabel('Nome do projeto').fill(name);
      await form.getByLabel('Descrição (opcional)').fill('Redesenho do site institucional');
      await form.getByLabel('Equipe responsável').selectOption({ label: team.name });
      await form.getByRole('button', { name: 'Criar projeto' }).click();

      // A janela fecha e o card aparece com a equipe e o progresso zerado
      await expect(projectForm(page)).toHaveCount(0);
      const card = projectCard(page, name);
      await expect(card).toBeVisible();
      await expect(card).toContainText('Redesenho do site institucional');
      await expect(card).toContainText(`Equipe: ${team.name}`);
      await expect(card).toContainText('Nenhuma tarefa');
      await expect(card.getByRole('progressbar', { name: `Progresso do projeto ${name}` })).toHaveAttribute('aria-valuenow', '0');
      await expect(projectsSection(page).getByText('1 projeto')).toBeVisible();

      const [project] = await api.getProjects(company.leader.token);
      expect(project).toMatchObject({
        projectId: 1,
        name,
        description: 'Redesenho do site institucional',
        team: { teamId: team.teamId, name: team.name },
      });
    });

    test('nome em branco e nome repetido mostram erro e mantêm a janela aberta', async ({ page, api, loginAs }) => {
      const company = await api.createCompany();
      const existing = await api.createProject(company.leader.token, { name: `Existente ${uid()}` });
      await loginAs(company.leader, 'projetos');

      const form = await openDialog(page, newProjectButton(page), 'Novo projeto');
      await form.getByLabel('Nome do projeto').fill('    ');
      await form.getByRole('button', { name: 'Criar projeto' }).click();
      await expect(form.getByRole('alert')).toHaveText('Informe o nome do projeto.');

      // Repetido, ignorando maiúsculas
      await form.getByLabel('Nome do projeto').fill(existing.name.toUpperCase());
      const action = waitForServerAction(page);
      await form.getByRole('button', { name: 'Criar projeto' }).click();
      await action;
      await expect(form.getByRole('alert')).toHaveText('Já existe um projeto com esse nome!');
      await expect(form).toBeVisible();

      await form.getByRole('button', { name: 'Cancelar' }).click();
      await expect(projectForm(page)).toHaveCount(0);
      expect(await api.getProjects(company.leader.token)).toHaveLength(1);
    });

    test('editar nome, descrição e equipe (e tirar a equipe)', async ({ page, api, loginAs }) => {
      const company = await api.createCompany();
      const token = company.leader.token;
      const team = await api.createTeam(token, { name: `Equipe ${uid()}` });
      const project = await api.createProject(token, { name: `Antigo ${uid()}`, description: 'Descrição antiga' });
      await loginAs(company.leader, 'projetos');

      await openDialog(page, projectCard(page, project.name).getByRole('button', { name: `Editar o projeto ${project.name}` }), 'Editar projeto');
      const form = editProjectForm(page);
      // Pré-preenchido com os dados atuais
      await expect(form.getByLabel('Nome do projeto')).toHaveValue(project.name);
      await expect(form.getByLabel('Descrição (opcional)')).toHaveValue('Descrição antiga');
      await expect(form.getByLabel('Equipe responsável')).toHaveValue('');

      const newName = `Novo ${uid()}`;
      await form.getByLabel('Nome do projeto').fill(newName);
      await form.getByLabel('Descrição (opcional)').fill('Descrição nova');
      await form.getByLabel('Equipe responsável').selectOption({ label: team.name });
      await form.getByRole('button', { name: 'Salvar' }).click();

      await expect(form).toHaveCount(0);
      const card = projectCard(page, newName);
      await expect(card).toContainText('Descrição nova');
      await expect(card).toContainText(`Equipe: ${team.name}`);
      await expect(projectCard(page, project.name)).toHaveCount(0);
      expect((await api.getProjects(token))[0]).toMatchObject({ name: newName, team: { teamId: team.teamId } });

      // Tirar a equipe
      await openDialog(page, card.getByRole('button', { name: `Editar o projeto ${newName}` }), 'Editar projeto');
      await form.getByLabel('Equipe responsável').selectOption({ label: 'Sem equipe' });
      await form.getByRole('button', { name: 'Salvar' }).click();
      await expect(form).toHaveCount(0);
      await expect(card).toContainText('Sem equipe');
      expect((await api.getProjects(token))[0].team).toBeNull();
    });

    test('excluir com confirmação: as tarefas continuam, sem projeto', async ({ page, api, loginAs }) => {
      const company = await api.createCompany();
      const token = company.leader.token;
      const project = await api.createProject(token, { name: `Excluir ${uid()}` });
      const keep = await api.createProject(token, { name: `Manter ${uid()}` });
      const task = await api.createTask(token, { taskName: `Tarefa do projeto ${uid()}`, projectId: project.projectId });
      await loginAs(company.leader, 'projetos');

      const card = projectCard(page, project.name);
      const deleteButton = card.getByRole('button', { name: `Excluir o projeto ${project.name}` });

      // Cancelar não exclui
      await deleteButton.click();
      await card.getByRole('button', { name: 'Cancelar', exact: true }).click();
      await expect(deleteButton).toBeVisible();

      await deleteButton.click();
      await card.getByRole('button', { name: `Confirmar exclusão: Excluir o projeto ${project.name}` }).click();
      await expect(projectCard(page, project.name)).toHaveCount(0);
      await expect(projectCard(page, keep.name)).toBeVisible();

      // A tarefa continua, só sem o projeto
      expect((await api.getProjects(token)).map(item => item.projectId)).toEqual([keep.projectId]);
      expect((await api.getTask(token, task.taskId))?.project).toBeNull();
      await openView(page, 'tarefas');
      await expect(taskCard(page, task.taskName)).toBeVisible();
      await expect(taskCard(page, task.taskName).getByRole('link', { name: /^Ver as tarefas do projeto/ })).toHaveCount(0);
    });
  });

  test('o progresso do projeto vem das tarefas concluídas', async ({ page, api, loginAs }) => {
    const company = await api.createCompany();
    const token = company.leader.token;
    const project = await api.createProject(token, { name: `Progresso ${uid()}` });
    const empty = await api.createProject(token, { name: `Vazio ${uid()}` });
    const one = await api.createTask(token, { taskName: `Uma ${uid()}`, projectId: project.projectId });
    const two = await api.createTask(token, { taskName: `Duas ${uid()}`, projectId: project.projectId });
    const three = await api.createTask(token, { taskName: `Três ${uid()}`, projectId: project.projectId });
    await api.createTask(token, { taskName: `Sem projeto ${uid()}` });
    await api.setTaskStatus(token, one.taskId, 'concluida');
    await api.setTaskStatus(token, two.taskId, 'em_andamento');
    await loginAs(company.leader, 'projetos');

    const card = projectCard(page, project.name);
    await expect(card).toContainText('1 de 3 tarefas concluída');
    await expect(card).toContainText('33%');
    await expect(card.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '33');
    await expect(card.getByRole('list', { name: 'Tarefas por status' })).toContainText('Pendentes: 1');
    await expect(card.getByRole('list', { name: 'Tarefas por status' })).toContainText('Em andamento: 1');
    await expect(card.getByRole('list', { name: 'Tarefas por status' })).toContainText('Concluídas: 1');
    await expect(projectCard(page, empty.name)).toContainText('Nenhuma tarefa');

    // Concluir tudo leva a 100%
    await api.setTaskStatus(token, two.taskId, 'concluida');
    await api.setTaskStatus(token, three.taskId, 'concluida');
    await openView(page, 'projetos');
    await expect(card.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '100');
    await expect(card).toContainText('3 de 3 tarefas concluídas');
  });

  test('tarefas com projeto: cadastro na janela, etiqueta, filtro e "Ver tarefas"', async ({ page, api, loginAs }) => {
    const company = await api.createCompany();
    const token = company.leader.token;
    const alpha = await api.createProject(token, { name: `Alfa ${uid()}` });
    const beta = await api.createProject(token, { name: `Beta ${uid()}` });
    const inAlpha = await api.createTask(token, { taskName: `Em Alfa ${uid()}`, projectId: alpha.projectId });
    const inBeta = await api.createTask(token, { taskName: `Em Beta ${uid()}`, projectId: beta.projectId });
    const loose = await api.createTask(token, { taskName: `Solta ${uid()}` });
    await loginAs(company.leader, 'tarefas');

    // Criar uma tarefa já dentro de um projeto
    const form = await openDialog(page, tasksSection(page).getByRole('button', { name: 'Nova tarefa' }), 'Nova tarefa');
    const name = `Nova em Alfa ${uid()}`;
    await form.getByLabel('Nome da tarefa').fill(name);
    await form.getByLabel('Projeto').selectOption({ label: alpha.name });
    await form.getByRole('button', { name: 'Criar tarefa' }).click();
    await expect(newTaskForm(page)).toHaveCount(0);
    await expect(taskCard(page, name).getByRole('link', { name: `Ver as tarefas do projeto ${alpha.name}` })).toBeVisible();
    expect((await api.getTasks(token)).find(task => task.taskName === name)?.project).toMatchObject({ projectId: alpha.projectId });
    await expect(allTaskCards(page)).toHaveCount(4);

    // Filtro por projeto (e "Sem projeto")
    await projectFilter(page).selectOption({ label: alpha.name });
    await expect(page).toHaveURL(new RegExp(`/dashboard\\?view=tarefas&layout=list&project=${alpha.projectId}$`));
    await expect(allTaskCards(page)).toHaveCount(2);
    await expect(taskCard(page, inAlpha.taskName)).toBeVisible();
    await expect(taskCard(page, name)).toBeVisible();
    await expect(tasksSection(page).getByText(`2 tarefas · ${alpha.name}`)).toBeVisible();

    await projectFilter(page).selectOption({ label: 'Sem projeto' });
    await expect(page).toHaveURL(/\/dashboard\?view=tarefas&layout=list&project=none$/);
    await expect(allTaskCards(page)).toHaveCount(1);
    await expect(taskCard(page, loose.taskName)).toBeVisible();

    // Junta com o filtro de status
    await projectFilter(page).selectOption({ label: beta.name });
    await expect(page).toHaveURL(new RegExp(`/dashboard\\?view=tarefas&layout=list&project=${beta.projectId}$`));
    await expect(allTaskCards(page)).toHaveCount(1);
    await expect(taskCard(page, inBeta.taskName)).toBeVisible();
    await tasksSection(page).getByRole('navigation', { name: 'Filtrar tarefas por status' }).getByRole('link', { name: 'Concluída' }).click();
    await expect(page).toHaveURL(new RegExp(`/dashboard\\?view=tarefas&layout=list&status=concluida&project=${beta.projectId}$`));
    await expect(tasksSection(page).getByText(`Nenhuma tarefa com status “Concluída” em “${beta.name}”`)).toBeVisible();
    await tasksSection(page).getByRole('link', { name: 'Ver todas as tarefas' }).click();
    await expect(allTaskCards(page)).toHaveCount(4);

    // A etiqueta da tarefa e o link "Ver tarefas" do projeto levam ao filtro
    await taskCard(page, inBeta.taskName).getByRole('link', { name: `Ver as tarefas do projeto ${beta.name}` }).click();
    await expect(page).toHaveURL(new RegExp(`/dashboard\\?view=tarefas&project=${beta.projectId}$`));
    await expect(allTaskCards(page)).toHaveCount(1);
    await expect(projectFilter(page)).toHaveValue(String(beta.projectId));

    await openView(page, 'projetos');
    await projectCard(page, alpha.name).getByRole('link', { name: `Ver as tarefas do projeto ${alpha.name}` }).click();
    await expect(page).toHaveURL(new RegExp(`/dashboard\\?view=tarefas&project=${alpha.projectId}$`));
    await expect(allTaskCards(page)).toHaveCount(2);

    // Projeto que não existe na URL é ignorado
    await openView(page, 'tarefas', '&project=999');
    await expect(allTaskCards(page)).toHaveCount(4);
  });

  test('líder muda o projeto de uma tarefa na janela de edição', async ({ page, api, loginAs }) => {
    const company = await api.createCompany();
    const token = company.leader.token;
    const alpha = await api.createProject(token, { name: `Alfa ${uid()}` });
    const beta = await api.createProject(token, { name: `Beta ${uid()}` });
    const task = await api.createTask(token, { taskName: `Mudar ${uid()}`, projectId: alpha.projectId });
    await loginAs(company.leader, 'tarefas');

    const trigger = taskCard(page, task.taskName).getByRole('button', { name: `Editar a tarefa ${task.taskName}` });
    await openDialog(page, trigger, 'Editar tarefa');
    const form = page.getByRole('dialog', { name: 'Editar tarefa' });
    await expect(form.getByLabel('Projeto')).toHaveValue(String(alpha.projectId));
    await form.getByLabel('Projeto').selectOption({ label: beta.name });
    await form.getByRole('button', { name: 'Salvar' }).click();
    await expect(form).toHaveCount(0);
    await expect(taskCard(page, task.taskName).getByRole('link', { name: `Ver as tarefas do projeto ${beta.name}` })).toBeVisible();
    expect((await api.getTask(token, task.taskId))?.project).toMatchObject({ projectId: beta.projectId });

    // Tirar do projeto
    await openDialog(page, trigger, 'Editar tarefa');
    await form.getByLabel('Projeto').selectOption({ label: 'Sem projeto' });
    await form.getByRole('button', { name: 'Salvar' }).click();
    await expect(form).toHaveCount(0);
    await expect(taskCard(page, task.taskName).getByRole('link', { name: /^Ver as tarefas do projeto/ })).toHaveCount(0);
    expect((await api.getTask(token, task.taskId))?.project).toBeNull();
    // As responsáveis não mudaram
    await expect(responsibleChips(taskCard(page, task.taskName))).toHaveText([
      new RegExp(`${escapeRegExp(company.leader.name)}\\s*· Principal$`),
    ]);
  });

  test.describe('Membro', () => {
    test('vê os projetos e o progresso, sem botões de criar, editar ou excluir', async ({ page, api, loginAs }) => {
      const company = await api.createCompany();
      const bruno = await api.addMember(company, { firstName: 'Bruno' });
      const project = await api.createProject(company.leader.token, { name: `Projeto ${uid()}`, description: 'Visível para todos' });
      await loginAs(bruno, 'projetos');

      await expect(projectCard(page, project.name)).toContainText('Visível para todos');
      await expect(projectsSection(page).getByRole('button')).toHaveCount(0);
      await expect(projectCard(page, project.name).getByRole('link', { name: /^Ver as tarefas/ })).toBeVisible();

      // Sem projetos, o aviso explica quem cria
      const other = await api.createCompany();
      const outsider = await api.addMember(other, { firstName: 'Davi' });
      await loginAs(outsider, 'projetos');
      await expect(projectsSection(page).getByText('O líder da empresa pode criar projetos para agrupar as tarefas.')).toBeVisible();
      await expect(projectsSection(page).getByRole('button')).toHaveCount(0);
    });

    test('mesmo assim cria tarefas dentro de um projeto', async ({ page, api, loginAs }) => {
      const company = await api.createCompany();
      const bruno = await api.addMember(company, { firstName: 'Bruno' });
      const project = await api.createProject(company.leader.token, { name: `Projeto ${uid()}` });
      await loginAs(bruno, 'tarefas');

      const form = await openDialog(page, tasksSection(page).getByRole('button', { name: 'Nova tarefa' }), 'Nova tarefa');
      const name = `Do Bruno ${uid()}`;
      await form.getByLabel('Nome da tarefa').fill(name);
      await form.getByLabel('Projeto').selectOption({ label: project.name });
      await form.getByRole('button', { name: 'Criar tarefa' }).click();
      await expect(taskCard(page, name).getByRole('link', { name: `Ver as tarefas do projeto ${project.name}` })).toBeVisible();
      expect((await api.getTasks(company.leader.token))[0].project).toMatchObject({ projectId: project.projectId });
    });
  });
});
