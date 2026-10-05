import { existsSync } from 'node:fs';
import path from 'node:path';
import { chromium, defineConfig, devices } from '@playwright/test';
import {
  API_URL,
  APP_TIME_ZONE,
  E2E_API_PORT,
  E2E_FRONT_PORT,
  E2E_JWT_SECRET,
  FRONT_URL,
} from './e2e/support/env';

/**
 * Testes E2E do Organ (veja a seção "Testes E2E (Playwright)" do README).
 *
 * O webServer sobe tudo sozinho, sem serviços externos:
 *   1. organ-api + MongoDB em memória (e2e/support/start-api.mjs), porta 4600
 *   2. Next.js em produção (next build + next start), porta 3600
 * Os dois usam o mesmo JWT_SECRET de teste (e2e/support/env.ts). Os valores definidos aqui
 * têm precedência sobre o .env.local, que o Next também carrega.
 */

const isCI = !!process.env.CI;

// Chromium do Playwright se estiver instalado (npx playwright install chromium);
// senão usa o Google Chrome instalado na máquina. PW_CHANNEL força um canal (ex.: chrome, msedge).
function resolveChannel(): string | undefined {
  const forced = process.env.PW_CHANNEL;
  if (forced) return forced === 'chromium' ? undefined : forced;
  return existsSync(chromium.executablePath()) ? undefined : 'chrome';
}
const channel = resolveChannel();

// Chama o node e o binário do Next direto: funciona mesmo sem npm/npx no PATH.
// Equivale a "npm run build" + "next start -p <porta>".
const node = `"${process.execPath}"`;
const nextBin = `"${path.join(__dirname, 'node_modules', 'next', 'dist', 'bin', 'next')}"`;
const buildFront = process.env.E2E_SKIP_BUILD ? '' : `${node} ${nextBin} build && `;

export default defineConfig({
  testDir: './e2e',
  outputDir: './test-results',
  fullyParallel: true,
  forbidOnly: isCI,
  retries: isCI ? 2 : 0,
  workers: isCI ? 2 : undefined,
  timeout: 45_000,
  expect: { timeout: 10_000 },
  reporter: isCI
    ? [['github'], ['html', { open: 'never' }]]
    : [['list'], ['html', { open: 'never' }]],

  use: {
    baseURL: FRONT_URL,
    locale: 'pt-BR',
    timezoneId: APP_TIME_ZONE,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },

  projects: [
    {
      name: 'chromium',
      testIgnore: /layout\.spec\.ts/,
      use: { ...devices['Desktop Chrome'], channel },
    },
    {
      // Layout em tela de celular (Pixel 5: 393x851, touch)
      name: 'mobile',
      testMatch: /layout\.spec\.ts/,
      use: { ...devices['Pixel 5'], channel },
    },
  ],

  webServer: [
    {
      name: 'organ-api',
      command: `${node} e2e/support/start-api.mjs`,
      // Sem query a API responde 400, o que já indica que está no ar
      url: API_URL,
      reuseExistingServer: !isCI,
      timeout: 120_000,
      gracefulShutdown: { signal: 'SIGTERM', timeout: 10_000 },
      env: {
        ORGAN_API_DIR: process.env.ORGAN_API_DIR || '../organ-api',
        E2E_API_PORT: String(E2E_API_PORT),
        E2E_JWT_SECRET,
        E2E_FRONT_URL: FRONT_URL,
      },
    },
    {
      name: 'organ-front',
      command: `${buildFront}${node} ${nextBin} start -p ${E2E_FRONT_PORT}`,
      url: FRONT_URL,
      reuseExistingServer: !isCI,
      timeout: 300_000,
      gracefulShutdown: { signal: 'SIGTERM', timeout: 10_000 },
      env: {
        JWT_SECRET: E2E_JWT_SECRET,
        GRAPHQL_URL: API_URL,
        APP_TIME_ZONE,
        NEXT_TELEMETRY_DISABLED: '1',
      },
    },
  ],
});
