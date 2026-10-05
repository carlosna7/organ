/**
 * Configuração do ambiente E2E, compartilhada pelo playwright.config.ts e pelos testes.
 *
 * Tudo aqui é de TESTE: o banco é um MongoDB em memória (mongodb-memory-server) e o
 * segredo do JWT é fixo e público. Nunca use os valores de .env / .env.local.
 */

/** Porta da organ-api subida por e2e/support/start-api.mjs */
export const E2E_API_PORT = Number(process.env.E2E_API_PORT || 4600);

/** Porta do Next.js (next start) usado nos testes */
export const E2E_FRONT_PORT = Number(process.env.E2E_FRONT_PORT || 3600);

/**
 * Segredo do JWT só para testes. A API assina e o middleware do front verifica com ele.
 * Mantenha igual ao padrão de e2e/support/start-api.mjs.
 */
export const E2E_JWT_SECRET = 'organ-e2e-jwt-secret-apenas-para-testes';

/** Endpoint GraphQL da API de teste (a API responde na raiz "/") */
export const API_URL = `http://127.0.0.1:${E2E_API_PORT}/`;

/** URL do front de teste (localhost: o Chromium aceita cookie "secure" em http://localhost) */
export const FRONT_URL = `http://localhost:${E2E_FRONT_PORT}`;

/** Fuso usado pelo front para exibir datas (fixo para os testes calcularem a data esperada) */
export const APP_TIME_ZONE = 'America/Sao_Paulo';

/** Nome do cookie httpOnly com o JWT (src/lib/auth/config.ts) */
export const AUTH_COOKIE = 'organ-auth-token';
