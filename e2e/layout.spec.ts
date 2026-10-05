import { expect, test } from './support/fixtures';
import { uid } from './support/data';
import {
  editTaskForm,
  expectNoHorizontalOverflow,
  measureHorizontalOverflow,
  memberRow,
  newTaskForm,
  openDialog,
  openView,
  projectCard,
  taskCard,
  tasksSection,
  teamCard,
  visit,
} from './support/ui';
import type { Page } from '@playwright/test';
import type { OrganApi } from './support/api';

// Roda no projeto "mobile" (Pixel 5, 393px de largura): veja playwright.config.ts

/** Empresa com textos longos: nomes/cargos com e sem espaços, emails, tarefas, equipe e projeto sem espaços (URL) */
async function seedLongTexts(api: OrganApi) {
  const id = uid();
  const company = await api.createCompany({
    name: `Companhia Brasileira de Distribuição, Logística e Armazenagem Integrada do Nordeste ${id}`,
    leader: {
      name: `Maximiliano Bartholomeu Constantino de Albuquerque e Vasconcellos Neto ${id}`,
      position: 'Coordenador-Geral de Planejamento Estratégico, Inovação e Transformação Digital Corporativa',
      email: `maximiliano.bartholomeu.constantino.de.albuquerque.${id}@subdominio.departamento.empresa-exemplo.com.br`,
    },
  });
  const member = await api.addMember(company, {
    name: `Wolfeschlegelsteinhausenbergerdorff_Pedro_de_Alcantara_Francisco_Antonio_${id}`,
    position: 'Superintendente_de_Operacoes_Logisticas_e_Infraestrutura_Tecnologica_Regional_Nordeste',
    email: `um.email.extremamente.longo.sem.espacos.para.testar.quebra.${id}@empresa-com-dominio-longo.com.br`,
  });
  const invite = await api.addInvite(
    company,
    `convite.pendente.com.endereco.de.email.muito.longo.${id}@organizacao-internacional-exemplo.org.br`
  );
  const team = await api.createTeam(company.leader.token, {
    name: `EquipeComNomeExtremamenteLongoSemNenhumEspaco_${'B'.repeat(60)}_${id}`,
    description: `https://docs.exemplo.com.br/equipes/${'secao-'.repeat(20)}${id}#ancora-final-sem-espacos`,
    memberIds: [company.leader.employeeId, member.employeeId],
  });
  const project = await api.createProject(company.leader.token, {
    name: `ProjetoComNomeExtremamenteLongoSemNenhumEspaco_${'C'.repeat(70)}_${id}`,
    description: `https://docs.exemplo.com.br/projetos/${'secao-'.repeat(20)}${id}#ancora-final-sem-espacos`,
    teamId: team.teamId,
  });
  const responsibles = [
    { employeeId: company.leader.employeeId, leadershipLevel: 3 },
    { employeeId: member.employeeId, leadershipLevel: 2 },
  ];
  const urlTask = await api.createTask(company.leader.token, {
    taskName: `https://exemplo.com.br/projetos/organ/tarefas/${id}/um-caminho-muito-longo-sem-espacos-para-testar-a-quebra?filtro=status&ordem=desc&pagina=1`,
    description: `https://docs.exemplo.com.br/especificacao/${'secao-'.repeat(20)}${id}#ancora-final-sem-espacos`,
    projectId: project.projectId,
    responsibles,
  });
  const longTask = await api.createTask(company.leader.token, {
    taskName: `TarefaComNomeExtremamenteLongoSemNenhumEspaco_${'A'.repeat(80)}_${id}`,
    projectId: project.projectId,
    responsibles,
  });
  await api.setTaskStatus(company.leader.token, longTask.taskId, 'concluida');
  return { company, member, invite, team, project, urlTask, longTask };
}

