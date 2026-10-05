#!/usr/bin/env node
/**
 * Sobe um MongoDB em memória (mongodb-memory-server) e a organ-api apontando para ele.
 * Usado pelo webServer do playwright.config.ts, mas também roda sozinho:
 *
 *   node e2e/support/start-api.mjs
 *
 * Variáveis (todas opcionais):
 *   ORGAN_API_DIR   pasta da organ-api (padrão: ../organ-api, relativo à raiz deste projeto)
 *   E2E_API_PORT    porta da API (padrão: 4600)
 *   E2E_JWT_SECRET  segredo de TESTE do JWT (padrão: o mesmo de e2e/support/env.ts)
 *   E2E_FRONT_URL   origem liberada no CORS (padrão: http://localhost:3600)
 *
 * Isolamento: a API recebe MONGO_DB, JWT_SECRET, JWT_EXPIRES_IN, PORT e CORS_ORIGIN pelo ambiente
 * e roda com o diretório de trabalho numa pasta temporária, com DOTENV_CONFIG_PATH apontando
 * para um arquivo vazio. Assim o `.env` real da organ-api (MongoDB Atlas, segredo real) nunca é lido.
 *
 * Encerramento: SIGINT/SIGTERM/SIGHUP/SIGBREAK param a API, o mongod e apagam os temporários.
 */
import { spawn } from 'node:child_process';
import { once } from 'node:events';
import { existsSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { MongoMemoryServer } from 'mongodb-memory-server';

const log = (...args) => console.log('[e2e-api]', ...args);
const logError = (...args) => console.error('[e2e-api]', ...args);

const here = path.dirname(fileURLToPath(import.meta.url));
const frontRoot = path.resolve(here, '..', '..');
const apiDir = path.resolve(frontRoot, process.env.ORGAN_API_DIR || '../organ-api');
const serverEntry = path.join(apiDir, 'src', 'server.js');
const port = String(process.env.E2E_API_PORT || 4600);
// Mesmo padrão de e2e/support/env.ts (segredo público, só para testes)
const jwtSecret = process.env.E2E_JWT_SECRET || 'organ-e2e-jwt-secret-apenas-para-testes';
const corsOrigin = process.env.E2E_FRONT_URL || 'http://localhost:3600';

if (!existsSync(serverEntry)) {
  logError(`organ-api não encontrada em ${apiDir} (esperado ${serverEntry}). Defina ORGAN_API_DIR.`);
  process.exit(1);
}
if (!existsSync(path.join(apiDir, 'node_modules'))) {
  logError(`A organ-api em ${apiDir} não tem node_modules. Rode "npm install" nela antes dos testes.`);
  process.exit(1);
}

// Pastas fixas por porta: no Windows o Playwright encerra o webServer com "taskkill /T /F"
// (sem sinal), então a limpeza abaixo não roda; a próxima execução apaga a sobra antes de começar
const dbPath = path.join(os.tmpdir(), `organ-e2e-mongo-${port}`);
// Diretório de trabalho da API, sem .env (o dotenv procura .env no cwd)
const workDir = path.join(os.tmpdir(), `organ-e2e-api-${port}`);
const emptyEnvFile = path.join(workDir, 'empty.env');
for (const dir of [dbPath, workDir]) {
  rmSync(dir, { recursive: true, force: true });
  mkdirSync(dir, { recursive: true });
}
writeFileSync(emptyEnvFile, '');

let mongod;
let api;
let stopping = false;

function removeTemp() {
  for (const dir of [workDir, dbPath]) {
    try {
      rmSync(dir, { recursive: true, force: true, maxRetries: 5, retryDelay: 200 });
    } catch {
      // Pode falhar no Windows se o mongod ainda segura arquivos; a próxima execução limpa o dbPath
    }
  }
}

async function stopApi() {
  if (!api || api.exitCode !== null || api.signalCode !== null) return;
  const exited = once(api, 'exit');
  api.kill('SIGTERM');
  const timer = setTimeout(() => api.kill('SIGKILL'), 5_000);
  await exited;
  clearTimeout(timer);
}

async function shutdown(exitCode) {
  if (stopping) return;
  stopping = true;
  log('encerrando a API e o MongoDB em memória...');
  try {
    await stopApi();
  } catch (error) {
    logError('erro ao parar a API:', error?.message ?? error);
  }
  try {
    await mongod?.stop({ doCleanup: true, force: true });
  } catch (error) {
    logError('erro ao parar o MongoDB:', error?.message ?? error);
  }
  removeTemp();
  process.exit(exitCode);
}

for (const signal of ['SIGINT', 'SIGTERM', 'SIGHUP', 'SIGBREAK']) {
  process.on(signal, () => void shutdown(0));
}
process.on('uncaughtException', (error) => {
  logError('erro inesperado:', error);
  void shutdown(1);
});
process.on('unhandledRejection', (error) => {
  logError('erro inesperado:', error);
  void shutdown(1);
});

mongod = await MongoMemoryServer.create({
  instance: { ip: '127.0.0.1', dbPath, dbName: 'organ-e2e' },
});
if (stopping) process.exit(0);
const mongoUri = mongod.getUri('organ-e2e');
log(`MongoDB em memória pronto (${mongoUri})`);

api = spawn(process.execPath, [serverEntry], {
  cwd: workDir,
  env: {
    ...process.env,
    MONGO_DB: mongoUri,
    JWT_SECRET: jwtSecret,
    JWT_EXPIRES_IN: '8h',
    PORT: port,
    CORS_ORIGIN: corsOrigin,
    // dotenv/config lê este arquivo (vazio) em vez de procurar um .env
    DOTENV_CONFIG_PATH: emptyEnvFile,
  },
  stdio: ['ignore', 'inherit', 'inherit'],
  windowsHide: true,
});

api.on('exit', (code, signal) => {
  if (stopping) return;
  logError(`a organ-api terminou inesperadamente (code=${code}, signal=${signal}).`);
  void shutdown(Number.isInteger(code) && code > 0 && code < 256 ? code : 1);
});

log(`organ-api iniciando em http://127.0.0.1:${port}/ (código em ${apiDir})`);
