import { expect, test } from './support/fixtures';
import { uid } from './support/data';
import { newTaskForm, openDialog, tasksSection } from './support/ui';
import type { Page } from '@playwright/test';

const newTaskButton = (page: Page) => tasksSection(page).getByRole('button', { name: 'Nova tarefa' });

test.describe('Janelas modais', () => {
  test('fecha com Esc, pelo botão Fechar, por Cancelar e clicando no fundo, devolvendo o foco ao botão', async ({
    page,
    api,
    loginAs,
  }) => {
    const company = await api.createCompany();
    await api.createTask(company.leader.token, { taskName: `Existente ${uid()}` });
    await loginAs(company.leader, 'tarefas');
    const trigger = newTaskButton(page);

    // Esc
    await openDialog(page, trigger, 'Nova tarefa');
    await page.keyboard.press('Escape');
    await expect(newTaskForm(page)).toHaveCount(0);
    await expect(trigger).toBeFocused();

    // Botão Fechar (X)
    await openDialog(page, trigger, 'Nova tarefa');
    await newTaskForm(page).getByRole('button', { name: 'Fechar' }).click();
    await expect(newTaskForm(page)).toHaveCount(0);
    await expect(trigger).toBeFocused();

    // Cancelar
    await openDialog(page, trigger, 'Nova tarefa');
    await newTaskForm(page).getByRole('button', { name: 'Cancelar' }).click();
    await expect(newTaskForm(page)).toHaveCount(0);
    await expect(trigger).toBeFocused();

    // Clique no fundo (fora da janela)
    await openDialog(page, trigger, 'Nova tarefa');
    await page.mouse.click(5, 5);
    await expect(newTaskForm(page)).toHaveCount(0);
    await expect(trigger).toBeFocused();
  });

  test('clicar dentro da janela, ou arrastar a seleção de texto até o fundo, não fecha', async ({
    page,
    api,
    loginAs,
  }) => {
    const company = await api.createCompany();
    await loginAs(company.leader, 'tarefas');

    const form = await openDialog(page, newTaskButton(page), 'Nova tarefa');
    await form.getByRole('heading', { name: 'Nova tarefa' }).click();
    await form.getByLabel('Nome da tarefa').click();
    await expect(form).toBeVisible();

    // Começa o clique dentro do campo e solta no fundo: é uma seleção de texto, não fecha
    const field = await form.getByLabel('Nome da tarefa').boundingBox();
    if (!field) throw new Error('campo fora da tela');
    await form.getByLabel('Nome da tarefa').fill('texto para selecionar');
    await page.mouse.move(field.x + 20, field.y + field.height / 2);
    await page.mouse.down();
    await page.mouse.move(5, 5, { steps: 8 });
    await page.mouse.up();
    await expect(form).toBeVisible();
    await expect(form.getByLabel('Nome da tarefa')).toHaveValue('texto para selecionar');
  });

  test('o foco fica preso dentro da janela e a página de trás não rola', async ({ page, api, loginAs }) => {
    const company = await api.createCompany();
    await api.addMember(company, { firstName: 'Bruno' });
    await loginAs(company.leader, 'tarefas');

    const form = await openDialog(page, newTaskButton(page), 'Nova tarefa');
    await expect(form.getByLabel('Nome da tarefa')).toBeFocused();

    // Tab várias vezes: o foco nunca cai na página de trás. Ao passar do último campo, o <dialog> nativo
    // leva o foco para fora do documento (a barra do navegador) e depois volta para a janela
    const focusStaysInDialog = () =>
      form.evaluate(dialog => document.activeElement === document.body || dialog.contains(document.activeElement));
    for (let index = 0; index < 20; index++) {
      await page.keyboard.press('Tab');
      expect(await focusStaysInDialog()).toBe(true);
    }
    // Shift+Tab também
    for (let index = 0; index < 20; index++) {
      await page.keyboard.press('Shift+Tab');
      expect(await focusStaysInDialog()).toBe(true);
    }

    // A rolagem da página fica travada enquanto a janela está aberta e volta ao fechar
    expect(await page.evaluate(() => document.body.style.overflow)).toBe('hidden');
    await page.keyboard.press('Escape');
    await expect(newTaskForm(page)).toHaveCount(0);
    expect(await page.evaluate(() => document.body.style.overflow)).toBe('');
  });

  test('a janela tem nome, é modal e a página de trás não recebe cliques', async ({ page, api, loginAs }) => {
    const company = await api.createCompany();
    await loginAs(company.leader, 'tarefas');

    const form = await openDialog(page, newTaskButton(page), 'Nova tarefa');
    await expect(form).toHaveAccessibleName('Nova tarefa');
    // <dialog> aberto com showModal(): fica na camada superior, com a página de trás bloqueada
    expect(await form.evaluate(dialog => (dialog as HTMLDialogElement).matches(':modal'))).toBe(true);
    await expect(newTaskButton(page).click({ trial: true, timeout: 1_000 })).rejects.toThrow();
  });

  test('o que foi digitado some ao cancelar: a janela reaberta vem em branco', async ({ page, api, loginAs }) => {
    const company = await api.createCompany();
    await loginAs(company.leader, 'tarefas');

    const form = await openDialog(page, newTaskButton(page), 'Nova tarefa');
    await form.getByLabel('Nome da tarefa').fill('Rascunho');
    await form.getByLabel('Descrição (opcional)').fill('Texto de rascunho');
    await page.keyboard.press('Escape');
    await expect(newTaskForm(page)).toHaveCount(0);

    await openDialog(page, newTaskButton(page), 'Nova tarefa');
    await expect(form.getByLabel('Nome da tarefa')).toHaveValue('');
    await expect(form.getByLabel('Descrição (opcional)')).toHaveValue('');
  });
});
