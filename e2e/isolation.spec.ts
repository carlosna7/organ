import { expect, test } from './support/fixtures';
import { escapeRegExp, uid } from './support/data';
import {
  allTaskCards,
  changeStatus,
  inviteRow,
  memberRow,
  newTaskForm,
  openDashboard,
  statusBadge,
  taskCard,
  tasksSection,
  teamSection,
  waitForServerAction,
} from './support/ui';
import type { Page } from '@playwright/test';
import type { OrganApi, SeededCompany } from './support/api';

/** Empresa com líder, um membro, um convite pendente e uma tarefa concluída e outra pendente */
async function seed(api: OrganApi, label: string) {
  const company = await api.createCompany({ name: `Empresa ${label} ${uid()}` });
  const member = await api.addMember(company, { firstName: 'Bruno' });
  const invite = await api.addInvite(company);
  const open = await api.createTask(company.leader.token, {
    taskName: `Tarefa aberta da ${label} ${uid()}`,
    description: `Descrição confidencial da ${label} ${uid()}`,
    responsibles: [{ employeeId: member.employeeId, leadershipLevel: 3 }],
  });
  const closed = await api.createTask(company.leader.token, { taskName: `Tarefa concluída da ${label} ${uid()}` });
  await api.setTaskStatus(company.leader.token, closed.taskId, 'concluida');
  return { company, member, invite, open, closed };
}

type Seed = Awaited<ReturnType<typeof seed>>;

/** Textos que identificam a empresa (nomes, emails, tarefas) */
function fingerprints({ company, member, invite, open, closed }: Seed): string[] {
  return [
    company.name,
    company.leader.name,
    company.leader.email,
    member.name,
    member.email,
    invite.email,
    open.taskName,
    open.description ?? '',
    closed.taskName,
  ];
}

/** A página mostra os dados da própria empresa */
async function expectOwnData(page: Page, own: Seed) {
  for (const text of fingerprints(own)) {
    await expect(page.locator('body'), `deveria mostrar "${text}"`).toContainText(text);
  }
}

/** Nada da outra empresa aparece na página */
async function expectNoDataFrom(page: Page, other: Seed) {
  for (const text of fingerprints(other)) {
    await expect(page.locator('body'), `não deveria mostrar "${text}"`).not.toContainText(text);
  }
}

test.describe('Isolamento entre empresas', () => {
  test('dados de uma empresa não aparecem na outra', async ({ page, api, loginAs, openSession }) => {
    const a = await seed(api, 'A');
    const b = await seed(api, 'B');

    // Líder da empresa A
    await loginAs(a.company.leader);
    await expect(page.getByRole('banner')).toContainText(a.company.name);
    await expectOwnData(page, a);
    await expectNoDataFrom(page, b);
    await expect(teamSection(page).getByRole('heading', { name: 'Membros (2)' })).toBeVisible();
    await expect(teamSection(page).getByRole('heading', { name: 'Convites pendentes (1)' })).toBeVisible();
    await expect(allTaskCards(page)).toHaveCount(2);
    // Os ids são sequenciais por empresa: as duas têm a tarefa #1
    expect(a.open.taskId).toBe(1);
    expect(b.open.taskId).toBe(1);

    // Também nos filtros e na lista de responsáveis
    for (const query of ['?status=pendente', '?status=em_andamento', '?status=concluida']) {
      await openDashboard(page, query);
      await expectNoDataFrom(page, b);
    }
    await openDashboard(page, '?status=concluida');
    await expect(allTaskCards(page)).toHaveCount(1);
    await expect(taskCard(page, a.closed.taskName)).toBeVisible();
    await openDashboard(page);
    await tasksSection(page).getByRole('button', { name: 'Nova tarefa' }).click();
    const checkboxes = newTaskForm(page).getByRole('checkbox');
    await expect(checkboxes).toHaveCount(2);
    for (const name of [b.company.leader.name, b.member.name]) {
      await expect(newTaskForm(page).getByRole('checkbox', { name: new RegExp(escapeRegExp(name)) })).toHaveCount(0);
    }

    // Membro da empresa B, em outro navegador
    const memberB = await openSession(b.member);
    await expect(memberB.getByRole('banner')).toContainText(b.company.name);
    await expectOwnData(memberB, b);
    await expectNoDataFrom(memberB, a);

    // Mudar o status da tarefa #1 da A não mexe na tarefa #1 da B
    await changeStatus(taskCard(page, a.open.taskName), 'Em andamento');
    expect((await api.getTask(a.company.leader.token, 1))?.status).toBe('em_andamento');
    expect((await api.getTask(b.company.leader.token, 1))?.status).toBe('pendente');
    await openDashboard(memberB);
    await expect(statusBadge(taskCard(memberB, b.open.taskName))).toHaveText('Pendente');
  });

  test('líder não consegue convidar quem já pertence a outra empresa', async ({ page, api, loginAs }) => {
    const a = await api.createCompany();
    const b: SeededCompany = await api.createCompany();
    const memberB = await api.addMember(b, { firstName: 'Bruno' });
    await loginAs(a.leader);

    await page.getByLabel('Convidar por email').fill(memberB.email);
    const action = waitForServerAction(page);
    await page.getByRole('button', { name: 'Convidar', exact: true }).click();
    await action;

    await expect(teamSection(page).getByRole('alert')).toHaveText('Email já está cadastrado!');
    await expect(inviteRow(page, memberB.email)).toHaveCount(0);
    await expect(memberRow(page, memberB.email)).toHaveCount(0);
    // Continua na empresa B
    const employeesB = await api.getEmployees(b.leader.token);
    expect(employeesB.find(employee => employee.email === memberB.email)?.isRegistered).toBe(true);
    expect((await api.getEmployees(a.leader.token)).map(employee => employee.email)).toEqual([a.leader.email]);
  });
});
