import { expect, test } from './support/fixtures';
import { uid } from './support/data';
import {
  inviteDialog,
  inviteRow,
  openDialog,
  openView,
  projectCard,
  projectsSection,
  statusBadge,
  taskCard,
  teamCard,
  teamsSection,
  membersSection,
} from './support/ui';
import type { Page } from '@playwright/test';

const kpis = (page: Page) => page.getByRole('list', { name: 'Indicadores' });
const sectionsNav = (page: Page) => page.getByRole('navigation', { name: 'Seções do painel' });
/** Cartão do resumo pelo título (h2) */
const panel = (page: Page, title: string) => page.getByRole('region', { name: title, exact: true });

test.describe('Resumo', () => {
  test('mostra os indicadores, as minhas tarefas em aberto, o progresso, os projetos e as equipes', async ({
    page,
    api,
    loginAs,
  }) => {
    const company = await api.createCompany();
    const token = company.leader.token;
    const bruno = await api.addMember(company, { firstName: 'Bruno' });
    const team = await api.createTeam(token, { name: `Produto ${uid()}`, memberIds: [company.leader.employeeId, bruno.employeeId] });
    const project = await api.createProject(token, { name: `Site ${uid()}`, teamId: team.teamId });
    const mineDoing = await api.createTask(token, { taskName: `Minha em andamento ${uid()}`, projectId: project.projectId });
    const minePending = await api.createTask(token, { taskName: `Minha pendente ${uid()}` });
    const mineDone = await api.createTask(token, { taskName: `Minha concluída ${uid()}`, projectId: project.projectId });
    const others = await api.createTask(token, {
      taskName: `Só do Bruno ${uid()}`,
      responsibles: [{ employeeId: bruno.employeeId, leadershipLevel: 3 }],
    });
    await api.setTaskStatus(token, mineDoing.taskId, 'em_andamento');
    await api.setTaskStatus(token, mineDone.taskId, 'concluida');
    await loginAs(company.leader);

    await expect(page.getByRole('heading', { level: 1, name: 'Olá, Lia' })).toBeVisible();
    await expect(sectionsNav(page).getByRole('link', { name: 'Resumo', exact: true })).toHaveAttribute('aria-current', 'page');

    // Indicadores: total e um por status (cada um leva à lista filtrada)
    await expect(kpis(page).getByRole('listitem')).toHaveText([/^4\s*Tarefas$/, /^2\s*Pendente$/, /^1\s*Em andamento$/, /^1\s*Concluída$/]);
    await expect(kpis(page).getByRole('link', { name: /Em andamento/ })).toHaveAttribute(
      'href',
      '/dashboard?view=tarefas&layout=list&status=em_andamento'
    );

    // Minhas tarefas em aberto: só as minhas, sem as concluídas
    const mine = panel(page, 'Minhas tarefas em aberto');
    await expect(mine).toContainText('2 tarefas');
    await expect(mine).toContainText(mineDoing.taskName);
    await expect(mine).toContainText(minePending.taskName);
    await expect(mine).not.toContainText(mineDone.taskName);
    await expect(mine).not.toContainText(others.taskName);
    await expect(mine.getByRole('link', { name: `Ver as tarefas do projeto ${project.name}` })).toBeVisible();

    // Progresso geral: 1 de 4 concluída (25%)
    const progress = panel(page, 'Progresso geral');
    await expect(progress).toContainText('25%');
    await expect(progress).toContainText('1 de 4 tarefas');
    await expect(progress.getByRole('progressbar', { name: 'Progresso geral das tarefas' })).toHaveAttribute('aria-valuenow', '25');

    // Projetos e equipes
    await expect(panel(page, 'Projetos')).toContainText(project.name);
    await expect(panel(page, 'Projetos')).toContainText('1/2');
    await expect(panel(page, 'Equipes')).toContainText(team.name);
    await expect(panel(page, 'Equipes')).toContainText('2 membros');

    // Os links levam às seções
    await panel(page, 'Equipes').getByRole('link', { name: 'Ver equipes' }).click();
    await expect(page).toHaveURL(/\/dashboard\?view=equipes$/);
    await expect(teamCard(page, team.name)).toBeVisible();
  });

  test('sem nada cadastrado, mostra zeros e mensagens amigáveis', async ({ page, api, loginAs }) => {
    const company = await api.createCompany();
    await loginAs(company.leader);

    await expect(kpis(page).getByRole('listitem')).toHaveText([/^0\s*Tarefas$/, /^0\s*Pendente$/, /^0\s*Em andamento$/, /^0\s*Concluída$/]);
    await expect(panel(page, 'Minhas tarefas em aberto')).toContainText('Você não tem tarefas em aberto.');
    await expect(panel(page, 'Progresso geral')).toContainText('0%');
    await expect(panel(page, 'Projetos')).toContainText('Nenhum projeto ainda.');
    await expect(panel(page, 'Equipes')).toContainText('Nenhuma equipe ainda.');
  });

  test('atalhos do líder: cadastrar tarefa, projeto, equipe e convite sem sair do resumo', async ({
    page,
    api,
    loginAs,
  }) => {
    const company = await api.createCompany();
    const token = company.leader.token;
    await loginAs(company.leader);

    // Nova tarefa
    const taskName = `Atalho ${uid()}`;
    let form = await openDialog(page, page.getByRole('button', { name: 'Nova tarefa', exact: true }), 'Nova tarefa');
    await form.getByLabel('Nome da tarefa').fill(taskName);
    await form.getByRole('button', { name: 'Criar tarefa' }).click();
    await expect(form).toHaveCount(0);
    await expect(panel(page, 'Minhas tarefas em aberto')).toContainText(taskName);
    await expect(kpis(page).getByRole('listitem').first()).toHaveText(/^1\s*Tarefas$/);

    // Novo projeto
    const projectName = `Projeto ${uid()}`;
    form = await openDialog(page, page.getByRole('button', { name: 'Novo projeto', exact: true }), 'Novo projeto');
    await form.getByLabel('Nome do projeto').fill(projectName);
    await form.getByRole('button', { name: 'Criar projeto' }).click();
    await expect(form).toHaveCount(0);
    await expect(panel(page, 'Projetos')).toContainText(projectName);

    // Nova equipe
    const teamName = `Equipe ${uid()}`;
    form = await openDialog(page, page.getByRole('button', { name: 'Nova equipe', exact: true }), 'Nova equipe');
    await form.getByLabel('Nome da equipe').fill(teamName);
    await form.getByRole('checkbox', { name: new RegExp(`^${company.leader.name}`) }).check();
    await form.getByRole('button', { name: 'Criar equipe' }).click();
    await expect(form).toHaveCount(0);
    await expect(panel(page, 'Equipes')).toContainText(teamName);

    // Convite
    const email = `atalho.${uid()}@e2e.organ.test`;
    form = await openDialog(page, page.getByRole('button', { name: 'Convidar membro', exact: true }), 'Convidar membro');
    await form.getByLabel('Email do convidado').fill(email);
    await form.getByRole('button', { name: 'Convidar', exact: true }).click();
    await expect(inviteDialog(page)).toHaveCount(0);

    // Tudo gravado e visível nas seções
    expect((await api.getTasks(token)).map(task => task.taskName)).toEqual([taskName]);
    expect((await api.getProjects(token)).map(project => project.name)).toEqual([projectName]);
    expect((await api.getTeams(token)).map(team => team.name)).toEqual([teamName]);
    await openView(page, 'projetos');
    await expect(projectCard(page, projectName)).toBeVisible();
    await openView(page, 'equipes');
    await expect(teamCard(page, teamName)).toBeVisible();
    await openView(page, 'membros');
    await expect(inviteRow(page, email)).toBeVisible();
  });

  test('o membro só vê o atalho de nova tarefa', async ({ page, api, loginAs }) => {
    const company = await api.createCompany();
    const bruno = await api.addMember(company, { firstName: 'Bruno' });
    const task = await api.createTask(company.leader.token, {
      taskName: `Do Bruno ${uid()}`,
      responsibles: [{ employeeId: bruno.employeeId, leadershipLevel: 3 }],
    });
    await loginAs(bruno);

    await expect(page.getByRole('button', { name: 'Nova tarefa', exact: true })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Novo projeto' })).toHaveCount(0);
    await expect(page.getByRole('button', { name: 'Nova equipe' })).toHaveCount(0);
    await expect(page.getByRole('button', { name: 'Convidar membro' })).toHaveCount(0);
    await expect(panel(page, 'Minhas tarefas em aberto')).toContainText(task.taskName);

    // As seções do painel mostram só o que o membro pode usar
    await sectionsNav(page).getByRole('link', { name: 'Tarefas', exact: true }).click();
    await expect(statusBadge(taskCard(page, task.taskName))).toHaveText('Pendente');
    await openView(page, 'projetos');
    await expect(projectsSection(page).getByRole('button')).toHaveCount(0);
    await openView(page, 'equipes');
    await expect(teamsSection(page).getByRole('button')).toHaveCount(0);
    await openView(page, 'membros');
    await expect(membersSection(page).getByRole('button')).toHaveCount(0);
  });

  test('seção desconhecida na URL cai no resumo', async ({ page, api, loginAs }) => {
    const company = await api.createCompany();
    await loginAs(company.leader);
    await page.goto('/dashboard?view=qualquer-coisa');
    await expect(page.getByRole('heading', { level: 1, name: 'Olá, Lia' })).toBeVisible();
    await expect(sectionsNav(page).getByRole('link', { name: 'Resumo', exact: true })).toHaveAttribute('aria-current', 'page');
  });
});