/** Abre as janelas "Nova tarefa" e "Editar" (e a confirmação de exclusão) e mede o overflow a cada passo */
async function openFormsAndCheck(page: Page, taskName: string, label: string) {
  await openView(page, 'tarefas');
  await openDialog(page, tasksSection(page).getByRole('button', { name: 'Nova tarefa' }), 'Nova tarefa');
  await expectNoHorizontalOverflow(page, `${label} com a janela "Nova tarefa" aberta`);
  await newTaskForm(page).getByRole('button', { name: 'Cancelar' }).click();
  await expect(newTaskForm(page)).toHaveCount(0);

  await openDialog(page, taskCard(page, taskName).getByRole('button', { name: `Editar a tarefa ${taskName}` }), 'Editar tarefa');
  await expectNoHorizontalOverflow(page, `${label} com a janela "Editar" aberta`);
  await editTaskForm(page).getByRole('button', { name: 'Cancelar' }).click();
  await expect(editTaskForm(page)).toHaveCount(0);

  await taskCard(page, taskName).getByRole('button', { name: `Excluir a tarefa ${taskName}` }).click();
  await expect(taskCard(page, taskName).getByRole('button', { name: /^Confirmar exclusão/ })).toBeVisible();
  await expectNoHorizontalOverflow(page, `${label} com a confirmação de exclusão aberta`);

  // Janelas de projeto, equipe e convite
  await openView(page, 'projetos');
  await openDialog(page, page.getByRole('button', { name: 'Novo projeto' }), 'Novo projeto');
  await expectNoHorizontalOverflow(page, `${label} com a janela "Novo projeto" aberta`);
  await page.getByRole('dialog').getByRole('button', { name: 'Cancelar' }).click();

  await openView(page, 'equipes');
  await openDialog(page, page.getByRole('button', { name: 'Nova equipe' }), 'Nova equipe');
  await expectNoHorizontalOverflow(page, `${label} com a janela "Nova equipe" aberta`);
  await page.getByRole('dialog').getByRole('button', { name: 'Cancelar' }).click();

  await openView(page, 'membros');
  await openDialog(page, page.getByRole('button', { name: 'Convidar membro' }), 'Convidar membro');
  await expectNoHorizontalOverflow(page, `${label} com a janela "Convidar membro" aberta`);
}

