import { expect, test } from './support/fixtures';
import { uid } from './support/data';
import {
  memberRow,
  openDialog,
  openView,
  projectCard,
  teamCard,
  teamsSection,
  waitForServerAction,
} from './support/ui';
import type { Page } from '@playwright/test';

const newTeamForm = (page: Page) => page.getByRole('dialog', { name: 'Nova equipe' });
const editTeamForm = (page: Page) => page.getByRole('dialog', { name: 'Editar equipe' });
const newTeamButton = (page: Page) => teamsSection(page).getByRole('button', { name: 'Nova equipe' });
const membersOf = (page: Page, teamName: string) => teamCard(page, teamName).getByRole('list', { name: `Membros da equipe ${teamName}` });

test.describe('Equipes', () => {
  test.describe('Líder', () => {
    test('criar equipe pela janela, com descrição e membros', async ({ page, api, loginAs }) => {
      const company = await api.createCompany();
      const bruno = await api.addMember(company, { firstName: 'Bruno' });
      const carla = await api.addMember(company, { firstName: 'Carla' });
      const invite = await api.addInvite(company);
      await loginAs(company.leader, 'equipes');

      // Sem equipes: aviso com botão para criar a primeira
      await expect(teamsSection(page).getByText('Nenhuma equipe por aqui ainda')).toBeVisible();
      await expect(teamsSection(page).getByText('0 equipes')).toBeVisible();

      const form = await openDialog(page, newTeamButton(page), 'Nova equipe');
      // Só funcionários registrados entram numa equipe (o convite pendente não aparece)
      await expect(form.getByRole('checkbox')).toHaveCount(3);
      await expect(form).not.toContainText(invite.email);

      const name = `Produto ${uid()}`;
      await form.getByLabel('Nome da equipe').fill(name);
      await form.getByLabel('Descrição (opcional)').fill('Quem desenha e constrói o app');
      await form.getByRole('checkbox', { name: new RegExp(`^${bruno.name}`) }).check();
      await form.getByRole('checkbox', { name: new RegExp(`^${carla.name}`) }).check();
      await form.getByRole('button', { name: 'Criar equipe' }).click();

      await expect(newTeamForm(page)).toHaveCount(0);
      const card = teamCard(page, name);
      await expect(card).toContainText('Quem desenha e constrói o app');
      await expect(card).toContainText('2 membros');
      await expect(membersOf(page, name).getByRole('listitem')).toHaveCount(2);
      await expect(membersOf(page, name)).toContainText(bruno.name);
      await expect(membersOf(page, name)).toContainText(carla.name);
      await expect(membersOf(page, name)).not.toContainText(company.leader.name);
      await expect(teamsSection(page).getByText('1 equipe')).toBeVisible();

      const [team] = await api.getTeams(company.leader.token);
      expect(team).toMatchObject({ teamId: 1, name, description: 'Quem desenha e constrói o app' });
      expect(team.members.map(member => member.employeeId).sort()).toEqual([bruno.employeeId, carla.employeeId].sort());
    });

    test('nome em branco e nome repetido mostram erro e mantêm a janela aberta', async ({ page, api, loginAs }) => {
      const company = await api.createCompany();
      const existing = await api.createTeam(company.leader.token, { name: `Existente ${uid()}` });
      await loginAs(company.leader, 'equipes');

      const form = await openDialog(page, newTeamButton(page), 'Nova equipe');
      await form.getByLabel('Nome da equipe').fill('    ');
      await form.getByRole('button', { name: 'Criar equipe' }).click();
      await expect(form.getByRole('alert')).toHaveText('Informe o nome da equipe.');

      await form.getByLabel('Nome da equipe').fill(existing.name.toUpperCase());
      const action = waitForServerAction(page);
      await form.getByRole('button', { name: 'Criar equipe' }).click();
      await action;
      await expect(form.getByRole('alert')).toHaveText('Já existe uma equipe com esse nome!');
      await expect(form).toBeVisible();

      await form.getByRole('button', { name: 'Cancelar' }).click();
      await expect(newTeamForm(page)).toHaveCount(0);
      expect(await api.getTeams(company.leader.token)).toHaveLength(1);
    });

    test('editar nome, descrição e membros', async ({ page, api, loginAs }) => {
      const company = await api.createCompany();
      const token = company.leader.token;
      const bruno = await api.addMember(company, { firstName: 'Bruno' });
      const carla = await api.addMember(company, { firstName: 'Carla' });
      const team = await api.createTeam(token, {
        name: `Antiga ${uid()}`,
        description: 'Descrição antiga',
        memberIds: [bruno.employeeId],
      });
      await loginAs(company.leader, 'equipes');

      await openDialog(page, teamCard(page, team.name).getByRole('button', { name: `Editar a equipe ${team.name}` }), 'Editar equipe');
      const form = editTeamForm(page);
      // Pré-preenchido com os dados atuais
      await expect(form.getByLabel('Nome da equipe')).toHaveValue(team.name);
      await expect(form.getByLabel('Descrição (opcional)')).toHaveValue('Descrição antiga');
      await expect(form.getByRole('checkbox', { name: new RegExp(`^${bruno.name}`) })).toBeChecked();
      await expect(form.getByRole('checkbox', { name: new RegExp(`^${carla.name}`) })).not.toBeChecked();

      const newName = `Nova ${uid()}`;
      await form.getByLabel('Nome da equipe').fill(newName);
      await form.getByLabel('Descrição (opcional)').fill('');
      await form.getByRole('checkbox', { name: new RegExp(`^${bruno.name}`) }).uncheck();
      await form.getByRole('checkbox', { name: new RegExp(`^${carla.name}`) }).check();
      await form.getByRole('button', { name: 'Salvar' }).click();

      await expect(form).toHaveCount(0);
      await expect(teamCard(page, team.name)).toHaveCount(0);
      await expect(membersOf(page, newName)).toContainText(carla.name);
      await expect(membersOf(page, newName)).not.toContainText(bruno.name);
      await expect(teamCard(page, newName)).not.toContainText('Descrição antiga');

      const [saved] = await api.getTeams(token);
      expect(saved).toMatchObject({ name: newName, description: null });
      expect(saved.members.map(member => member.employeeId)).toEqual([carla.employeeId]);

      // Tirar todos os membros deixa a equipe vazia
      await openDialog(page, teamCard(page, newName).getByRole('button', { name: `Editar a equipe ${newName}` }), 'Editar equipe');
      await form.getByRole('checkbox', { name: new RegExp(`^${carla.name}`) }).uncheck();
      await form.getByRole('button', { name: 'Salvar' }).click();
      await expect(form).toHaveCount(0);
      await expect(teamCard(page, newName)).toContainText('Nenhum membro nesta equipe.');
      expect((await api.getTeams(token))[0].members).toEqual([]);
    });

    test('excluir com confirmação: os projetos continuam, sem equipe', async ({ page, api, loginAs }) => {
      const company = await api.createCompany();
      const token = company.leader.token;
      const team = await api.createTeam(token, { name: `Excluir ${uid()}` });
      const keep = await api.createTeam(token, { name: `Manter ${uid()}` });
      const project = await api.createProject(token, { name: `Projeto ${uid()}`, teamId: team.teamId });
      await loginAs(company.leader, 'equipes');
      await expect(teamCard(page, team.name)).toContainText(project.name);

      const card = teamCard(page, team.name);
      const deleteButton = card.getByRole('button', { name: `Excluir a equipe ${team.name}` });

      // Cancelar não exclui
      await deleteButton.click();
      await card.getByRole('button', { name: 'Cancelar', exact: true }).click();
      await expect(deleteButton).toBeVisible();

      await deleteButton.click();
      await card.getByRole('button', { name: `Confirmar exclusão: Excluir a equipe ${team.name}` }).click();
      await expect(teamCard(page, team.name)).toHaveCount(0);
      await expect(teamCard(page, keep.name)).toBeVisible();

      expect((await api.getTeams(token)).map(item => item.teamId)).toEqual([keep.teamId]);
      expect((await api.getProjects(token))[0].team).toBeNull();
      await openView(page, 'projetos');
      await expect(projectCard(page, project.name)).toContainText('Sem equipe');
    });

    test('remover um membro da empresa também o tira das equipes', async ({ page, api, loginAs }) => {
      const company = await api.createCompany();
      const token = company.leader.token;
      const bruno = await api.addMember(company, { firstName: 'Bruno' });
      const carla = await api.addMember(company, { firstName: 'Carla' });
      const team = await api.createTeam(token, { name: `Produto ${uid()}`, memberIds: [bruno.employeeId, carla.employeeId] });
      await loginAs(company.leader, 'equipes');
      await expect(membersOf(page, team.name).getByRole('listitem')).toHaveCount(2);

      await openView(page, 'membros');
      const row = memberRow(page, bruno.email);
      await row.getByRole('button', { name: `Remover ${bruno.name}`, exact: true }).click();
      await row.getByRole('button', { name: `Confirmar remoção de ${bruno.name}` }).click();
      await expect(memberRow(page, bruno.email)).toHaveCount(0);

      await openView(page, 'equipes');
      await expect(membersOf(page, team.name).getByRole('listitem')).toHaveCount(1);
      await expect(membersOf(page, team.name)).toContainText(carla.name);
      expect((await api.getTeams(token))[0].members.map(member => member.employeeId)).toEqual([carla.employeeId]);
    });
  });

  test('a seção Membros mostra a que equipes cada pessoa pertence', async ({ page, api, loginAs }) => {
    const company = await api.createCompany();
    const token = company.leader.token;
    const bruno = await api.addMember(company, { firstName: 'Bruno' });
    const product = await api.createTeam(token, { name: `Produto ${uid()}`, memberIds: [company.leader.employeeId, bruno.employeeId] });
    const quality = await api.createTeam(token, { name: `Qualidade ${uid()}`, memberIds: [bruno.employeeId] });
    await loginAs(company.leader, 'membros');

    const brunoTeams = memberRow(page, bruno.email).getByRole('list', { name: 'Equipes' });
    await expect(brunoTeams.getByRole('listitem')).toHaveText([product.name, quality.name]);
    const leaderTeams = memberRow(page, company.leader.email).getByRole('list', { name: 'Equipes' });
    await expect(leaderTeams.getByRole('listitem')).toHaveText([product.name]);
  });

  test.describe('Membro', () => {
    test('vê as equipes e os projetos delas, sem botões de criar, editar ou excluir', async ({ page, api, loginAs }) => {
      const company = await api.createCompany();
      const token = company.leader.token;
      const bruno = await api.addMember(company, { firstName: 'Bruno' });
      const team = await api.createTeam(token, { name: `Produto ${uid()}`, memberIds: [bruno.employeeId] });
      const project = await api.createProject(token, { name: `Projeto ${uid()}`, teamId: team.teamId });
      await loginAs(bruno, 'equipes');

      await expect(membersOf(page, team.name)).toContainText(bruno.name);
      await expect(teamCard(page, team.name).getByRole('list', { name: `Projetos da equipe ${team.name}` })).toContainText(project.name);
      await expect(teamsSection(page).getByRole('button')).toHaveCount(0);
    });
  });
});
