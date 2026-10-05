#!/usr/bin/env node
/**
 * Cria uma empresa de demonstração ("Acme Demo") pela API GraphQL, com líder, membros, um convite
 * pendente, equipes, projetos e tarefas em vários status. Serve para ver o painel com dados.
 *
 *   npm run seed:demo
 *
 * Variável opcional:
 *   SEED_API_URL   endereço da API (padrão: http://localhost:4000)
 *
 * Roda uma vez por banco: os emails são únicos, então uma segunda execução falha com
 * "Email já está cadastrado!". Contas criadas (senha de demonstração, só para uso local):
 *   lia@demo.test (líder), bruno@demo.test, carla@demo.test, davi@demo.test
 *   senha: senha-demo-123
 */
const API_URL = process.env.SEED_API_URL || 'http://localhost:4000';
const PASSWORD = 'senha-demo-123';

async function gql(query, variables = {}, token) {
  const response = await fetch(API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: JSON.stringify({ query, variables }),
  });
  const body = await response.json();
  if (body.errors) throw new Error(body.errors.map(error => error.message).join('; '));
  return body.data;
}

const company = await gql(
  `mutation ($name: String!, $employee: EmployeeInput!) {
    createCompany(name: $name, employee: $employee) { token employee { employeeId } }
  }`,
  { name: 'Acme Demo', employee: { name: 'Lia Souza', position: 'Diretora', email: 'lia@demo.test', password: PASSWORD } }
);
const leaderToken = company.createCompany.token;
const leaderId = company.createCompany.employee.employeeId;

// Membros: o líder convida e a pessoa conclui o cadastro
const members = [
  ['Bruno Lima', 'Desenvolvedor', 'bruno@demo.test'],
  ['Carla Dias', 'Designer', 'carla@demo.test'],
  ['Davi Rocha', 'QA', 'davi@demo.test'],
];
const ids = {};
for (const [name, position, email] of members) {
  await gql(`mutation ($email: String!) { newEmployee(email: $email) { employeeId } }`, { email }, leaderToken);
  const registered = await gql(
    `mutation ($name: String!, $position: String!, $email: String!, $password: String!) {
      register(name: $name, position: $position, email: $email, password: $password) { employee { employeeId } }
    }`,
    { name, position, email, password: PASSWORD }
  );
  ids[name] = registered.register.employee.employeeId;
}
// Convite pendente (ninguém se cadastrou ainda)
await gql(`mutation ($email: String!) { newEmployee(email: $email) { employeeId } }`, { email: 'convidado@demo.test' }, leaderToken);

const createTeam = async team =>
  (await gql(`mutation ($team: TeamInput!) { createTeam(team: $team) { teamId } }`, { team }, leaderToken)).createTeam;
const createProject = async project =>
  (await gql(`mutation ($project: ProjectInput!) { createProject(project: $project) { projectId } }`, { project }, leaderToken))
    .createProject;

const product = await createTeam({
  name: 'Produto',
  description: 'Quem desenha e constrói o app',
  memberIds: [leaderId, ids['Bruno Lima'], ids['Carla Dias']],
});
const quality = await createTeam({ name: 'Qualidade', memberIds: [ids['Davi Rocha']] });

const site = await createProject({ name: 'Site novo', description: 'Redesenho do site institucional', teamId: product.teamId });
const app = await createProject({ name: 'App mobile', teamId: quality.teamId });

// [nome, descrição, projeto, status]
const tasks = [
  ['Definir identidade visual', 'Paleta, tipografia e logotipo', site.projectId, 'concluida'],
  ['Montar wireframes da home', null, site.projectId, 'em_andamento'],
  ['Implementar o cabeçalho', 'Usar o design system', site.projectId, 'pendente'],
  ['Escrever testes de aceitação', null, app.projectId, 'pendente'],
  ['Revisar contrato com fornecedor', 'Enviar para o jurídico', null, 'pendente'],
  ['Planejar o próximo trimestre', null, null, 'em_andamento'],
];
for (const [taskName, description, projectId, status] of tasks) {
  const { createTask } = await gql(
    `mutation ($task: TaskInput!) { createTask(task: $task) { taskId } }`,
    {
      task: {
        taskName,
        description,
        projectId,
        responsibles: [
          { employeeId: leaderId, leadershipLevel: 3 },
          { employeeId: ids['Bruno Lima'], leadershipLevel: 2 },
        ],
      },
    },
    leaderToken
  );
  if (status !== 'pendente') {
    await gql(
      `mutation ($taskId: Int!, $status: TaskStatus!) { updateTaskStatus(taskId: $taskId, status: $status) { taskId } }`,
      { taskId: createTask.taskId, status },
      leaderToken
    );
  }
}

console.log(`Empresa "Acme Demo" criada em ${API_URL}. Entre com lia@demo.test (senha: ${PASSWORD}).`);