test.describe('Layout no celular (sem overflow horizontal)', () => {
  test('controle: o detector acusa um elemento mais largo que a tela', async ({ page }) => {
    await visit(page, '/');
    await page.evaluate(() => {
      const wide = document.createElement('div');
      wide.style.width = '1200px';
      wide.style.height = '10px';
      wide.textContent = 'elemento-largo-de-teste';
      document.querySelector('main')?.appendChild(wide);
    });
    const report = await measureHorizontalOverflow(page);
    expect(report.scrollWidth).toBeGreaterThan(report.clientWidth);
    expect(report.offenders.join(' ')).toContain('elemento-largo-de-teste');
    // A viewport é mesmo a de celular
    expect(report.clientWidth).toBeLessThanOrEqual(400);
  });

  const publicPages = [
    { path: '/', name: 'landing' },
    { path: '/login', name: 'login' },
    { path: '/login?error=session_expired', name: 'login com alerta' },
    { path: '/register', name: 'register' },
    { path: '/register?error=not_invited', name: 'register com alerta' },
    { path: '/create-company', name: 'create-company' },
    { path: '/create-company?error=company_exists', name: 'create-company com alerta' },
    { path: '/pagina-que-nao-existe', name: '404' },
  ];
  for (const { path, name } of publicPages) {
    test(`sem overflow horizontal: ${name}`, async ({ page }) => {
      await visit(page, path);
      await expectNoHorizontalOverflow(page, name);
    });
  }

  test('sem overflow no dashboard do líder com textos longos, todas as seções e janelas abertas', async ({
    page,
    api,
    loginAs,
  }) => {
    const { company, member, invite, team, project, urlTask } = await seedLongTexts(api);
    await loginAs(company.leader, 'tarefas');

    // Os textos longos estão mesmo na tela
    await expect(page.getByRole('banner')).toContainText(company.name);
    await expect(taskCard(page, urlTask.taskName)).toBeVisible();
    await expectNoHorizontalOverflow(page, 'tarefas do líder (lista)');

    // As três formas de ver as tarefas
    for (const layout of ['grid', 'kanban']) {
      await openView(page, 'tarefas', `&layout=${layout}`);
      await expect(taskCard(page, urlTask.taskName)).toBeVisible();
      await expectNoHorizontalOverflow(page, `tarefas do líder (${layout})`);
    }

    await openView(page, 'resumo');
    await expectNoHorizontalOverflow(page, 'resumo do líder');

    await openView(page, 'projetos');
    await expect(projectCard(page, project.name)).toBeVisible();
    await expectNoHorizontalOverflow(page, 'projetos do líder');

    await openView(page, 'equipes');
    await expect(teamCard(page, team.name)).toBeVisible();
    await expectNoHorizontalOverflow(page, 'equipes do líder');

    await openView(page, 'membros');
    await expect(memberRow(page, member.email)).toContainText(member.name);
    await expect(page.getByText(invite.email)).toBeVisible();
    await expectNoHorizontalOverflow(page, 'membros do líder');

    // Confirmação de remoção do membro com nome longo
    await memberRow(page, member.email).getByRole('button', { name: `Remover ${member.name}`, exact: true }).click();
    await expect(memberRow(page, member.email).getByRole('button', { name: /^Confirmar remoção/ })).toBeVisible();
    await expectNoHorizontalOverflow(page, 'membros com a confirmação de remoção aberta');

    await openFormsAndCheck(page, urlTask.taskName, 'dashboard do líder');
  });

  test('sem overflow no dashboard do membro e com filtro', async ({ page, api, loginAs }) => {
    const { member, longTask } = await seedLongTexts(api);
    await loginAs(member, 'tarefas');
    await expect(taskCard(page, longTask.taskName)).toBeVisible();
    await expectNoHorizontalOverflow(page, 'dashboard do membro');

    await openDialog(page, tasksSection(page).getByRole('button', { name: 'Nova tarefa' }), 'Nova tarefa');
    await expectNoHorizontalOverflow(page, 'dashboard do membro com a janela "Nova tarefa" aberta');
    await newTaskForm(page).getByRole('button', { name: 'Cancelar' }).click();

    await openView(page, 'tarefas', '&status=concluida');
    await expect(taskCard(page, longTask.taskName)).toBeVisible();
    await expectNoHorizontalOverflow(page, 'dashboard filtrado (concluída)');

    await openView(page, 'tarefas', '&status=em_andamento');
    await expect(tasksSection(page).getByText('Nenhuma tarefa com status “Em andamento”')).toBeVisible();
    await expectNoHorizontalOverflow(page, 'dashboard filtrado vazio');

    for (const view of ['resumo', 'projetos', 'equipes', 'membros'] as const) {
      await openView(page, view);
      await expectNoHorizontalOverflow(page, `${view} do membro`);
    }
  });

  test.describe('em 320px (menor largura do critério de reflow da WCAG 1.4.10)', () => {
    test.beforeEach(async ({ page }) => {
      await page.setViewportSize({ width: 320, height: 640 });
    });

    for (const { path, name } of publicPages) {
      test(`sem overflow horizontal em 320px: ${name}`, async ({ page }) => {
        await visit(page, path);
        await expectNoHorizontalOverflow(page, `${name} em 320px`);
      });
    }

    test('sem overflow no dashboard em 320px com textos longos, todas as seções e janelas abertas', async ({
      page,
      api,
      loginAs,
    }) => {
      const { company, urlTask } = await seedLongTexts(api);
      await loginAs(company.leader, 'tarefas');
      await expectNoHorizontalOverflow(page, 'tarefas em 320px');
      for (const layout of ['grid', 'kanban']) {
        await openView(page, 'tarefas', `&layout=${layout}`);
        await expectNoHorizontalOverflow(page, `tarefas (${layout}) em 320px`);
      }
      for (const view of ['resumo', 'projetos', 'equipes', 'membros'] as const) {
        await openView(page, view);
        await expectNoHorizontalOverflow(page, `${view} em 320px`);
      }
      await openFormsAndCheck(page, urlTask.taskName, 'dashboard em 320px');
    });
  });
});
