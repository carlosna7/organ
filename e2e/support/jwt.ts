import { createHmac } from 'node:crypto';

/**
 * Assina um JWT HS256 (só para montar cookies inválidos/vencidos nos testes de sessão).
 * Implementado com node:crypto para não depender do formato de módulo do `jose`.
 */
export function signTestJwt(
  payload: Record<string, unknown>,
  secret: string,
  header: Record<string, unknown> = { alg: 'HS256', typ: 'JWT' }
): string {
  const encode = (value: unknown) => Buffer.from(JSON.stringify(value)).toString('base64url');
  const unsigned = `${encode(header)}.${encode(payload)}`;
  const signature = createHmac('sha256', secret).update(unsigned).digest('base64url');
  return `${unsigned}.${signature}`;
}

/** Payload no formato do contrato (sub, company, role, employeeId, name, email) */
export function contractPayload(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  const now = Math.floor(Date.now() / 1000);
  return {
    // ObjectIds válidos, mas que não existem no banco de teste
    sub: '64b7f0c2a1b2c3d4e5f60718',
    company: '64b7f0c2a1b2c3d4e5f60719',
    role: 'leader',
    employeeId: 1,
    name: 'Pessoa Inexistente',
    email: 'inexistente@e2e.organ.test',
    iat: now,
    exp: now + 60 * 60,
    ...overrides,
  };
}
