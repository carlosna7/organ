import { randomUUID } from 'node:crypto';

/**
 * Dados únicos por teste: cada teste cria a própria empresa, com nome e emails que não colidem
 * com os de outros testes (mesmo rodando em paralelo ou repetidos com --repeat-each).
 */

/** Identificador curto e único (timestamp em base 36 + 8 caracteres aleatórios) */
export function uid(): string {
  return `${Date.now().toString(36)}${randomUUID().replace(/-/g, '').slice(0, 8)}`;
}

/** Senha válida (mínimo de 6 caracteres) usada nas contas de teste */
export const TEST_PASSWORD = 'senha-e2e-123';

export type PersonData = {
  name: string;
  position: string;
  email: string;
  password: string;
};

/** Email único num domínio reservado para testes */
export function uniqueEmail(prefix = 'pessoa'): string {
  return `${prefix}.${uid()}@e2e.organ.test`;
}

/** Nome de empresa único */
export function uniqueCompanyName(prefix = 'Empresa E2E'): string {
  return `${prefix} ${uid()}`;
}

/**
 * Dados de uma pessoa com nome único. O primeiro nome é fixo (aparece em "Olá, <nome>"),
 * o sobrenome leva o identificador único.
 */
export function person(firstName = 'Ana', overrides: Partial<PersonData> = {}): PersonData {
  const id = uid();
  return {
    name: `${firstName} Teste${id}`,
    position: 'Analista de Testes',
    email: `${firstName.toLowerCase()}.${id}@e2e.organ.test`,
    password: TEST_PASSWORD,
    ...overrides,
  };
}

/** Data de hoje no formato exibido pelo app (dd/mm/aaaa no fuso do app) */
export function todayInAppTimeZone(timeZone: string, date = new Date()): string {
  return date.toLocaleDateString('pt-BR', { timeZone });
}

/** Escapa um texto para uso literal numa RegExp */
export function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
