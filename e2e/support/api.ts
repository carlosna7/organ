import type { APIRequestContext } from '@playwright/test';
import { person, uniqueCompanyName, uniqueEmail, type PersonData } from './data';
import { API_URL } from './env';

/**
 * Helpers que chamam a organ-api (GraphQL) direto, pelo `request` do Playwright.
 * Servem só para PREPARAR estado rápido e conferir o que foi gravado;
 * o comportamento sob teste é sempre exercido pela interface.
 */

export type TaskStatus = 'pendente' | 'em_andamento' | 'concluida';

export type Account = PersonData & {
  employeeId: number;
  role: 'leader' | 'member';
  token: string;
};

export type Invite = { email: string; employeeId: number };

export type SeededCompany = {
  name: string;
  leader: Account;
  members: Account[];
  invites: Invite[];
};

export type ResponsibleInput = { employeeId: number; leadershipLevel: number };

export type ApiTask = {
  taskId: number;
  taskName: string;
  description: string | null;
  status: TaskStatus;
  createdAt: string;
  completedAt: string | null;
  responsibles: { leadershipLevel: number; employee: { employeeId: number; name: string | null } | null }[];
};

export type ApiEmployee = {
  employeeId: number;
  name: string | null;
  position: string | null;
  email: string;
  role: 'leader' | 'member';
  isRegistered: boolean;
};

export class GraphQLRequestError extends Error {
  constructor(
    message: string,
    readonly code: string | undefined
  ) {
    super(`${code ?? 'SEM_CODIGO'}: ${message}`);
  }
}

const AUTH_FIELDS = `token employee { employeeId role }`;

const TASK_FIELDS = `
  taskId taskName description status createdAt completedAt
  responsibles { leadershipLevel employee { employeeId name } }
`;

export class OrganApi {
  constructor(private readonly request: APIRequestContext) {}

  /** Executa uma operação GraphQL; lança GraphQLRequestError se a API devolver erro */
  async gql<T>(query: string, variables: Record<string, unknown> = {}, token?: string): Promise<T> {
    const response = await this.request.post(API_URL, {
      data: { query, variables },
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
    const body = (await response.json()) as {
      data?: T;
      errors?: { message: string; extensions?: { code?: string } }[];
    };
    if (body.errors?.length) {
      const [first] = body.errors;
      throw new GraphQLRequestError(first.message, first.extensions?.code);
    }
    if (!response.ok() || !body.data) {
      throw new Error(`Resposta inesperada da API (${response.status()})`);
    }
    return body.data;
  }

  /** Cria a empresa e o líder (quem cria a empresa é líder) */
  async createCompany(options: { name?: string; leader?: Partial<PersonData> } = {}): Promise<SeededCompany> {
    const name = options.name ?? uniqueCompanyName();
    const leaderData = { ...person('Lia'), ...options.leader };
    const data = await this.gql<{ createCompany: { token: string; employee: { employeeId: number; role: 'leader' } } }>(
      `mutation ($name: String!, $employee: EmployeeInput!) { createCompany(name: $name, employee: $employee) { ${AUTH_FIELDS} } }`,
      { name, employee: leaderData }
    );
    const { token, employee } = data.createCompany;
    return {
      name,
      leader: { ...leaderData, token, employeeId: employee.employeeId, role: employee.role },
      members: [],
      invites: [],
    };
  }

  /** Líder registra um convite (só grava o email) */
  async invite(leaderToken: string, email = uniqueEmail('convite')): Promise<Invite> {
    const data = await this.gql<{ newEmployee: { employeeId: number; email: string } }>(
      `mutation ($email: String!) { newEmployee(email: $email) { employeeId email } }`,
      { email },
      leaderToken
    );
    return data.newEmployee;
  }

  /** Convidado conclui o cadastro */
  async register(data: PersonData): Promise<Account> {
    const result = await this.gql<{ register: { token: string; employee: { employeeId: number; role: 'member' } } }>(
      `mutation ($name: String!, $position: String!, $email: String!, $password: String!) {
        register(name: $name, position: $position, email: $email, password: $password) { ${AUTH_FIELDS} }
      }`,
      { ...data }
    );
    const { token, employee } = result.register;
    return { ...data, token, employeeId: employee.employeeId, role: employee.role };
  }

  /** Convida e cadastra um membro na empresa (acrescenta em company.members) */
  async addMember(company: SeededCompany, data: Partial<PersonData> & { firstName?: string } = {}): Promise<Account> {
    const { firstName, ...overrides } = data;
    const memberData = { ...person(firstName ?? 'Bruno'), ...overrides };
    await this.invite(company.leader.token, memberData.email);
    const member = await this.register(memberData);
    company.members.push(member);
    return member;
  }

  /** Registra um convite pendente (acrescenta em company.invites) */
  async addInvite(company: SeededCompany, email?: string): Promise<Invite> {
    const invite = await this.invite(company.leader.token, email);
    company.invites.push(invite);
    return invite;
  }

  async login(email: string, password: string): Promise<string> {
    const data = await this.gql<{ login: { token: string } }>(
      `mutation ($email: String!, $password: String!) { login(email: $email, password: $password) { token } }`,
      { email, password }
    );
    return data.login.token;
  }

  async createTask(
    token: string,
    task: { taskName: string; description?: string | null; responsibles?: ResponsibleInput[] }
  ): Promise<ApiTask> {
    const data = await this.gql<{ createTask: ApiTask }>(
      `mutation ($task: TaskInput!) { createTask(task: $task) { ${TASK_FIELDS} } }`,
      { task },
      token
    );
    return data.createTask;
  }

  async updateTask(
    token: string,
    taskId: number,
    task: { taskName?: string; description?: string | null; responsibles?: ResponsibleInput[] }
  ): Promise<ApiTask> {
    const data = await this.gql<{ updateTask: ApiTask }>(
      `mutation ($taskId: Int!, $task: TaskUpdateInput!) { updateTask(taskId: $taskId, task: $task) { ${TASK_FIELDS} } }`,
      { taskId, task },
      token
    );
    return data.updateTask;
  }

  async setTaskStatus(token: string, taskId: number, status: TaskStatus): Promise<ApiTask> {
    const data = await this.gql<{ updateTaskStatus: ApiTask }>(
      `mutation ($taskId: Int!, $status: TaskStatus!) { updateTaskStatus(taskId: $taskId, status: $status) { ${TASK_FIELDS} } }`,
      { taskId, status },
      token
    );
    return data.updateTaskStatus;
  }

  async getTasks(token: string, status?: TaskStatus): Promise<ApiTask[]> {
    const data = await this.gql<{ getTasks: ApiTask[] }>(
      `query ($status: TaskStatus) { getTasks(status: $status) { ${TASK_FIELDS} } }`,
      { status: status ?? null },
      token
    );
    return data.getTasks;
  }

  async getTask(token: string, taskId: number): Promise<ApiTask | undefined> {
    return (await this.getTasks(token)).find(task => task.taskId === taskId);
  }

  async getEmployees(token: string): Promise<ApiEmployee[]> {
    const data = await this.gql<{ getEmployees: ApiEmployee[] }>(
      `query { getEmployees { employeeId name position email role isRegistered } }`,
      {},
      token
    );
    return data.getEmployees;
  }
}
