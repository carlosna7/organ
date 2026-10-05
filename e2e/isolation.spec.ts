import { expect, test } from './support/fixtures';
import { escapeRegExp, uid } from './support/data';
import {
  allTaskCards,
  changeStatus,
  inviteRow,
  memberRow,
  membersSection,
  newTaskForm,
  openDialog,
  openView,
  statusBadge,
  taskCard,
  tasksSection,
  waitForServerAction,
} from './support/ui';
import type { Page } from '@playwright/test';
import type { OrganApi, SeededCompany } from './support/api';

/** Empresa com líder, um membro, um convite pendente, uma equipe, um projeto e uma tarefa concluída e outra pendente */
async function seed(api: OrganApi, label: string) {
  const company = await api.createCompany({ name: `Empresa ${label} ${uid()}` });
  const member = await api.addMember(company, { firstName: 'Bruno' });
  const invite = await api.addInvite(company);
  const team = await api.createTeam(company.leader.token, {
    name: `Equipe da ${label} ${uid()}`,
    memberIds: [member.employeeId],
  });
  const project = await api.createProject(company.leader.token, {
    name: `Projeto da ${label} ${uid()}`,
    teamId: team.teamId,
  });
  const open = await api.createTask(company.leader.token, {
    taskName: `Tarefa aberta da ${label} ${uid()}`,
    description: `Descrição confidencial da ${label} ${uid()}`,
    projectId: project.projectId,
    responsibles: [{ employeeId: member.employeeId, leadershipLevel: 3 }],
  });
  const closed = await api.createTask(company.leader.token, { taskName: `Tarefa concluída da ${label} ${uid()}` });
  await api.setTaskStatus(company.leader.token, closed.taskId, 'concluida');
  return { company, member, invite, team, project, open, closed };
}

type Seed = Awaited<ReturnType<typeof seed>>;

type DataView = 'tarefas' | 'membros' | 'equipes' | 'projetos';

/** Textos da empresa que aparecem em cada seção do painel */
function fingerprints({ company, member, invite, team, project, open, closed }: Seed, view: DataView): string[] {
  switch (view) {
    case 'tarefas':
      return [company.name, company.leader.name, member.name, open.taskName, open.description ?? '', closed.taskName, project.name];
    case 'membros':
      return [company.name, company.leader.name, company.leader.email, member.name, member.email, invite.email, team.name];
    case 'equipes':
      return [company.name, team.name, member.name, project.name];
    case 'projetos':
      return [company.name, project.name, team.name];
  }
}

const ALL_VIEWS: DataView[] = ['tarefas', 'membros', 'equipes', 'projetos'];

/** A página mostra os dados da própria empresa na seção aberta */
async function expectOwnData(page: Page, own: Seed, view: DataView) {
  for (const text of fingerprints(own, view)) {
    await expect(page.locator('body'), `deveria mostrar "${text}"`).toContainText(text);
  }
}

/** Nada da outra empresa aparece na página, em nenhuma das seções */
async function expectNoDataFrom(page: Page, other: Seed) {
  for (const view of ALL_VIEWS) {
    for (const text of fingerprints(other, view)) {
      await expect(page.locator('body'), `não deveria mostrar "${text}"`).not.toContainText(text);
    }
  }
}

test.describe('Isolamento entre empresas', () => {
  test('dados de uma empresa não aparecem na outra', async ({ page, api, loginAs, openSession }) => {
    const a = await seed(api, 'A');
    const b = await seed(api, 'B');

    // Líder da empresa A: seção Tarefas
    await loginAs(a.company.leader, 'tarefas');
    await expect(page.getByRole('banner')).toContainText(a.company.name);
    await expectOwnData(page, a, 'tarefas');
    await expectNoDataFrom(page, b);
    await expect(allTaskCards(page)).toHaveCount(2);
    // Os ids são sequenciais por empresa: as duas têm a tarefa #1
    expect(a.open.taskId).toBe(1);
    expect(b.open.taskId).toBe(1);

    // Também nos filtros e na lista de responsáveis
    for (const status of ['pendente', 'em_andamento', 'concluida']) {
      await openView(page, 'tarefas', `&status=${status}`);
      await expectNoDataFrom(page, b);
    }
    await openView(page, 'tarefas', '&status=concluida');
    await expect(allTaskCards(page)).toHaveCount(1);
    await expect(taskCard(page, a.closed.taskName)).toBeVisible();
    // Kanban, grade e filtro por projeto também não vazam dados
    for (const layout of ['kanban', 'grid']) {
      await openView(page, 'tarefas', `&layout=${layout}`);
      await expectOwnData(page, a, 'tarefas');
      await expectNoDataFrom(page, b);
    }
    // Os projetos também têm ids por empresa: as duas têm o projeto #1, e o filtro só enxerga o da própria empresa
    expect(a.project.projectId).toBe(b.project.projectId);
    await openView(page, 'tarefas', `&layout=list&project=${b.project.projectId}`);
    await expect(allTaskCards(page)).toHaveCount(1);
    await expect(taskCard(page, a.open.taskName)).toBeVisible();
    await expectNoDataFrom(page, b);

    await openView(page, 'tarefas');
    await openDialog(page, tasksSection(page).getByRole('button', { name: 'Nova tarefa' }), 'Nova tarefa');
    const checkboxes = newTaskForm(page).getByRole('checkbox');
    await expect(checkboxes).toHaveCount(2);
    for (const name of [b.company.leader.name, b.member.name]) {
      await expect(newTaskForm(page).getByRole('checkbox', { name: new RegExp(escapeRegExp(name)) })).toHaveCount(0);
    }
    await expect(newTaskForm(page).getByRole('combobox', { name: 'Projeto' })).toContainText(a.project.name);
    await expect(newTaskForm(page).getByRole('combobox', { name: 'Projeto' })).not.toContainText(b.project.name);
    await newTaskForm(page).getByRole('button', { name: 'Cancelar' }).click();

    // Seções Membros, Equipes e Projetos da empresa A
    await openView(page, 'membros');
    await expectOwnData(page, a, 'membros');
    await expectNoDataFrom(page, b);
    await expect(membersSection(page).getByRole('heading', { name: 'Membros (2)' })).toBeVisible();
    await expect(membersSection(page).getByRole('heading', { name: 'Convites pendentes (1)' })).toBeVisible();
    for (const view of ['equipes', 'projetos'] as const) {
      await openView(page, view);
      await expectOwnData(page, a, view);
      await expectNoDataFrom(page, b);
    }

    // Membro da empresa B, em outro navegador
    const memberB = await openSession(b.member, 'tarefas');
    await expect(memberB.getByRole('banner')).toContainText(b.company.name);
    await expectOwnData(memberB, b, 'tarefas');
    await expectNoDataFrom(memberB, a);
    for (const view of ['membros', 'equipes', 'projetos'] as const) {
      await openView(memberB, view);
      await expectOwnData(memberB, b, view);
      await expectNoDataFrom(memberB, a);
    }

    // Mudar o status da tarefa #1 da A não mexe na tarefa #1 da B
    await openView(page, 'tarefas');
    await changeStatus(taskCard(page, a.open.taskName), 'Em andamento');
    expect((await api.getTask(a.company.leader.token, 1))?.status).toBe('em_andamento');
    expect((await api.getTask(b.company.leader.token, 1))?.status).toBe('pendente');
    await openView(memberB, 'tarefas');
    await expect(statusBadge(taskCard(memberB, b.open.taskName))).toHaveText('Pendente');
  });

  test('líder não consegue convidar quem já pertence a outra empresa', async ({ page, api, loginAs }) => {
    const a = await api.createCompany();
    const b: SeededCompany = await api.createCompany();
    const memberB = await api.addMember(b, { firstName: 'Bruno' });
    await loginAs(a.leader, 'membros');

    const dialog = await openDialog(page, membersSection(page).getByRole('button', { name: 'Convidar membro' }), 'Convidar membro');
    await dialog.getByLabel('Email do convidado').fill(memberB.email);
    const action = waitForServerAction(page);
    await dialog.getByRole('button', { name: 'Convidar', exact: true }).click();
    await action;

    await expect(dialog.getByRole('alert')).toHaveText('Email já está cadastrado!');
    await dialog.getByRole('button', { name: 'Cancelar' }).click();
    await expect(inviteRow(page, memberB.email)).toHaveCount(0);
    await expect(memberRow(page, memberB.email)).toHaveCount(0);
    // Continua na empresa B
    const employeesB = await api.getEmployees(b.leader.token);
    expect(employeesB.find(employee => employee.email === memberB.email)?.isRegistered).toBe(true);
    expect((await api.getEmployees(a.leader.token)).map(employee => employee.email)).toEqual([a.leader.email]);
  });
});
